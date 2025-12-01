"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  Users,
  Search,
  Check,
  X,
  Clock,
  Film,
  Loader2,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface Friend {
  id: string;
  name: string | null;
  username: string;
  avatar?: string;
}

interface FriendRequest {
  id: string;
  fromUser: Friend;
  toUser: Friend;
  sentAt: string;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Real State
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [currentFriends, setCurrentFriends] = useState<Set<string>>(new Set());
  const [friendsList, setFriendsList] = useState<Friend[]>([]); // Store full friend objects

  // Fetch real data on mount and periodically
  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        const token = localStorage.getItem("movienight_token");
        const headers = { Authorization: token ? `Bearer ${token}` : "" };

        // Use consolidated endpoint
        const res = await fetch("/api/friends", { headers, credentials: "include" });
        const data = await res.json();

        if (data.success) {
          const friends = data.data.friends || [];
          const incoming = data.data.incomingRequests || [];
          const outgoing = data.data.outgoingRequests || [];

          setFriendsList(friends);
          setCurrentFriends(new Set(friends.map((f: any) => f.userId)));
          setIncomingRequests(incoming);
          setSentRequests(new Set(outgoing.map((r: any) => r.toUserId)));
        }
      } catch (error) {
        console.error("Failed to fetch friends data:", error);
      }
    };

    if (user) {
      // Fetch immediately on mount
      fetchFriendsData();

      // Poll every 5 seconds to detect new incoming requests
      const interval = setInterval(fetchFriendsData, 5000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch(
        `/api/auth/search-users?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        },
      );
      const data = await res.json();

      if (data.success) {
        // Filter out self
        const results = data.data.filter(
          (u: Friend) => u.username !== user?.username,
        );
        setSearchResults(results);

        if (results.length === 0) {
          setMessage({ type: "info", text: "No users found" });
          setTimeout(() => setMessage(null), 3000);
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: "Search failed" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId: string, username: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ toUserId: targetUserId }),
      });

      const data = await res.json();

      if (data.success) {
        setSentRequests((prev) => new Set([...prev, targetUserId]));
        setMessage({ type: "success", text: `Request sent to @${username}` });
        toast({
          title: "Request sent! ✨",
          description: `${username} will see your friend request.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send request",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAcceptRequest = async (requestId: string, username: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        // Optimistic update
        const request = incomingRequests.find((r) => r.id === requestId);
        if (request) {
          const newFriend = {
            id: request.fromUser.id, // This needs to match the structure of Friend
            name: request.fromUser.name,
            username: request.fromUser.username,
            // userId property for consistency with fetched friends
            userId: request.fromUser.id,
          };

          setFriendsList((prev) => [...prev, newFriend as unknown as Friend]);
          setCurrentFriends((prev) => new Set([...prev, request.fromUser.id]));
          setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
        }

        setMessage({
          type: "success",
          text: `You're now friends with @${username}!`,
        });
        toast({
          title: "Friend added! 🎉",
          description: `${username} is now in your squad.`,
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to accept request" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRejectRequest = async (requestId: string, username: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action: "reject" }),
      });

      if (res.ok) {
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
        setMessage({
          type: "info",
          text: `Declined request from @${username}`,
        });
      }
    } catch (error) {
      console.error(error);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusForUser = (targetUserId: string) => {
    if (currentFriends.has(targetUserId)) return "friends";
    if (sentRequests.has(targetUserId)) return "sent";
    return "none";
  };

  const userFriendsArray = friendsList;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Squad</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your movie-watching circle and connect with friends.
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className={cn(
            message.type === "success" &&
              "border-green-500 bg-green-50 dark:bg-green-950",
            message.type === "info" &&
              "border-blue-500 bg-blue-50 dark:bg-blue-950",
          )}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Search & Add Friend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Friends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Search Results
              </h4>
              <div className="space-y-2">
                {searchResults.map((foundUser) => {
                  const status = getStatusForUser(foundUser.id);
                  return (
                    <div
                      key={foundUser.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {foundUser.name || foundUser.username || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{foundUser.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status === "friends" && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Friends
                          </Badge>
                        )}
                        {status === "sent" && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {status === "none" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleSendRequest(
                                foundUser.id,
                                foundUser.username,
                              )
                            }
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Send Request
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Friend Requests */}
      {(incomingRequests.length > 0 || sentRequests.size > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">📥 Incoming Requests</h3>
                <div className="space-y-2">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-accent/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {request.fromUser.name ||
                              request.fromUser.username ||
                              "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{request.fromUser.username} •{" "}
                            {formatDate(request.sentAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAcceptRequest(
                              request.id,
                              request.fromUser.username,
                            )
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRejectRequest(
                              request.id,
                              request.fromUser.username,
                            )
                          }
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Your Squad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            🎬 Your Squad
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {userFriendsArray.length} friend
            {userFriendsArray.length !== 1 ? "s" : ""} in your movie circle
          </p>
        </CardHeader>
        <CardContent>
          {userFriendsArray.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
              <p className="text-muted-foreground">
                Search for friends above to start building your movie-watching
                squad!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userFriendsArray.map((friend) => (
                <Card
                  key={friend.id}
                  className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Friend Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {(friend.name || friend.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {friend.name || friend.username || "Unknown"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            @{friend.username}
                          </p>
                        </div>
                        <div className="text-2xl">🎭</div>
                      </div>

                      {/* No Activity Message */}
                      <div className="bg-accent/20 p-3 rounded-lg text-center">
                        <div className="text-2xl mb-1">🍿</div>
                        <p className="text-xs text-muted-foreground">
                          Watching together soon!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

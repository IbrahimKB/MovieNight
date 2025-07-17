import { useState, useEffect } from "react";
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
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Friend,
  FriendRequest,
  getUserFriends,
  getIncomingRequests,
  getOutgoingRequests,
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  areFriends,
  hasExistingRequest,
} from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { captureUserAction, captureApiError } from "@/lib/sentry";

export default function Squad() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Real data from API
  const [userFriends, setUserFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  if (!user) return null;

  // Load initial data
  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      captureUserAction("load_friends_data", user.id);

      const [friends, incoming, outgoing] = await Promise.all([
        getUserFriends(user.id),
        getIncomingRequests(user.id),
        getOutgoingRequests(user.id),
      ]);

      setUserFriends(friends);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);

      captureUserAction("friends_data_loaded", user.id, {
        friendsCount: friends.length,
        incomingCount: incoming.length,
        outgoingCount: outgoing.length,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
      captureApiError(error, "load_friends_data", user.id);
      toast({
        title: "Error",
        description: "Failed to load friends data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      // Filter out current user from results
      const filteredResults = results.filter((u) => u.id !== user.id);
      setSearchResults(filteredResults);

      if (filteredResults.length === 0) {
        setMessage({ type: "error", text: "User not found" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Search error:", error);
      setMessage({ type: "error", text: "Search failed. Please try again." });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId: string, username: string) => {
    // Check if already friends
    if (areFriends(user.id, targetUserId, userFriends)) {
      setMessage({
        type: "info",
        text: `You're already friends with @${username}`,
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Check if request already exists
    const existingRequest = hasExistingRequest(
      user.id,
      targetUserId,
      incomingRequests,
      outgoingRequests,
    );
    if (existingRequest) {
      setMessage({
        type: "info",
        text: `Request already sent to @${username}`,
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      await sendFriendRequest(user.id, targetUserId);
      setMessage({ type: "success", text: `Request sent to @${username}` });
      setTimeout(() => setMessage(null), 3000);

      // Refresh data to show updated state
      await loadData();
    } catch (error) {
      console.error("Send request error:", error);
      setMessage({ type: "error", text: "Failed to send request" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAcceptRequest = async (requestId: string, username: string) => {
    try {
      await respondToFriendRequest(user.id, requestId, "accept");
      setMessage({
        type: "success",
        text: `You're now friends with @${username}!`,
      });
      setTimeout(() => setMessage(null), 3000);

      // Refresh data to show updated state
      await loadData();
    } catch (error) {
      console.error("Accept request error:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string, username: string) => {
    try {
      await respondToFriendRequest(user.id, requestId, "reject");
      setMessage({ type: "info", text: `Declined request from @${username}` });
      setTimeout(() => setMessage(null), 3000);

      // Refresh data to show updated state
      await loadData();
    } catch (error) {
      console.error("Reject request error:", error);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusForUser = (targetUserId: string) => {
    if (areFriends(user.id, targetUserId, userFriends)) return "friends";
    const existingRequest = hasExistingRequest(
      user.id,
      targetUserId,
      incomingRequests,
      outgoingRequests,
    );
    if (existingRequest) {
      if (existingRequest.fromUserId === user.id) return "sent";
      return "received";
    }
    return "none";
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Squad</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your movie-watching circle and connect with friends.
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Squad</h1>
        </div>
        <p className="text-muted-foreground text-lg">
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
                          <p className="font-medium">{foundUser.name}</p>
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
                        {status === "received" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            Sent you a request
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
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
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
                          <p className="font-medium">{request.fromUser.name}</p>
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

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">📤 Sent Requests</h3>
                <div className="space-y-2">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{request.toUser?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{request.toUser?.username} •{" "}
                            {formatDate(request.sentAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-yellow-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending...
                      </Badge>
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
            {userFriends.length} friend{userFriends.length !== 1 ? "s" : ""} in
            your movie circle
          </p>
        </CardHeader>
        <CardContent>
          {userFriends.length === 0 ? (
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
              {userFriends.map((friend) => (
                <Card
                  key={friend.id}
                  className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Friend Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg">
                            {friend.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{friend.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            @{friend.username}
                          </p>
                        </div>
                        <div className="text-2xl">🎭</div>
                      </div>

                      {/* Friends Since */}
                      {friend.friendsSince && (
                        <div className="bg-accent/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">
                              Friends since:
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(friend.friendsSince)}
                          </p>
                        </div>
                      )}

                      {/* No Activity Placeholder */}
                      {!friend.friendsSince && (
                        <div className="bg-accent/20 p-3 rounded-lg text-center">
                          <div className="text-2xl mb-1">🍿</div>
                          <p className="text-xs text-muted-foreground">
                            Ready for movie night!
                          </p>
                        </div>
                      )}
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

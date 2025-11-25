'use client';

import { useEffect, useState } from "react";
import { Search, Plus, UserX, Check, X as XIcon } from "lucide-react";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  friendshipId?: string;
}

interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  toUser?: {
    id: string;
    name: string;
    username: string;
  };
  status: string;
}

type Tab = "friends" | "requests" | "search";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
          fetch("/api/friends", { headers }),
          fetch("/api/friends/incoming", { headers }),
          fetch("/api/friends/outgoing", { headers }),
        ]);

        const friendsData = await friendsRes.json();
        const incomingData = await incomingRes.json();
        const outgoingData = await outgoingRes.json();

        if (friendsData.success && friendsData.data?.friends) {
          setFriends(friendsData.data.friends);
        }

        if (incomingData.success && Array.isArray(incomingData.data)) {
          setIncomingRequests(incomingData.data);
        }

        if (outgoingData.success && Array.isArray(outgoingData.data)) {
          setOutgoingRequests(outgoingData.data);
        }
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsData();
  }, [token]);

  const handleSearchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/auth/search-users?q=${encodeURIComponent(query)}`,
        { headers },
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers,
        body: JSON.stringify({ targetUserId }),
  fromUser: Friend;
  toUser: Friend;
  sentAt: string;
}

// Mock data
const mockFriends: Friend[] = [
  { id: '1', name: 'Ibrahim', username: 'ibrahim' },
  { id: '2', name: 'Omar', username: 'omar' },
  { id: '3', name: 'Sara', username: 'sara' },
  { id: '4', name: 'Alex', username: 'alex' },
  { id: '5', name: 'Maya', username: 'maya' },
];

const mockAllUsers: Friend[] = [
  ...mockFriends,
  { id: '6', name: 'Jordan', username: 'jordan' },
  { id: '7', name: 'Casey', username: 'casey' },
  { id: '8', name: 'Morgan', username: 'morgan' },
];

const mockIncomingRequests: FriendRequest[] = [
  {
    id: 'req-1',
    fromUser: mockAllUsers[5],
    toUser: mockAllUsers[0],
    sentAt: '2024-01-14T10:30:00Z',
  },
];

const mockOutgoingRequests: FriendRequest[] = [
  {
    id: 'req-2',
    fromUser: mockAllUsers[0],
    toUser: mockAllUsers[6],
    sentAt: '2024-01-13T15:45:00Z',
  },
];

export default function FriendsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(
    new Set(mockOutgoingRequests.map((r) => r.toUser.id))
  );
  const [incomingRequests, setIncomingRequests] =
    useState<FriendRequest[]>(mockIncomingRequests);
  const [currentFriends, setCurrentFriends] = useState<Set<string>>(
    new Set(mockFriends.map((f) => f.id))
  );

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const results = mockAllUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);

      if (results.length === 0) {
        setMessage({ type: 'error', text: 'User not found' });
        setTimeout(() => setMessage(null), 3000);
      }
    }, 500);
  };

  const handleSendRequest = (targetUserId: string, username: string) => {
    if (currentFriends.has(targetUserId)) {
      setMessage({
        type: 'info',
        text: `You're already friends with @${username}`,
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (sentRequests.has(targetUserId)) {
      setMessage({
        type: 'info',
        text: `Request already sent to @${username}`,
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

      if (res.ok) {
        setSearchResults(
          searchResults.filter((user) => user.id !== targetUserId),
        );
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleRespondToRequest = async (
    friendshipId: string,
    action: "accept" | "reject",
  ) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        if (action === "accept") {
          const request = incomingRequests.find((r) => r.id === friendshipId);
          if (request) {
            setFriends([...friends, request.fromUser as Friend]);
          }
        }
        setIncomingRequests(
          incomingRequests.filter((r) => r.id !== friendshipId),
        );
      }
    } catch (error) {
      console.error("Failed to respond to request:", error);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setFriends(friends.filter((f) => f.friendshipId !== friendshipId));
      }
    } catch (error) {
      console.error("Failed to remove friend:", error);
    }
  };

  const FriendCard = ({
    friend,
    onRemove,
  }: {
    friend: Friend;
    onRemove?: (friendshipId: string) => void;
  }) => (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        {friend.avatar ? (
          <img
            src={friend.avatar}
            alt={friend.name}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {friend.name?.[0] || friend.username[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold">{friend.name || friend.username}</p>
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
        </div>
        {onRemove && friend.friendshipId && (
          <button
            onClick={() => onRemove(friend.friendshipId!)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <UserX size={18} />
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading friends...</p>
    setSentRequests((prev) => new Set([...prev, targetUserId]));
    setMessage({ type: 'success', text: `Request sent to @${username}` });
    setTimeout(() => setMessage(null), 3000);
    toast({
      title: 'Request sent! ✨',
      description: `${username} will see your friend request.`,
    });
  };

  const handleAcceptRequest = (requestId: string, username: string) => {
    const request = incomingRequests.find((r) => r.id === requestId);
    if (request) {
      setCurrentFriends((prev) => new Set([...prev, request.fromUser.id]));
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMessage({
        type: 'success',
        text: `You're now friends with @${username}!`,
      });
      toast({
        title: 'Friend added! 🎉',
        description: `${username} is now in your squad.`,
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRejectRequest = (requestId: string, username: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    setMessage({ type: 'info', text: `Declined request from @${username}` });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusForUser = (targetUserId: string) => {
    if (currentFriends.has(targetUserId)) return 'friends';
    if (sentRequests.has(targetUserId)) return 'sent';
    return 'none';
  };

  const userFriendsArray = Array.from(currentFriends)
    .map((id) => mockFriends.find((f) => f.id === id))
    .filter(Boolean) as Friend[];

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
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Friends</h1>
        <p className="text-muted-foreground">
          Connect with friends and share movie moments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "friends"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Requests ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "search"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Find Friends
        </button>
      </div>

      {/* Friends List */}
      {activeTab === "friends" && (
        <div className="space-y-4">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onRemove={handleRemoveFriend}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground mb-4">
                You don't have any friends yet
              </p>
              <button
                onClick={() => setActiveTab("search")}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Find Friends
              </button>
            </div>
          )}
        </div>
      )}

      {/* Requests */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {incomingRequests.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Incoming Requests</h3>
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {request.fromUser.avatar ? (
                      <img
                        src={request.fromUser.avatar}
                        alt={request.fromUser.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {request.fromUser.name?.[0] ||
                          request.fromUser.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {request.fromUser.name || request.fromUser.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{request.fromUser.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleRespondToRequest(request.id, "accept")
                      }
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() =>
                        handleRespondToRequest(request.id, "reject")
                      }
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <XIcon size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No friend requests</p>
            </div>
          )}

          {outgoingRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sent Requests</h3>
              {outgoingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {request.toUser?.name?.[0] ||
                        request.toUser?.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {request.toUser?.name || request.toUser?.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{request.toUser?.username}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Pending...
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {activeTab === "search" && (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-3.5 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearchUsers(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Results */}
          {searching ? (
            <p className="text-muted-foreground text-center py-6">
              Searching...
            </p>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user.name?.[0] || user.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {user.name || user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendFriendRequest(user.id)}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">
                Search for friends to add them
              </p>
            </div>
          )}
        </div>
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
            {userFriendsArray.length !== 1 ? 's' : ''} in your movie circle
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

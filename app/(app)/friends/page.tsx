"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  friendshipId?: string;
  friendsSince?: string;
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
    avatar?: string;
  };
  sentAt: string;
}

interface FriendsData {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
}

export default function FriendsPage() {
  const [data, setData] = useState<FriendsData>({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
  });
  const [tab, setTab] = useState<"friends" | "incoming" | "outgoing">(
    "friends",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFriendId, setNewFriendId] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch("/api/friends", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to fetch friends");
        return;
      }

      setData(result.data);
    } catch (err) {
      setError("An error occurred");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendId.trim()) return;

    setActionLoading("send");
    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ toUserId: newFriendId }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewFriendId("");
        toast({
          title: "Success",
          description: "Friend request sent successfully",
        });
        fetchFriends();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send friend request",
          variant: "error",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "An error occurred while sending the request",
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondToRequest = async (
    friendshipId: string,
    action: "accept" | "reject",
  ) => {
    setActionLoading(friendshipId);
    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description:
            action === "accept"
              ? "Friend request accepted"
              : "Friend request rejected",
        });
        fetchFriends();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to respond to friend request",
          variant: "error",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "An error occurred while responding to the request",
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Friends</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Friend</h2>
        <form onSubmit={handleAddFriend} className="flex gap-2">
          <input
            type="text"
            value={newFriendId}
            onChange={(e) => setNewFriendId(e.target.value)}
            placeholder="Enter user ID or username..."
            className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={actionLoading === "send"}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === "send" ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>

      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setTab("friends")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "friends"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Friends ({data.friends.length})
        </button>
        <button
          onClick={() => setTab("incoming")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "incoming"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Incoming ({data.incomingRequests.length})
        </button>
        <button
          onClick={() => setTab("outgoing")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "outgoing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Outgoing ({data.outgoingRequests.length})
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : tab === "friends" ? (
        data.friends.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No friends yet
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {friend.avatar && (
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{friend.name || friend.username}</p>
                    <p className="text-xs text-muted-foreground">
                      @{friend.username}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )
      ) : tab === "incoming" ? (
        data.incomingRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No incoming requests
          </p>
        ) : (
          <div className="space-y-4">
            {data.incomingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {request.fromUser.avatar && (
                    <img
                      src={request.fromUser.avatar}
                      alt={request.fromUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{request.fromUser.name || request.fromUser.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent {new Date(request.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button
                     onClick={() => handleRespondToRequest(request.id, "accept")}
                     disabled={actionLoading === request.id}
                     className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {actionLoading === request.id ? "..." : "Accept"}
                   </button>
                   <button
                     onClick={() => handleRespondToRequest(request.id, "reject")}
                     disabled={actionLoading === request.id}
                     className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {actionLoading === request.id ? "..." : "Reject"}
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )
      ) : data.outgoingRequests.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No outgoing requests
        </p>
      ) : (
        <div className="space-y-4">
          {data.outgoingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {request.toUser?.avatar && (
                  <img
                    src={request.toUser.avatar}
                    alt={request.toUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{request.toUser?.name || request.toUser?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {new Date(request.sentAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                Pending
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

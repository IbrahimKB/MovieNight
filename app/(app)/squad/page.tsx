"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Friend {
  id: string;
  username: string;
  email: string;
  name?: string;
}

export default function SquadPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "friends" | "incoming" | "outgoing"
  >("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;

    const fetchFriendsData = async () => {
      try {
        const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
          fetch("/api/friends", { credentials: "include" }),
          fetch("/api/friends/incoming", { credentials: "include" }),
          fetch("/api/friends/outgoing", { credentials: "include" }),
        ]);

        const friendsData = await friendsRes.json();
        const incomingData = await incomingRes.json();
        const outgoingData = await outgoingRes.json();

        setFriends(friendsData.data || []);
        setIncomingRequests(incomingData.data || []);
        setOutgoingRequests(outgoingData.data || []);
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsData();
  }, [mounted, user]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "incoming", label: "Requests", count: incomingRequests.length },
    { id: "outgoing", label: "Pending", count: outgoingRequests.length },
  ];

  const FriendCard = ({
    friend,
    showActions = true,
    actionType = "default",
  }: {
    friend: Friend;
    showActions?: boolean;
    actionType?: "accept" | "cancel" | "default";
  }) => (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
          🎬
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base md:text-lg">
            {friend.name || friend.username}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground truncate">
            @{friend.username}
          </p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 w-full sm:w-auto">
          {actionType === "accept" ? (
            <>
              <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                <CheckCircle size={16} />
                <span className="hidden sm:inline">Accept</span>
              </button>
              <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                <XCircle size={16} />
                <span className="hidden sm:inline">Decline</span>
              </button>
            </>
          ) : actionType === "cancel" ? (
            <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center justify-center gap-2 text-sm whitespace-nowrap">
              <XCircle size={16} />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          ) : (
            <>
              <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors font-medium flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                <MessageCircle size={16} />
                <span className="hidden sm:inline">Message</span>
              </button>
              <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors font-medium flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                <Trash2 size={16} />
                <span className="hidden sm:inline">Remove</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Friends</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Connect with friends and see what they're watching
          </p>
        </div>

        {/* Add Friend Button */}
        <div className="mb-8">
          <button className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold flex items-center gap-2 text-sm md:text-base">
            <UserPlus size={18} />
            Add Friend
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-8 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "friends" | "incoming" | "outgoing")
              }
              className={`px-3 md:px-6 py-3 font-medium border-b-2 transition-all whitespace-nowrap text-sm md:text-base ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}{" "}
              <span className="hidden sm:inline">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "friends" ? (
          loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    showActions={true}
                    actionType="default"
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Users
                    size={48}
                    className="text-muted-foreground mx-auto mb-4"
                  />
                  <h2 className="text-xl font-semibold mb-2">No friends yet</h2>
                  <p className="text-muted-foreground">
                    Add friends to start sharing movie recommendations
                  </p>
                </div>
              )}
            </div>
          )
        ) : activeTab === "incoming" ? (
          loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {incomingRequests.length > 0 ? (
                incomingRequests.map((request) => (
                  <FriendCard
                    key={request.id}
                    friend={request}
                    showActions={true}
                    actionType="accept"
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Users
                    size={48}
                    className="text-muted-foreground mx-auto mb-4"
                  />
                  <h2 className="text-xl font-semibold mb-2">
                    No pending requests
                  </h2>
                  <p className="text-muted-foreground">
                    You'll see incoming friend requests here
                  </p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-3 md:space-y-4">
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map((request) => (
                <FriendCard
                  key={request.id}
                  friend={request}
                  showActions={true}
                  actionType="cancel"
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Users
                  size={48}
                  className="text-muted-foreground mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold mb-2">
                  No pending requests
                </h2>
                <p className="text-muted-foreground">
                  Friend requests you've sent will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface Friend {
  id: string;
  userId: string;
  username: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId?: string;
  username: string;
  createdAt: string;
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
  const [tab, setTab] = useState<'friends' | 'incoming' | 'outgoing'>('friends');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFriendId, setNewFriendId] = useState('');

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends');
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to fetch friends');
        return;
      }

      setData(result.data);
    } catch (err) {
      setError('An error occurred');
      console.error('Error:', err);
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

    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: newFriendId }),
      });

      if (res.ok) {
        setNewFriendId('');
        fetchFriends();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleRespondToRequest = async (
    friendshipId: string,
    action: 'accept' | 'reject'
  ) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (err) {
      console.error('Error:', err);
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
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Send Request
          </button>
        </form>
      </div>

      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setTab('friends')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'friends'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Friends ({data.friends.length})
        </button>
        <button
          onClick={() => setTab('incoming')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'incoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Incoming ({data.incomingRequests.length})
        </button>
        <button
          onClick={() => setTab('outgoing')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'outgoing'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Outgoing ({data.outgoingRequests.length})
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : tab === 'friends' ? (
        data.friends.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No friends yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{friend.username}</p>
                  <p className="text-xs text-muted-foreground">ID: {friend.userId}</p>
                </div>
                <button className="px-3 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )
      ) : tab === 'incoming' ? (
        data.incomingRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No incoming requests</p>
        ) : (
          <div className="space-y-4">
            {data.incomingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{request.username}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespondToRequest(request.id, 'accept')}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:opacity-90 transition-opacity"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToRequest(request.id, 'reject')}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:opacity-90 transition-opacity"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : data.outgoingRequests.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No outgoing requests</p>
      ) : (
        <div className="space-y-4">
          {data.outgoingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{request.username}</p>
                <p className="text-xs text-muted-foreground">
                  Sent {new Date(request.createdAt).toLocaleDateString()}
                </p>
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

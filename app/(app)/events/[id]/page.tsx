'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface EventDetail {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
  movieYear?: number;
  movieDescription?: string;
  movieGenres?: string[];
  hostUserId: string;
  hostUsername: string;
  participants: string[];
  date: string;
  notes?: string;
  isHost: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Friend {
  userId: string;
  username: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editedDate, setEditedDate] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, friendsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch('/api/friends'),
        ]);

        const eventData = await eventRes.json();
        const friendsData = await friendsRes.json();

        if (!eventRes.ok) {
          setError(eventData.error || 'Event not found');
          return;
        }

        setEvent(eventData.data);
        setEditedDate(new Date(eventData.data.date).toISOString().slice(0, 16));
        setEditedNotes(eventData.data.notes || '');
        setSelectedParticipants(eventData.data.participants);

        if (friendsRes.ok) {
          setFriends(friendsData.data?.friends || []);
        }
      } catch (err) {
        setError('Failed to load event');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleSaveChanges = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(editedDate).toISOString(),
          notes: editedNotes || undefined,
          participants: selectedParticipants,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update event');
        return;
      }

      setEvent({
        ...event!,
        date: editedDate,
        notes: editedNotes,
        participants: selectedParticipants,
      });
      setEditing(false);
    } catch (err) {
      setError('An error occurred');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });

      if (res.ok) {
        router.push('/calendar');
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      setError('An error occurred');
      console.error('Error:', err);
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!event) {
    return (
      <div>
        <p className="text-destructive mb-4">{error || 'Event not found'}</p>
        <Link href="/calendar" className="text-primary hover:underline">
          Back to Calendar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/calendar" className="text-primary hover:underline text-sm">
          ← Back to Calendar
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movie Info */}
        <div className="lg:col-span-1">
          {event.moviePoster && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
              <img
                src={event.moviePoster}
                alt={event.movieTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{event.movieTitle}</h3>
            {event.movieYear && <p className="text-sm text-muted-foreground mb-3">({event.movieYear})</p>}
            {event.movieGenres && event.movieGenres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {event.movieGenres.map((genre, idx) => (
                  <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            {event.movieDescription && (
              <p className="text-sm text-muted-foreground">{event.movieDescription}</p>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="lg:col-span-2">
          {!editing ? (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{event.movieTitle}</h1>
                <p className="text-muted-foreground">
                  Hosted by <span className="font-medium text-foreground">{event.hostUsername}</span>
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Date & Time</p>
                <p className="text-lg">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {event.notes && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-foreground">{event.notes}</p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Participants ({event.participants.length})</p>
                <div className="space-y-2">
                  {event.participants.map((participant) => (
                    <div
                      key={participant}
                      className="px-3 py-2 bg-muted rounded-lg text-sm flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {participant}
                    </div>
                  ))}
                </div>
              </div>

              {event.isHost && (
                <div className="border-t border-border pt-4 flex gap-3">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Edit Event
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 px-4 bg-destructive/10 text-destructive rounded-lg font-medium hover:bg-destructive/20 transition-colors"
                  >
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveChanges} className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold mb-4">Edit Event</h2>

              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium mb-2">
                  Date & Time
                </label>
                <input
                  id="edit-date"
                  type="datetime-local"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="edit-notes"
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Participants</label>
                <div className="space-y-2">
                  {friends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No friends to invite</p>
                  ) : (
                    friends.map((friend) => (
                      <label
                        key={friend.userId}
                        className="flex items-center gap-3 cursor-pointer p-2 hover:bg-muted rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(friend.userId)}
                          onChange={() => toggleParticipant(friend.userId)}
                          className="rounded border border-input"
                        />
                        <span className="text-sm">{friend.username}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

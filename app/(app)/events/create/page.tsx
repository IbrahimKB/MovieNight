"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, X } from "lucide-react";
import { toast } from "sonner";

interface Movie {
  id: string;
  title: string;
  year: number;
  poster?: string;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null);
  const [invitedFriendIds, setInvitedFriendIds] = useState<Set<string>>(
    new Set()
  );
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, friendsRes] = await Promise.all([
          fetch("/api/movies", { credentials: "include" }),
          fetch("/api/friends", { credentials: "include" }),
        ]);

        const moviesData = await moviesRes.json();
        if (moviesData.success && Array.isArray(moviesData.data)) {
          setMovies(moviesData.data.slice(0, 20));
        }

        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
          // Filter for accepted friendships only
          const acceptedFriends = friendsData.data.filter(
            (f: any) => f.status === "accepted"
          );
          setFriends(acceptedFriends);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFriendInvite = (friendId: string) => {
    const newSet = new Set(invitedFriendIds);
    if (newSet.has(friendId)) {
      newSet.delete(friendId);
    } else {
      newSet.add(friendId);
    }
    setInvitedFriendIds(newSet);
  };

  const removeFriendInvite = (friendId: string) => {
    const newSet = new Set(invitedFriendIds);
    newSet.delete(friendId);
    setInvitedFriendIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie || !eventDate) return;

    setSubmitting(true);
    try {
      const combinedDateTime = new Date(
        `${eventDate}T${eventTime}`,
      ).toISOString();

      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          movieId: selectedMovie,
          date: combinedDateTime,
          notes,
          invitedUsers: Array.from(invitedFriendIds),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Event created with ${data.data?.invitations || 0} invitations sent!`
        );
        router.push(`/events/${data.data?.id || ""}`);
      } else {
        toast.error("Failed to create event");
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const selectedMovieData = movies.find((m) => m.id === selectedMovie);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          Create Movie Event
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Plan a movie night with your friends
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Movie Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium">Select a Movie</label>
          <div className="bg-card border border-border rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
            {movies.map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => setSelectedMovie(movie.id)}
                className={`w-full text-left p-3 rounded-lg transition-all flex gap-3 ${
                  selectedMovie === movie.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary/50 border border-border"
                }`}
              >
                {movie.poster && (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-10 h-14 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{movie.title}</p>
                  <p className="text-xs opacity-75">{movie.year}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Movie Preview */}
        {selectedMovieData && (
          <div className="bg-card border border-primary/50 rounded-xl p-4 flex gap-4">
            {selectedMovieData.poster && (
              <img
                src={selectedMovieData.poster}
                alt={selectedMovieData.title}
                className="w-16 h-24 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold">{selectedMovieData.title}</p>
              <p className="text-sm text-muted-foreground">
                {selectedMovieData.year}
              </p>
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Event Date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Event Time</label>
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Friend Invitations */}
        <div className="space-y-4">
          <label className="block text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Invite Friends (Optional)
          </label>

          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              No friends to invite. Add friends first to invite them to events.
            </p>
          ) : (
            <>
              {/* Friend Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-card border border-border rounded-xl p-4">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriendInvite(friend.id)}
                    className={`p-3 rounded-lg transition-all flex flex-col items-center gap-2 text-center ${
                      invitedFriendIds.has(friend.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border hover:border-primary/50"
                    }`}
                  >
                    {friend.avatar && (
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {friend.name || friend.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Friends Summary */}
              {invitedFriendIds.size > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {invitedFriendIds.size} friend{invitedFriendIds.size > 1 ? "s" : ""} invited
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(invitedFriendIds).map((friendId) => {
                      const friend = friends.find((f) => f.id === friendId);
                      if (!friend) return null;
                      return (
                        <div
                          key={friendId}
                          className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                        >
                          <span>{friend.name || friend.username}</span>
                          <button
                            type="button"
                            onClick={() => removeFriendInvite(friendId)}
                            className="hover:opacity-70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details about the event, location, snacks, etc."
            className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all resize-none h-24"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-card transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedMovie || !eventDate || submitting}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}

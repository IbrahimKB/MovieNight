"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Movie {
  id: string;
  title: string;
  year: number;
  poster?: string;
}

interface Friend {
  userId: string;
  username: string;
}

function CreateEventPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledMovieId = searchParams.get("movieId");
  const prefilledFromUserId = searchParams.get("fromUserId");

  const [movieId, setMovieId] = useState(prefilledMovieId || "");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    prefilledFromUserId ? [prefilledFromUserId] : [],
  );

  const [movies, setMovies] = useState<Movie[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, friendsRes] = await Promise.all([
          fetch("/api/movies?limit=100"),
          fetch("/api/friends"),
        ]);

        const moviesData = await moviesRes.json();
        const friendsData = await friendsRes.json();

        if (moviesRes.ok) {
          setMovies(moviesData.data || []);
        }
        if (friendsRes.ok) {
          setFriends(friendsData.data?.friends || []);
        }
      } catch (err) {
        setError("Failed to load data");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          date,
          notes: notes || undefined,
          participants: selectedParticipants,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create event");
        return;
      }

      router.push(`/events/${data.data.id}`);
    } catch (err) {
      setError("An error occurred");
      console.error("Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Create Movie Night</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-lg p-6 space-y-6"
      >
        {/* Movie Selection */}
        <div>
          <label htmlFor="movieId" className="block text-sm font-medium mb-2">
            Movie <span className="text-destructive">*</span>
          </label>
          <select
            id="movieId"
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a movie...</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title} ({movie.year})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-2">
            Date & Time <span className="text-destructive">*</span>
          </label>
          <input
            id="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the movie night..."
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            rows={4}
          />
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Invite Friends
          </label>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No friends to invite
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
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
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Movie Night"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <CreateEventPageInner />
    </Suspense>
  );
}

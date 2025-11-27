"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Check, Bookmark } from "lucide-react";

interface Suggestion {
  id: string;
  movieId: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  status: string;
  movie?: {
    id: string;
    title: string;
    year: number;
    poster?: string;
  };
  fromUser?: {
    id: string;
    name: string;
    username: string;
  };
  toUser?: {
    id: string;
    name: string;
    username: string;
  };
}

type Tab = "received" | "sent";

export default function SuggestionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [receivedSuggestions, setReceivedSuggestions] = useState<Suggestion[]>(
    [],
  );
  const [sentSuggestions, setSentSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch("/api/suggestions", { headers });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Separate by direction
          const received = data.data.filter(
            (s: Suggestion) => s.status === "pending",
          );
          const sent = data.data.filter(
            (s: Suggestion) => s.status !== "pending",
          );

          setReceivedSuggestions(received);
          setSentSuggestions(sent);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [token]);

  const handleAcceptSuggestion = async (
    suggestionId: string,
    movieId: string,
  ) => {
    try {
      // Add to watchlist
      await fetch("/api/watch/desire", {
        method: "POST",
        headers,
        body: JSON.stringify({ movieId, suggestionId }),
      });

      // Update status
      setReceivedSuggestions(
        receivedSuggestions.filter((s) => s.id !== suggestionId),
      );
    } catch (error) {
      console.error("Failed to accept suggestion:", error);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setReceivedSuggestions(
          receivedSuggestions.filter((s) => s.id !== suggestionId),
        );
      }
    } catch (error) {
      console.error("Failed to reject suggestion:", error);
    }
  };

  const handleDeleteSentSuggestion = async (suggestionId: string) => {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setSentSuggestions(
          sentSuggestions.filter((s) => s.id !== suggestionId),
        );
      }
    } catch (error) {
      console.error("Failed to delete suggestion:", error);
    }
  };

  const SuggestionCard = ({
    suggestion,
    onAccept,
    onReject,
    onDelete,
    isReceived,
  }: {
    suggestion: Suggestion;
    onAccept?: () => void;
    onReject?: () => void;
    onDelete?: () => void;
    isReceived?: boolean;
  }) => (
    <div className="bg-card border border-border rounded-lg p-4 flex gap-4">
      <div
        onClick={() => router.push(`/movies/${suggestion.movieId}`)}
        className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      >
        {suggestion.movie?.poster ? (
          <img
            src={suggestion.movie.poster}
            alt={suggestion.movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-background flex items-center justify-center">
            📽️
          </div>
        )}
      </div>

      <div className="flex-1">
        <div
          onClick={() => router.push(`/movies/${suggestion.movieId}`)}
          className="cursor-pointer hover:text-primary transition-colors"
        >
          <h3 className="font-semibold text-lg">{suggestion.movie?.title}</h3>
          <p className="text-sm text-muted-foreground">
            {suggestion.movie?.year}
          </p>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {isReceived ? (
            <>
              Suggested by{" "}
              <span className="font-medium text-foreground">
                {suggestion.fromUser?.name || suggestion.fromUser?.username}
              </span>
            </>
          ) : (
            <>
              Suggested to{" "}
              <span className="font-medium text-foreground">
                {suggestion.toUser?.name || suggestion.toUser?.username}
              </span>
            </>
          )}
        </p>

        {suggestion.message && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            "{suggestion.message}"
          </p>
        )}

        {isReceived && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={onAccept}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Bookmark size={14} />
              Add to Watchlist
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={14} />
              Reject
            </button>
          </div>
        )}

        {!isReceived && onDelete && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading suggestions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Suggestions</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover movies recommended by friends
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "received"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Received ({receivedSuggestions.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "sent"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Sent ({sentSuggestions.length})
        </button>
      </div>

      {/* Received Suggestions */}
      {activeTab === "received" && (
        <div className="space-y-4">
          {receivedSuggestions.length > 0 ? (
            receivedSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isReceived
                onAccept={() =>
                  handleAcceptSuggestion(suggestion.id, suggestion.movieId)
                }
                onReject={() => handleRejectSuggestion(suggestion.id)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">
                No suggestions received yet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sent Suggestions */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {sentSuggestions.length > 0 ? (
            sentSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isReceived={false}
                onDelete={() => handleDeleteSentSuggestion(suggestion.id)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">
                You haven't sent any suggestions yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

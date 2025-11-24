"use client";

import { useState, useEffect } from "react";
import { Heart, CheckCircle, XCircle, Calendar } from "lucide-react";

interface Suggestion {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
  fromUserId: string;
  fromUserUsername: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = localStorage.getItem("movienight_token");
        const res = await fetch("/api/suggestions", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch suggestions");
          return;
        }

        setSuggestions(data.data || []);
      } catch (err) {
        setError("An error occurred");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");
  const acceptedSuggestions = suggestions.filter((s) => s.status === "accepted");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "accepted":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-muted";
    }
  };

  const SuggestionCard = ({
    suggestion,
    isPending,
  }: {
    suggestion: Suggestion;
    isPending: boolean;
  }) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
      {/* Poster */}
      <div className="relative h-48 md:h-56 bg-secondary overflow-hidden group">
        {suggestion.moviePoster ? (
          <img
            src={suggestion.moviePoster}
            alt={suggestion.movieTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart size={60} className="text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
            suggestion.status
          )}`}
        >
          {suggestion.status === "pending" ? "Pending" : "Watched"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        <h3 className="font-bold text-lg md:text-xl mb-2 line-clamp-2">
          {suggestion.movieTitle}
        </h3>

        <div className="mb-4">
          <p className="text-xs md:text-sm text-muted-foreground mb-2">
            Suggested by{" "}
            <span className="text-foreground">@{suggestion.fromUserUsername}</span>
          </p>
          {suggestion.message && (
            <p className="text-sm text-foreground italic">
              "{suggestion.message}"
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(suggestion.createdAt).toLocaleDateString()}
          </p>
        </div>

        {isPending ? (
          <div className="space-y-2">
            <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold flex items-center justify-center gap-2 text-sm">
              <Calendar size={16} />
              Book Movie Night
            </button>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center justify-center gap-2 text-sm">
                <XCircle size={16} />
                <span className="hidden sm:inline">Skip</span>
              </button>
              <button className="flex-1 px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center justify-center gap-2 text-sm">
                <Heart size={16} />
                <span className="hidden sm:inline">Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 text-center text-sm font-medium">
            <CheckCircle className="inline mr-2" size={16} />
            Watched
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Suggestions</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Discover movies your friends think you'll love
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-8">
            Loading suggestions...
          </p>
        ) : (
          <>
            {/* Pending Suggestions */}
            {pendingSuggestions.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="text-xl md:text-2xl font-bold">
                    Pending Suggestions ({pendingSuggestions.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {pendingSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isPending={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Watched from Suggestions */}
            {acceptedSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-green-500 rounded-full" />
                  <h2 className="text-xl md:text-2xl font-bold">
                    Watched ({acceptedSuggestions.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {acceptedSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isPending={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {suggestions.length === 0 && (
              <div className="text-center py-20">
                <Heart size={48} className="text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  No suggestions yet
                </h2>
                <p className="text-muted-foreground">
                  Add friends to get personalized movie recommendations!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

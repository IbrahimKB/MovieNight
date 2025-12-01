"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Star,
  Users,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string | null;
  username: string;
  avatar?: string;
}

interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  poster?: string;
  description: string;
  rating?: number;
}

interface Suggestion {
  id: string;
  movieId: string;
  fromUserId: string;
  toUserId: string | null;
  status: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  movie: Movie;
  fromUser: User;
  toUser: User | null;
}

type Tab = "received" | "sent";

export default function SuggestionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [receivedSuggestions, setReceivedSuggestions] = useState<Suggestion[]>(
    [],
  );
  const [sentSuggestions, setSentSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;

      try {
        setError(null);
        const [receivedRes, sentRes] = await Promise.all([
          fetch("/api/suggestions?type=received", { credentials: "include" }),
          fetch("/api/suggestions?type=sent", { credentials: "include" }),
        ]);

        if (!receivedRes.ok || !sentRes.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const receivedData = await receivedRes.json();
        const sentData = await sentRes.json();

        if (receivedData.success && Array.isArray(receivedData.data)) {
          setReceivedSuggestions(receivedData.data);
        }

        if (sentData.success && Array.isArray(sentData.data)) {
          setSentSuggestions(sentData.data);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setError("Failed to load suggestions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user]);

  const handleAcceptSuggestion = async (
    suggestionId: string,
    movieId: string,
    movieTitle: string,
  ) => {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "accept",
          rating: 5,
        }),
      });

      if (res.ok) {
        toast({
          title: "Suggestion accepted! ✅",
          description: `"${movieTitle}" has been added to your watchlist.`,
        });
        setReceivedSuggestions(
          receivedSuggestions.filter((s) => s.id !== suggestionId),
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to accept suggestion.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Failed to accept suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to accept suggestion.",
        variant: "destructive",
      });
    }
  };

  const handleRejectSuggestion = async (
    suggestionId: string,
    movieTitle: string,
  ) => {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "reject",
        }),
      });

      if (res.ok) {
        toast({
          title: "Suggestion ignored",
          description: `"${movieTitle}" has been removed.`,
        });
        setReceivedSuggestions(
          receivedSuggestions.filter((s) => s.id !== suggestionId),
        );
      }
    } catch (error) {
      console.error("Failed to reject suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to reject suggestion.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSentSuggestion = async (
    suggestionId: string,
    movieTitle: string,
  ) => {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast({
          title: "Suggestion deleted",
          description: `Your suggestion for "${movieTitle}" has been removed.`,
        });
        setSentSuggestions(
          sentSuggestions.filter((s) => s.id !== suggestionId),
        );
      }
    } catch (error) {
      console.error("Failed to delete suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to delete suggestion.",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-primary">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Movie Poster */}
          <div
            onClick={() => router.push(`/movies/${suggestion.movieId}`)}
            className="w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-muted"
          >
            {suggestion.movie?.poster ? (
              <img
                src={suggestion.movie.poster}
                alt={suggestion.movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                🎬
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div>
              <div
                onClick={() => router.push(`/movies/${suggestion.movieId}`)}
                className="cursor-pointer hover:text-primary transition-colors mb-2"
              >
                <h3 className="font-semibold text-lg">
                  {suggestion.movie?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {suggestion.movie?.year}
                </p>
              </div>

              {/* Genre Badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {suggestion.movie?.genres?.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>

              {/* Rating */}
              {suggestion.movie?.rating && (
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">
                    {suggestion.movie.rating.toFixed(1)}/10
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="mb-2">
                <Badge
                  variant={
                    suggestion.status === "pending"
                      ? "outline"
                      : suggestion.status === "accepted"
                        ? "default"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {suggestion.status === "pending" && (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                  {suggestion.status === "accepted" && (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accepted
                    </>
                  )}
                  {suggestion.status === "rejected" && (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </>
                  )}
                </Badge>
              </div>

              {/* User Info */}
              <p className="text-sm text-muted-foreground mb-2">
                {isReceived ? (
                  <>
                    <span className="font-medium">
                      {suggestion.fromUser?.name ||
                        suggestion.fromUser?.username}
                    </span>{" "}
                    suggested this
                  </>
                ) : (
                  <>
                    Suggested to{" "}
                    <span className="font-medium">
                      {suggestion.toUser?.name || suggestion.toUser?.username}
                    </span>
                  </>
                )}
              </p>

              {/* Time */}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(suggestion.createdAt)}
              </p>

              {/* Message */}
              {suggestion.message && (
                <div className="mt-2 p-2 bg-accent/50 rounded text-sm italic text-muted-foreground border-l-2 border-primary/50">
                  "{suggestion.message}"
                </div>
              )}
            </div>

            {/* Actions */}
            {isReceived && suggestion.status === "pending" ? (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button size="sm" className="flex-1" onClick={onAccept}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={onReject}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Ignore
                </Button>
              </div>
            ) : !isReceived ? (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {suggestion.status === "accepted" &&
                    "✓ You accepted this suggestion"}
                  {suggestion.status === "rejected" &&
                    "✗ You rejected this suggestion"}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Suggestions</h1>
        </div>
        <p className="text-muted-foreground">
          Discover movies recommended by friends or manage suggestions you've
          sent
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
          <Users className="h-4 w-4 inline mr-2" />
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
          <Send className="h-4 w-4 inline mr-2" />
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
                  handleAcceptSuggestion(
                    suggestion.id,
                    suggestion.movieId,
                    suggestion.movie.title,
                  )
                }
                onReject={() =>
                  handleRejectSuggestion(suggestion.id, suggestion.movie.title)
                }
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No suggestions yet
                </h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Your friends haven't suggested any movies to you yet. Once
                  they do, they'll appear here!
                </p>
              </CardContent>
            </Card>
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
                onDelete={() =>
                  handleDeleteSentSuggestion(
                    suggestion.id,
                    suggestion.movie.title,
                  )
                }
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Send className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No sent suggestions
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mb-4">
                  You haven't suggested any movies to your friends yet. Use the
                  suggest feature to share movies!
                </p>
                <Button
                  onClick={() => router.push("/suggest")}
                  variant="default"
                >
                  Suggest a Movie
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

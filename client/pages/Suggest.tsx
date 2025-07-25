import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  PlusCircle,
  Star,
  Clock,
  Users,
  MessageSquare,
  Check,
  X,
  ArrowLeft,
  Film,
  Tv,
  Calendar,
  Eye,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Friend, getUserFriends, getFriendName } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PlatformLogo } from "@/components/ui/platform-logo";

interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  poster?: string;
  description: string;
  rating?: number;
}

interface MovieSearchResult {
  id: string;
  title: string;
  year: number;
  description: string;
  poster: string | null;
  mediaType: "movie" | "tv";
  rating: number;
  genres: string[];
  tmdbId: number;
}

interface SearchResponse {
  results: MovieSearchResult[];
  rateLimit: {
    remaining: number;
    resetTime: Date | null;
    isLimited: boolean;
  };
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

interface Suggestion {
  id: string;
  movie: Movie;
  suggestedBy: Friend;
  comment?: string;
  suggestedAt: string;
  myRating?: number;
}

// TMDB Search functionality
const searchMovies = async (query: string): Promise<MovieSearchResult[]> => {
  if (!query.trim()) return [];

  console.log("🔍 Starting TMDB search for:", query);

  try {
    const token = localStorage.getItem("movienight_token");
    if (!token) {
      console.error("❌ No authentication token found");
      return [];
    }

    const url = `/api/tmdb/search?q=${encodeURIComponent(query)}`;
    console.log("🌐 Fetching URL:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Response status:", response.status);
    console.log(
      "📡 Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Search failed: ${response.status} - ${errorText}`);
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Raw response data:", data);

    // Check if it's in the expected format
    if (!data || typeof data !== "object") {
      console.error("❌ Invalid response format:", data);
      return [];
    }

    // Handle different possible response formats
    let results = [];

    if (data.success && data.data && Array.isArray(data.data.results)) {
      // Format: { success: true, data: { results: [...] } }
      results = data.data.results;
    } else if (data.success && Array.isArray(data.data)) {
      // Format: { success: true, data: [...] }
      results = data.data;
    } else if (Array.isArray(data.results)) {
      // Format: { results: [...] }
      results = data.results;
    } else if (Array.isArray(data)) {
      // Format: [...]
      results = data;
    } else {
      console.error("❌ Could not find results array in response:", data);
      return [];
    }

    console.log("📊 Results found:", results.length);

    const processedResults = results.map((movie) => ({
      ...movie,
      genres: movie.genres || [],
      description: movie.description || "No description available",
      poster: movie.poster || null,
      rating: movie.rating || 0,
    }));
    console.log("✅ Processed results:", processedResults);
    return processedResults;
  } catch (error) {
    console.error("❌ Movie search error:", error);
    return [];
  }
};

export default function Suggest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<
    Movie | MovieSearchResult | null
  >(null);
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionMode, setActionMode] = useState<"suggest" | "watched">(
    "suggest",
  );
  const [watchedRating, setWatchedRating] = useState([8]);
  const [watchDate, setWatchDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [personalNotes, setPersonalNotes] = useState("");
  const [desireRating, setDesireRating] = useState([7]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isFromHome, setIsFromHome] = useState(false);

  // Get user's friends from API
  const [userFriends, setUserFriends] = useState<Friend[]>([]);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionRatings, setSuggestionRatings] = useState<
    Record<string, number>
  >({});

  // Fetch suggestions on component mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/suggestions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    };

    fetchSuggestions();
    loadFriends();
  }, [user]);

  // Load friends from API
  const loadFriends = async () => {
    if (!user) return;
    try {
      const friends = await getUserFriends(user.id);
      setUserFriends(friends);
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  // Check for pre-filled movie data from URL params
  useEffect(() => {
    const movieTitle = searchParams.get("title");
    const movieYear = searchParams.get("year");
    const movieGenres = searchParams.get("genres");
    const moviePlatform = searchParams.get("platform");
    const movieDescription = searchParams.get("description");
    const fromHome = searchParams.get("isFromHome");
    const fromMovieSearch = searchParams.get("isFromMovieSearch");
    const tmdbId = searchParams.get("tmdbId");
    const mediaType = searchParams.get("mediaType");

    if (movieTitle && movieYear && (fromHome || fromMovieSearch)) {
      const prefilledMovie: Movie = {
        id: `prefilled_${Date.now()}`,
        title: movieTitle,
        year: parseInt(movieYear),
        genres: movieGenres ? JSON.parse(movieGenres) : [],
        description: movieDescription || "",
      };

      setSelectedMovie(prefilledMovie);
      setIsFromHome(!!fromHome);

      // Clear URL params after loading
      navigate("/suggest", { replace: true });

      const source = fromHome ? "upcoming releases" : "movie search";
      toast({
        title: "Movie pre-selected! 🎬",
        description: `"${movieTitle}" was selected from ${source}. Add your rating and select friends below.`,
      });
    }
  }, [searchParams, navigate]);

  // Handle movie search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        const results = await searchMovies(searchTerm);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Reset form data when action mode changes
  useEffect(() => {
    setSelectedFriends([]);
    setComment("");
    setPersonalNotes("");
    setDesireRating([7]);
    setWatchedRating([8]);
  }, [actionMode]);

  const handleSelectMovie = (movie: MovieSearchResult) => {
    // Convert MovieSearchResult to Movie format for consistency
    const convertedMovie: Movie = {
      id: `tmdb_${movie.tmdbId}`,
      title: movie.title,
      year: movie.year,
      genres: movie.genres,
      poster: movie.poster || undefined,
      description: movie.description,
      rating: movie.rating,
    };
    setSelectedMovie(convertedMovie);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const handleSuggest = async () => {
    if (!selectedMovie || selectedFriends.length === 0 || !user) return;

    try {
      // First, save the movie to the database if it doesn't exist
      let movieId = selectedMovie.id;

      // If this is a prefilled movie from TMDB/external source, save it first
      if (movieId.startsWith("prefilled_") || movieId.startsWith("tmdb_")) {
        const saveResponse = await fetch("/api/tmdb/save-movie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
          },
          body: JSON.stringify({
            title: selectedMovie.title,
            year: selectedMovie.year,
            genres: selectedMovie.genres,
            description: selectedMovie.description,
            poster: selectedMovie.poster,
          }),
        });

        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          movieId = saveData.data.id;
        } else {
          throw new Error("Failed to save movie");
        }
      }

      // Create the suggestion
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
        },
        body: JSON.stringify({
          movieId,
          suggestedTo: selectedFriends,
          desireRating: desireRating[0],
          comment: comment || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create suggestion");
      }

      const data = await response.json();

      // Show success feedback
      const friendNames = selectedFriends
        .map((id) => getFriendName(id, userFriends))
        .filter((name) => name !== "Unknown")
        .join(", ");

      toast({
        title: "Movie suggested! 🎬",
        description: `"${selectedMovie.title}" has been suggested to ${friendNames}`,
      });

      // Reset form
      setSelectedMovie(null);
      setDesireRating([7]);
      setSelectedFriends([]);
      setComment("");
      setSearchTerm("");
      setActionMode("suggest");
    } catch (error) {
      console.error("Suggestion error:", error);
      toast({
        title: "Error",
        description: "Failed to create suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptSuggestion = async (
    suggestionId: string,
    movieTitle: string,
    suggestedBy: string,
  ) => {
    const rating = suggestionRatings[suggestionId] || 5;

    try {
      const response = await fetch("/api/suggestions/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
        },
        body: JSON.stringify({
          suggestionId,
          rating,
        }),
      });

      if (response.ok) {
        toast({
          title: "Suggestion accepted! ✅",
          description: `You rated "${movieTitle}" a ${rating}/10. Added to your watchlist!`,
        });

        // Remove from suggestions
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      } else {
        throw new Error("Failed to respond to suggestion");
      }
    } catch (error) {
      console.error("Accept suggestion error:", error);
      toast({
        title: "Error",
        description: "Failed to accept suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIgnoreSuggestion = async (
    suggestionId: string,
    movieTitle: string,
  ) => {
    try {
      const response = await fetch("/api/suggestions/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
        },
        body: JSON.stringify({
          suggestionId,
          rating: 1, // Low rating indicates rejection
        }),
      });

      if (response.ok) {
        toast({
          title: "Suggestion ignored",
          description: `"${movieTitle}" has been removed from your suggestions.`,
        });

        // Remove from suggestions
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      } else {
        throw new Error("Failed to respond to suggestion");
      }
    } catch (error) {
      console.error("Ignore suggestion error:", error);
      toast({
        title: "Error",
        description: "Failed to ignore suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRatingChange = (suggestionId: string, rating: number[]) => {
    setSuggestionRatings((prev) => ({ ...prev, [suggestionId]: rating[0] }));
  };

  const handleMarkAsWatched = async () => {
    if (!selectedMovie || !user) return;

    try {
      // First, save the movie to the database if it doesn't exist
      let movieId = selectedMovie.id;

      // If this is a prefilled movie from TMDB/external source, save it first
      if (movieId.startsWith("prefilled_") || movieId.startsWith("tmdb_")) {
        const saveResponse = await fetch("/api/tmdb/save-movie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
          },
          body: JSON.stringify({
            title: selectedMovie.title,
            year: selectedMovie.year,
            genres: selectedMovie.genres,
            description: selectedMovie.description,
            poster: selectedMovie.poster,
          }),
        });

        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          movieId = saveData.data.id;
        } else {
          throw new Error("Failed to save movie");
        }
      }

      // Mark as watched
      const response = await fetch(`/api/watched/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
        },
        body: JSON.stringify({
          movieId,
          rating: watchedRating[0],
          watchDate,
          notes: personalNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark as watched");
      }

      // Show success feedback
      toast({
        title: "Movie added to watch history! 🎬",
        description: `"${selectedMovie.title}" has been marked as watched with a ${watchedRating[0]}/10 rating.`,
      });

      // Reset form
      setSelectedMovie(null);
      setWatchedRating([8]);
      setWatchDate(new Date().toISOString().split("T")[0]);
      setPersonalNotes("");
      setSearchTerm("");
      setActionMode("suggest");
    } catch (error) {
      console.error("Mark as watched error:", error);
      toast({
        title: "Error",
        description: "Failed to mark movie as watched. Please try again.",
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Discover & Track Movies</h1>
        </div>
        <p className="text-muted-foreground">
          Search the TMDB database to discover movies and TV shows, then suggest
          them to friends or add them to your personal watch history
        </p>
      </div>

      {/* Pre-selected Movie Alert */}
      {isFromHome && selectedMovie && (
        <Alert className="border-primary/50 bg-primary/10">
          <Star className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{selectedMovie.title}</strong> was pre-selected from
              upcoming releases. Add your rating and select friends below to
              suggest it!
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="ml-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Top Section - Suggest a Movie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Discover & Track Movies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search TMDB for movies and TV shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Search the TMDB database to find movies and TV shows to suggest
                to your friends
              </p>
            </div>

            {/* Search Results */}
            {searchTerm && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <Skeleton className="w-12 h-16 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                              <Skeleton className="h-3 w-full" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    {searchResults.map((movie) => (
                      <Card
                        key={movie.id}
                        className="cursor-pointer transition-colors hover:bg-accent/50"
                        onClick={() => handleSelectMovie(movie)}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            {/* Poster */}
                            <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                              {movie.poster ? (
                                <img
                                  src={movie.poster}
                                  alt={movie.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  {movie.mediaType === "movie" ? (
                                    <Film className="h-4 w-4" />
                                  ) : (
                                    <Tv className="h-4 w-4" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-1">
                              <h4 className="font-semibold line-clamp-1">
                                {movie.title} ({movie.year})
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  {movie.mediaType === "movie" ? (
                                    <Film className="h-3 w-3" />
                                  ) : (
                                    <Tv className="h-3 w-3" />
                                  )}
                                  <span className="capitalize">
                                    {movie.mediaType}
                                  </span>
                                </div>
                                {movie.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{movie.rating.toFixed(1)}</span>
                                  </div>
                                )}
                                <PlatformLogo
                                  platform={
                                    movie.mediaType === "tv" ? "TV" : "Theaters"
                                  }
                                  size="sm"
                                />
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {(movie.genres || [])
                                  .slice(0, 2)
                                  .map((genre) => (
                                    <Badge
                                      key={genre}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {genre}
                                    </Badge>
                                  ))}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {movie.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {searchResults.length === 0 && !isSearching && (
                      <div className="text-center py-6 space-y-2">
                        <Film className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">
                          No movies found for "{searchTerm}".
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Try searching for a different title, actor, or
                          director.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Selected Movie Details */}
          {selectedMovie && (
            <>
              <Separator />
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Selected Movie</h3>
                  <Card className="bg-accent/30">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">
                          {selectedMovie.title} ({selectedMovie.year})
                        </h4>
                        <div className="flex gap-1">
                          {(selectedMovie.genres || []).map((genre) => (
                            <Badge
                              key={genre}
                              variant="secondary"
                              className="text-xs"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedMovie.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Mode Toggle */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    What would you like to do?
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={actionMode === "suggest" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActionMode("suggest")}
                      className="flex-1"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Suggest to Friends
                    </Button>
                    <Button
                      variant={actionMode === "watched" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActionMode("watched")}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as Watched
                    </Button>
                  </div>
                </div>

                {/* Desire Rating (for suggestions) */}
                {actionMode === "suggest" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      How much do you want to watch this? ({desireRating[0]}/10)
                    </label>
                    <Slider
                      value={desireRating}
                      onValueChange={setDesireRating}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Watch Rating (for watched movies) */}
                {actionMode === "watched" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      How would you rate this movie? ({watchedRating[0]}/10)
                    </label>
                    <Slider
                      value={watchedRating}
                      onValueChange={setWatchedRating}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Watch Date (for watched movies) */}
                {actionMode === "watched" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      When did you watch it?
                    </label>
                    <Input
                      type="date"
                      value={watchDate}
                      onChange={(e) => setWatchDate(e.target.value)}
                    />
                  </div>
                )}

                {/* Friend Selector (for suggestions) */}
                {actionMode === "suggest" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Suggest to friends
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {userFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={friend.id}
                            checked={selectedFriends.includes(friend.id)}
                            onCheckedChange={() =>
                              handleFriendToggle(friend.id)
                            }
                          />
                          <label
                            htmlFor={friend.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {friend.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment / Personal Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {actionMode === "suggest"
                      ? "Optional comment"
                      : "Personal notes (optional)"}
                  </label>
                  <Textarea
                    placeholder={
                      actionMode === "suggest"
                        ? "Movie night Thursday?"
                        : "What did you think of this movie?"
                    }
                    value={actionMode === "suggest" ? comment : personalNotes}
                    onChange={(e) =>
                      actionMode === "suggest"
                        ? setComment(e.target.value)
                        : setPersonalNotes(e.target.value)
                    }
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={
                    actionMode === "suggest"
                      ? handleSuggest
                      : handleMarkAsWatched
                  }
                  disabled={
                    actionMode === "suggest"
                      ? !selectedMovie || selectedFriends.length === 0
                      : !selectedMovie
                  }
                  className="w-full"
                >
                  {actionMode === "suggest" ? (
                    <>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Suggest to Friends
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Add to Watch History
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section - Incoming Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Incoming Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suggestions yet</h3>
              <p className="text-muted-foreground">
                Your friends haven't suggested any movies to you yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card
                  key={suggestion.id}
                  className="border-l-4 border-l-primary"
                >
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {suggestion.suggestedByUser?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              suggested
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(suggestion.createdAt)}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-semibold">
                            {suggestion.movie.title} ({suggestion.movie.year})
                          </h4>
                        </div>
                      </div>

                      {/* Movie Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {suggestion.movie.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {suggestion.movie.rating}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-1">
                            {(suggestion.movie.genres || []).map((genre) => (
                              <Badge
                                key={genre}
                                variant="secondary"
                                className="text-xs"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.movie.description}
                        </p>
                        {suggestion.comment && (
                          <p className="text-sm bg-accent/30 p-2 rounded italic">
                            "{suggestion.comment}"
                          </p>
                        )}
                      </div>

                      {/* Response Section */}
                      <div className="space-y-3 pt-2 border-t">
                        <label className="text-sm font-medium">
                          How much do you want to watch this? (1-10)
                        </label>
                        <Slider
                          defaultValue={[5]}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                          onValueChange={(rating) =>
                            handleRatingChange(suggestion.id, rating)
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              handleAcceptSuggestion(
                                suggestion.id,
                                suggestion.movie.title,
                                suggestion.suggestedByUser?.name || "Unknown",
                              )
                            }
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              handleIgnoreSuggestion(
                                suggestion.id,
                                suggestion.movie.title,
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" />
                            Ignore
                          </Button>
                        </div>
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

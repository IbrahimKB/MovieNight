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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Friend, getUserFriends, getFriendName } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  poster?: string;
  description: string;
  rating?: number;
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

// Mock data
const mockMovies: Movie[] = [
  {
    id: "1",
    title: "The Menu",
    year: 2022,
    genres: ["Thriller", "Horror"],
    description:
      "A young couple travels to a remote island to eat at an exclusive restaurant where the chef has prepared a lavish menu, with some shocking surprises.",
    rating: 7.2,
  },
  {
    id: "2",
    title: "Glass Onion: A Knives Out Mystery",
    year: 2022,
    genres: ["Mystery", "Comedy"],
    description:
      "Tech billionaire Miles Bron invites his friends for a getaway on his private Greek island. When someone turns up dead, Detective Benoit Blanc is put on the case.",
    rating: 7.1,
  },
  {
    id: "3",
    title: "Avatar: The Way of Water",
    year: 2022,
    genres: ["Action", "Adventure", "Sci-Fi"],
    description:
      "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.",
    rating: 7.6,
  },
];

export default function Suggest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  const filteredMovies = mockMovies.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          <PlusCircle className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Suggest a Movie</h1>
        </div>
        <p className="text-muted-foreground">
          Find movies to suggest to your friends and respond to their
          suggestions
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
            Suggest a Movie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a movie or show..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchTerm && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredMovies.map((movie) => (
                  <Card
                    key={movie.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedMovie?.id === movie.id
                        ? "ring-2 ring-primary bg-accent/30"
                        : ""
                    }`}
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-semibold">
                            {movie.title} ({movie.year})
                          </h4>
                          <div className="flex items-center gap-2">
                            {movie.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-muted-foreground">
                                  {movie.rating}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-1">
                              {movie.genres.slice(0, 2).map((genre) => (
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
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {movie.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredMovies.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No movies found. Try a different search term.
                  </p>
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
                          {selectedMovie.genres.map((genre) => (
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

                {/* Desire Rating */}
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

                {/* Friend Selector */}
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
                          onCheckedChange={() => handleFriendToggle(friend.id)}
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

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Optional comment
                  </label>
                  <Textarea
                    placeholder="Movie night Thursday?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSuggest}
                  disabled={!selectedMovie || selectedFriends.length === 0}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Suggest to Friends
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
                            {suggestion.movie.genres.map((genre) => (
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

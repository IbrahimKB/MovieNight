import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Friend, getUserFriends } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Shuffle,
  Star,
  Sparkles,
  Play,
  TrendingUp,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieWithScores {
  id: string;
  title: string;
  year: number;
  genres: string[];
  platform: string;
  poster?: string;
  description: string;
  imdbRating?: number;
  rtRating?: number;
  avgWatchDesire: number;
  userScores: { userId: string; userName: string; score: number }[];
}

interface SurpriseMovie {
  movie: MovieWithScores;
  isVisible: boolean;
}

const mockMoviesWithScores: MovieWithScores[] = [
  {
    id: "1",
    title: "The Menu",
    year: 2022,
    genres: ["Thriller", "Horror"],
    platform: "Netflix",
    description:
      "A young couple travels to a remote island to eat at an exclusive restaurant where the chef has prepared a lavish menu, with some shocking surprises.",
    imdbRating: 7.2,
    rtRating: 88,
    avgWatchDesire: 8.7,
    userScores: [
      { userId: "1", userName: "Ibrahim", score: 9 },
      { userId: "2", userName: "Omar", score: 8 },
      { userId: "3", userName: "Sara", score: 9 },
    ],
  },
  {
    id: "2",
    title: "Glass Onion",
    year: 2022,
    genres: ["Mystery", "Comedy"],
    platform: "Netflix",
    description:
      "Tech billionaire Miles Bron invites his friends for a getaway on his private Greek island. When someone turns up dead, Detective Benoit Blanc is put on the case.",
    imdbRating: 7.1,
    rtRating: 85,
    avgWatchDesire: 8.3,
    userScores: [
      { userId: "1", userName: "Ibrahim", score: 8 },
      { userId: "2", userName: "Omar", score: 9 },
      { userId: "3", userName: "Sara", score: 8 },
    ],
  },
  {
    id: "3",
    title: "Avatar: The Way of Water",
    year: 2022,
    genres: ["Action", "Adventure", "Sci-Fi"],
    platform: "Disney+",
    description:
      "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.",
    imdbRating: 7.6,
    rtRating: 76,
    avgWatchDesire: 7.8,
    userScores: [
      { userId: "1", userName: "Ibrahim", score: 8 },
      { userId: "4", userName: "Alex", score: 7 },
      { userId: "5", userName: "Maya", score: 8 },
    ],
  },
  {
    id: "4",
    title: "Wednesday",
    year: 2022,
    genres: ["Comedy", "Horror", "Mystery"],
    platform: "Netflix",
    description:
      "Wednesday Addams is sent to Nevermore Academy, a supernatural boarding school where she attempts to master her psychic powers, stop a monstrous killing spree that has terrorized the local town, and solve the murder mystery that embroiled her parents 25 years ago.",
    imdbRating: 8.1,
    rtRating: 74,
    avgWatchDesire: 7.5,
    userScores: [
      { userId: "2", userName: "Omar", score: 6 },
      { userId: "3", userName: "Sara", score: 9 },
      { userId: "5", userName: "Maya", score: 8 },
    ],
  },
  {
    id: "5",
    title: "The Bear",
    year: 2022,
    genres: ["Comedy", "Drama"],
    platform: "Hulu",
    description:
      'Carmen "Carmy" Berzatto, a young chef from the fine dining world, comes home to Chicago to run his family sandwich shop after a heartbreaking death in his family.',
    imdbRating: 8.7,
    rtRating: 100,
    avgWatchDesire: 7.2,
    userScores: [
      { userId: "1", userName: "Ibrahim", score: 7 },
      { userId: "4", userName: "Alex", score: 8 },
      { userId: "5", userName: "Maya", score: 7 },
    ],
  },
  {
    id: "6",
    title: "Top Gun: Maverick",
    year: 2022,
    genres: ["Action", "Drama"],
    platform: "Paramount+",
    description:
      "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission that demands the ultimate sacrifice from those chosen to fly it.",
    imdbRating: 8.3,
    rtRating: 96,
    avgWatchDesire: 6.8,
    userScores: [
      { userId: "1", userName: "Ibrahim", score: 7 },
      { userId: "2", userName: "Omar", score: 7 },
      { userId: "4", userName: "Alex", score: 6 },
    ],
  },
];

const genres = [
  "All Genres",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Horror",
  "Mystery",
  "Sci-Fi",
  "Thriller",
];

export default function MovieNight() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [presentFriends, setPresentFriends] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [filteredMovies, setFilteredMovies] = useState<MovieWithScores[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [surpriseMovie, setSurpriseMovie] = useState<SurpriseMovie | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load friends data
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const userFriends = await getUserFriends(user!.id);
      setFriends(userFriends);
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendToggle = (friendId: string) => {
    setPresentFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const handleFindMovies = () => {
    if (presentFriends.length === 0) return;

    // Filter movies that have scores from at least one present friend
    let filtered = mockMoviesWithScores.filter((movie) => {
      const hasScore = movie.userScores.some((score) =>
        presentFriends.includes(score.userId),
      );
      const matchesGenre =
        selectedGenre === "All Genres" || movie.genres.includes(selectedGenre);
      return hasScore && matchesGenre;
    });

    // Recalculate average score based on present friends only
    filtered = filtered.map((movie) => {
      const presentScores = movie.userScores.filter((score) =>
        presentFriends.includes(score.userId),
      );
      const avgWatchDesire =
        presentScores.reduce((sum, score) => sum + score.score, 0) /
        presentScores.length;

      return {
        ...movie,
        avgWatchDesire: Number(avgWatchDesire.toFixed(1)),
        userScores: presentScores,
      };
    });

    // Sort by average watch desire (highest first)
    filtered.sort((a, b) => b.avgWatchDesire - a.avgWatchDesire);

    setFilteredMovies(filtered);
    setShowResults(true);
    setSurpriseMovie(null);
  };

  const handleSurpriseMe = () => {
    if (filteredMovies.length === 0) return;

    // Get top 5 movies (or all if less than 5)
    const topMovies = filteredMovies.slice(
      0,
      Math.min(5, filteredMovies.length),
    );

    // Weighted random selection based on scores
    const weightedMovies = topMovies.flatMap((movie) =>
      Array(Math.ceil(movie.avgWatchDesire)).fill(movie),
    );

    const randomMovie =
      weightedMovies[Math.floor(Math.random() * weightedMovies.length)];

    setSurpriseMovie({
      movie: randomMovie,
      isVisible: true,
    });

    // Scroll to top to see the surprise
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Netflix":
        return "bg-red-600";
      case "Disney+":
        return "bg-blue-600";
      case "Hulu":
        return "bg-green-600";
      case "Amazon Prime":
        return "bg-orange-600";
      case "HBO Max":
        return "bg-purple-600";
      case "Paramount+":
        return "bg-blue-500";
      default:
        return "bg-gray-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return "bg-green-500";
    if (score >= 7.5) return "bg-yellow-500";
    if (score >= 6.5) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Page Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Movie Night</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Select who's here and get movie recommendations your group is most
          excited about.
        </p>
      </div>

      {/* Surprise Movie Spotlight */}
      {surpriseMovie?.isVisible && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5 border-2 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSurpriseMovie(null)}
              className="h-6 w-6 p-0 rounded-full"
            >
              ×
            </Button>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h2 className="text-2xl font-bold text-primary">
                Tonight's Destiny Pick
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-3xl font-bold">
                  {surpriseMovie.movie.title} ({surpriseMovie.movie.year})
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge
                    className={cn(
                      "text-white font-bold px-3 py-1",
                      getScoreColor(surpriseMovie.movie.avgWatchDesire),
                    )}
                  >
                    🎯 {surpriseMovie.movie.avgWatchDesire}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        getPlatformColor(surpriseMovie.movie.platform),
                      )}
                    />
                    <span className="font-medium">
                      {surpriseMovie.movie.platform}
                    </span>
                  </div>
                  {surpriseMovie.movie.imdbRating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">
                        {surpriseMovie.movie.imdbRating}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {surpriseMovie.movie.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  {surpriseMovie.movie.description}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Excited friends:
                  </span>
                  {surpriseMovie.movie.userScores.map((score, index) => (
                    <span key={score.userId} className="font-medium">
                      {score.userName} ({score.score})
                      {index < surpriseMovie.movie.userScores.length - 1 &&
                        ", "}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Button size="lg" className="w-full md:w-auto">
                  <Play className="h-5 w-5 mr-2" />
                  Let's Watch!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Find Tonight's Movie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Who's Present */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              👥 Who's Present?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {isLoading ? (
                <div className="col-span-full text-center py-4">
                  <div className="text-sm text-muted-foreground">
                    Loading friends...
                  </div>
                </div>
              ) : friends.length === 0 ? (
                <div className="col-span-full text-center py-4">
                  <div className="text-sm text-muted-foreground">
                    No friends yet. Add friends to plan movie nights together!
                  </div>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer",
                      presentFriends.includes(friend.id)
                        ? "bg-primary/10 border-primary"
                        : "border-border hover:bg-accent/50",
                    )}
                    onClick={() => handleFriendToggle(friend.id)}
                  >
                    <Checkbox
                      id={friend.id}
                      checked={presentFriends.includes(friend.id)}
                      onChange={() => handleFriendToggle(friend.id)}
                    />
                    <label
                      htmlFor={friend.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {friend.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Genre Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              🎭 Genre (optional)
            </label>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleFindMovies}
              disabled={presentFriends.length === 0}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Find Movies
            </Button>
            {showResults && filteredMovies.length > 0 && (
              <Button
                onClick={handleSurpriseMe}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                🎲 Surprise Me
              </Button>
            )}
          </div>

          {presentFriends.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select at least one friend to get recommendations.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Ranked Recommendations{" "}
              {filteredMovies.length > 0 && `(${filteredMovies.length})`}
            </h2>
            {filteredMovies.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                Sorted by group excitement
              </Badge>
            )}
          </div>

          {filteredMovies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No recommendations found
                </h3>
                <p className="text-muted-foreground">
                  Try selecting different friends or changing the genre filter.
                  Make sure your group has rated some movies first!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMovies.map((movie, index) => (
                <Card
                  key={movie.id}
                  className={cn(
                    "group hover:bg-accent/30 transition-all duration-200 relative",
                    index === 0 && "ring-2 ring-primary/30 bg-primary/5",
                  )}
                >
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">
                      #1 Pick
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                            {movie.title} ({movie.year})
                          </h3>
                          <Badge
                            className={cn(
                              "text-white font-bold shrink-0",
                              getScoreColor(movie.avgWatchDesire),
                            )}
                          >
                            🎯 {movie.avgWatchDesire}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                getPlatformColor(movie.platform),
                              )}
                            />
                            <span className="text-sm text-muted-foreground">
                              {movie.platform}
                            </span>
                          </div>
                          {movie.imdbRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {movie.imdbRating}
                              </span>
                            </div>
                          )}
                          {movie.rtRating && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                🍅 {movie.rtRating}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-1">
                        {movie.genres.map((genre) => (
                          <Badge
                            key={genre}
                            variant="secondary"
                            className="text-xs"
                          >
                            {genre}
                          </Badge>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {movie.description}
                      </p>

                      {/* User Scores */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Excited friends:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {movie.userScores.map((score) => (
                            <Badge
                              key={score.userId}
                              variant="outline"
                              className="text-xs"
                            >
                              {score.userName} ({score.score})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

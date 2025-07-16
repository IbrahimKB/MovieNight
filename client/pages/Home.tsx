import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Search, Filter, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SmartNudge from "@/components/SmartNudge";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface MovieRelease {
  id: string;
  title: string;
  platform: string;
  releaseDate: string;
  genres: string[];
  poster?: string;
  description?: string;
}

// Mock data for upcoming releases
const mockReleases: MovieRelease[] = [
  {
    id: "1",
    title: "The Menu",
    platform: "Netflix",
    releaseDate: "2024-01-15",
    genres: ["Thriller", "Horror"],
    description:
      "A young couple travels to a remote island to eat at an exclusive restaurant.",
  },
  {
    id: "2",
    title: "Glass Onion",
    platform: "Netflix",
    releaseDate: "2024-01-15",
    genres: ["Mystery", "Comedy"],
    description:
      "Detective Benoit Blanc travels to Greece to solve a new mystery.",
  },
  {
    id: "3",
    title: "Avatar: The Way of Water",
    platform: "Disney+",
    releaseDate: "2024-01-16",
    genres: ["Action", "Adventure", "Sci-Fi"],
    description: "Jake Sully and his family continue their story on Pandora.",
  },
  {
    id: "4",
    title: "The Bear Season 3",
    platform: "Hulu",
    releaseDate: "2024-01-17",
    genres: ["Comedy", "Drama"],
    description:
      "Carmen and the crew continue to work toward transforming The Beef.",
  },
  {
    id: "5",
    title: "Wednesday Season 2",
    platform: "Netflix",
    releaseDate: "2024-01-18",
    genres: ["Comedy", "Horror", "Mystery"],
    description:
      "Wednesday Addams returns to Nevermore Academy for more supernatural adventures.",
  },
  {
    id: "6",
    title: "The Night Agent",
    platform: "Netflix",
    releaseDate: "2024-01-19",
    genres: ["Action", "Thriller"],
    description:
      "A low-level FBI agent gets pulled into a conspiracy threatening the President.",
  },
];

const platforms = [
  "All Platforms",
  "Netflix",
  "Disney+",
  "Hulu",
  "Amazon Prime",
  "HBO Max",
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

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All Platforms");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [showNudge, setShowNudge] = useState(true);

  const handleWatchTonight = (movieTitle: string) => {
    toast({
      title: "Added to tonight's queue! 🎬",
      description: `${movieTitle} is ready for your movie night.`,
    });
  };

  const handleDismissNudge = (nudgeId: string) => {
    setShowNudge(false);
    console.log("Dismissed nudge:", nudgeId);
    toast({
      title: "Reminder dismissed",
      description: "You won't see this suggestion again.",
    });
  };

  const handleSuggestToFriends = (release: MovieRelease) => {
    // Navigate to suggest page with movie data as URL params
    const movieData = {
      title: release.title,
      year: new Date(release.releaseDate).getFullYear(),
      genres: release.genres,
      platform: release.platform,
      description: release.description || "",
      isFromHome: "true",
    };

    const params = new URLSearchParams();
    Object.entries(movieData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, JSON.stringify(value));
      } else {
        params.set(key, value.toString());
      }
    });

    navigate(`/suggest?${params.toString()}`);
  };

  // Group releases by date
  const groupedReleases = mockReleases.reduce(
    (acc, release) => {
      const date = release.releaseDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(release);
      return acc;
    },
    {} as Record<string, MovieRelease[]>,
  );

  // Filter releases
  const filteredGroupedReleases = Object.entries(groupedReleases).reduce(
    (acc, [date, releases]) => {
      const filtered = releases.filter((release) => {
        const matchesSearch =
          release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          release.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform =
          selectedPlatform === "All Platforms" ||
          release.platform === selectedPlatform;
        const matchesGenre =
          selectedGenre === "All Genres" ||
          release.genres.includes(selectedGenre);

        return matchesSearch && matchesPlatform && matchesGenre;
      });

      if (filtered.length > 0) {
        acc[date] = filtered;
      }
      return acc;
    },
    {} as Record<string, MovieRelease[]>,
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
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
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Upcoming Releases</h1>
        </div>
        <p className="text-muted-foreground">
          Discover new movies and shows coming to your favorite platforms
        </p>
      </div>

      {/* Smart Nudge */}
      {showNudge && (
        <SmartNudge
          onWatchTonight={handleWatchTonight}
          onDismiss={handleDismissNudge}
        />
      )}

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search movies and shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedPlatform}
              onValueChange={setSelectedPlatform}
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-48">
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
        </CardContent>
      </Card>

      {/* Calendar Layout */}
      <div className="space-y-8">
        {Object.entries(filteredGroupedReleases)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([date, releases]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{formatDate(date)}</h2>
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  {releases.length} release{releases.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {releases.map((release) => (
                  <Card
                    key={release.id}
                    className="group hover:bg-accent/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                              {release.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  getPlatformColor(release.platform),
                                )}
                              />
                              <span className="text-sm text-muted-foreground">
                                {release.platform}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleSuggestToFriends(
                                release.title,
                                release.platform,
                              )
                            }
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Suggest to Friends
                          </Button>
                        </div>

                        {/* Description */}
                        {release.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {release.description}
                          </p>
                        )}

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1">
                          {release.genres.map((genre) => (
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      {Object.keys(filteredGroupedReleases).length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No releases found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more upcoming releases.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

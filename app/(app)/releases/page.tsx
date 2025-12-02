"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clapperboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Release {
  id: string;
  title: string;
  year: number;
  releaseDate: string;
  platform?: string;
  poster?: string;
  genres?: string[];
}

export default function ReleasesPage() {
  const router = useRouter();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const res = await fetch("/api/releases/upcoming?page=1&limit=40", {
          credentials: "include",
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Sort by release date
          const sorted = data.data.sort(
            (a: Release, b: Release) =>
              new Date(a.releaseDate).getTime() -
              new Date(b.releaseDate).getTime(),
          );
          setReleases(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch releases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const ReleaseCard = ({ release }: { release: Release }) => {
    const releaseDate = new Date(release.releaseDate);
    const isUpcoming = releaseDate > new Date();

    const platformEmoji: Record<string, string> = {
      "Theatrical": "🎬",
      "Cinema": "🎬",
      "Theater": "🎬",
      "Netflix": "📺",
      "Disney+": "🎥",
      "Prime Video": "🎁",
      "Apple TV": "🍎",
      "HBO Max": "🎭",
      "Hulu": "📺",
      "Peacock": "🦚",
      "Paramount+": "⭐",
    };
    const emoji = platformEmoji[release.platform || ""] || "📺";

    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all">
        <button
          onClick={() => router.push(`/movies/${release.id}`)}
          className="w-full text-left"
        >
          <div className="relative aspect-video bg-background flex items-center justify-center overflow-hidden">
            {release.poster ? (
              <img
                src={release.poster}
                alt={release.title}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <Clapperboard className="h-12 w-12 text-muted-foreground" />
            )}

            {/* Release Date Badge */}
            <div className="absolute top-3 right-3 bg-primary/90 rounded-lg px-3 py-1 text-xs font-bold text-primary-foreground flex items-center gap-1">
              <Calendar size={14} />
              {releaseDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </button>

        <div className="p-4">
          <button
            onClick={() => router.push(`/movies/${release.id}`)}
            className="text-left w-full group"
          >
            <p className="font-semibold group-hover:text-primary transition-colors">
              {release.title}
            </p>
            <p className="text-sm text-muted-foreground">{release.year}</p>
          </button>

          {release.platform && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {emoji} {release.platform}
              </Badge>
            </div>
          )}

          {release.genres && release.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {release.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push(`/movies/${release.id}`)}
            className="w-full mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add to Watchlist
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading upcoming releases...</p>
      </div>
    );
  }

  // Separate upcoming and past
  const upcomingReleases = releases.filter(
    (r) => new Date(r.releaseDate) > new Date(),
  );
  const pastReleases = releases.filter(
    (r) => new Date(r.releaseDate) <= new Date(),
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          Upcoming Releases
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          New movies coming to your favorite platforms
        </p>
      </div>

      {/* Upcoming */}
      {upcomingReleases.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Coming Soon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingReleases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {pastReleases.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Releases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pastReleases.slice(0, 8).map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {releases.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No releases found</p>
        </div>
      )}
    </div>
  );
}

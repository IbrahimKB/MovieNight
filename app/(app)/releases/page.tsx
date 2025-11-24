"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Film } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Release {
  id: string;
  title: string;
  releaseDate: string;
  poster?: string;
  platforms: string[];
  description: string;
}

export default function ReleasesPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [upcomingReleases, setUpcomingReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;

    const fetchReleases = async () => {
      try {
        const token = localStorage.getItem("movienight_token");
        const res = await fetch("/api/releases/upcoming", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        setUpcomingReleases(data.data || []);
      } catch (err) {
        console.error("Error fetching releases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [mounted, user]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Upcoming Releases
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Discover movies coming soon to theatres
          </p>
        </div>

        {/* Release Calendar */}
        <div className="mb-12">
          {upcomingReleases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
              {upcomingReleases.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group"
                >
                  {/* Poster */}
                  <div className="relative h-56 md:h-64 bg-secondary overflow-hidden">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={60} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-block px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold">
                        Coming Soon
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">
                      {movie.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {movie.description}
                    </p>

                    {/* Release Date */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Calendar
                        size={16}
                        className="text-primary flex-shrink-0"
                      />
                      <span className="font-medium">{movie.releaseDate}</span>
                    </div>

                    {/* Platforms */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {movie.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 rounded text-xs bg-primary/10 text-primary"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold flex items-center justify-center gap-2 text-sm">
                        <Plus size={16} />
                        <span className="hidden sm:inline">Watchlist</span>
                      </button>
                      <button className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium text-sm">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Film size={48} className="text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No releases found</h2>
              <p className="text-muted-foreground">
                Check back soon for upcoming releases
              </p>
            </div>
          )}
        </div>

        {/* Coming Soon Info */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-6 md:p-8 text-center">
          <Film size={40} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">More Coming Soon!</h2>
          <p className="text-muted-foreground mb-6">
            Check back regularly for new movie releases and updates
          </p>
          <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold">
            Notify Me
          </button>
        </div>
      </div>
    </div>
  );
}

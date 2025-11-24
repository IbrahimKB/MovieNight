"use client";

import { useState, useEffect } from "react";
import { Heart, Film, Calendar, Star } from "lucide-react";

interface WatchlistItem {
  id: string;
  movieId: string;
  title: string;
  poster?: string;
  year: number;
  rating?: number;
}

interface WatchedItem {
  id: string;
  movieId: string;
  title: string;
  poster?: string;
  year: number;
  watchedAt: string;
  rating?: number;
}

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<"want" | "watched">("want");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watched, setWatched] = useState<WatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("movienight_token");
        const headers = {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        };

        const [watchlistRes, watchedRes] = await Promise.all([
          fetch("/api/watch/desire", { headers }),
          fetch("/api/watch/history", { headers }),
        ]);

        const watchlistData = await watchlistRes.json();
        const watchedData = await watchedRes.json();

        setWatchlist(watchlistData.data || []);
        setWatched(watchedData.data || []);
      } catch (err) {
        console.error("Error fetching watchlist:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkWatched = async (movieId: string) => {
    setMarking(movieId);
    try {
      const token = localStorage.getItem("movienight_token");
      await fetch("/api/watch/mark-watched", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieId,
          watchedAt: new Date().toISOString(),
        }),
      });

      // Refresh data
      const watchlistRes = await fetch("/api/watch/desire", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const watchlistData = await watchlistRes.json();
      setWatchlist(watchlistData.data || []);
    } catch (err) {
      console.error("Error marking as watched:", err);
    } finally {
      setMarking(null);
    }
  };

  const tabs = [
    { id: "want", label: "Want to Watch", count: watchlist.length },
    { id: "watched", label: "Watched", count: watched.length },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">
            My Watchlist
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Keep track of movies you want to watch and have already watched
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-8 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "want" | "watched")}
              className={`px-3 md:px-6 py-3 font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} <span className="hidden sm:inline">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin">
              <Film size={40} className="text-primary" />
            </div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        ) : activeTab === "want" ? (
          /* Want to Watch */
          watchlist.length > 0 ? (
            <div className="space-y-4">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-12 md:w-16 h-18 md:h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 md:w-16 h-18 md:h-24 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Film size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground flex-wrap">
                        <span>{item.year}</span>
                        {item.rating && (
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-primary" />
                            {item.rating}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkWatched(item.movieId)}
                    disabled={marking === item.movieId}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold whitespace-nowrap w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {marking === item.movieId ? "Marking..." : "Mark Watched"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Heart size={48} className="text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No movies in your watchlist
              </h2>
              <p className="text-muted-foreground">
                Start exploring and add movies to your watchlist!
              </p>
            </div>
          )
        ) : (
          /* Watched */
          watched.length > 0 ? (
            <div className="space-y-4">
              {watched.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-12 md:w-16 h-18 md:h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 md:w-16 h-18 md:h-24 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Film size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground flex-wrap">
                        <span>{item.year}</span>
                        {item.watchedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(item.watchedAt).toLocaleDateString()}
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-primary" />
                            {item.rating}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Film size={48} className="text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No watched movies yet
              </h2>
              <p className="text-muted-foreground">
                Start marking movies as watched to track your viewing history
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

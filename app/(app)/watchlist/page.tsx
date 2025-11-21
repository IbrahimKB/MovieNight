'use client';

import { useEffect, useState } from 'react';

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
  originalScore?: number;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watched, setWatched] = useState<WatchedItem[]>([]);
  const [tab, setTab] = useState<'want' | 'watched'>('want');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wantRes, watchedRes] = await Promise.all([
          fetch('/api/watch/desire'),
          fetch('/api/watch/history'),
        ]);

        const wantData = await wantRes.json();
        const watchedData = await watchedRes.json();

        if (wantRes.ok) {
          setWatchlist(wantData.data || []);
        }
        if (watchedRes.ok) {
          setWatched(watchedData.data || []);
        }
      } catch (err) {
        setError('An error occurred');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">My Watchlist</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setTab('want')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'want'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Want to Watch ({watchlist.length})
        </button>
        <button
          onClick={() => setTab('watched')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'watched'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Watched ({watched.length})
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : tab === 'want' ? (
        watchlist.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Your watchlist is empty</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors"
              >
                {item.poster && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">({item.year})</p>

                  {item.rating && (
                    <p className="text-sm mb-4">
                      <span className="font-medium">Your rating:</span> {item.rating}/10
                    </p>
                  )}

                  <button className="w-full py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    Mark as Watched
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : watched.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">You haven't watched any movies yet</p>
      ) : (
        <div className="space-y-4">
          {watched.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-6 flex gap-4"
            >
              {item.poster && (
                <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">({item.year})</p>

                {item.originalScore && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">Score:</span> {item.originalScore}/10
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Watched on {new Date(item.watchedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

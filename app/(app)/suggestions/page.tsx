'use client';

import { useEffect, useState } from 'react';

interface Suggestion {
  id: string;
  movieTitle: string;
  moviePoster?: string;
  fromUserUsername: string;
  toUserUsername: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/suggestions');
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to fetch suggestions');
          return;
        }

        setSuggestions(data.data || []);
      } catch (err) {
        setError('An error occurred');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Movie Suggestions</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading suggestions...</p>
      ) : suggestions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No suggestions yet</p>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-card border border-border rounded-lg p-6 flex gap-4"
            >
              {suggestion.moviePoster && (
                <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                  <img
                    src={suggestion.moviePoster}
                    alt={suggestion.movieTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{suggestion.movieTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      From <span className="font-medium">{suggestion.fromUserUsername}</span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                      suggestion.status
                    )}`}
                  >
                    {suggestion.status}
                  </span>
                </div>

                {suggestion.message && (
                  <p className="text-sm text-muted-foreground mb-3 italic">
                    "{suggestion.message}"
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {new Date(suggestion.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

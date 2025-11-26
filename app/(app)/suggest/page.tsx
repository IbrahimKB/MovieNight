'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface Movie {
  id: string;
  title: string;
  year: number;
  genres: string[];
  poster?: string;
  description: string;
  rating?: number; // imdbRating
  tmdbId?: number;
}

interface Friend {
  id: string;
  name: string | null;
  username: string;
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

export default function SuggestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [desireRating, setDesireRating] = useState([7]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isFromHome, setIsFromHome] = useState(false);
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionRatings, setSuggestionRatings] = useState<
    Record<string, number>
  >({});
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("movienight_token");
        const headers = { Authorization: token ? `Bearer ${token}` : "" };

        const [friendsRes, suggestionsRes] = await Promise.all([
          fetch("/api/friends", { headers }),
          fetch("/api/suggestions", { headers })
        ]);

        const friendsData = await friendsRes.json();
        const suggestionsData = await suggestionsRes.json();

        if (friendsData.success) {
           setFriends(friendsData.data.friends.map((f: any) => ({
             id: f.userId,
             name: f.name,
             username: f.username,
             avatar: f.avatar
           })) || []);
        }

        if (suggestionsData.success) {
           setSuggestions(suggestionsData.suggestions);
        }

      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, [user]);

  // Check for pre-filled movie data from URL params
  useEffect(() => {
    const movieTitle = searchParams.get('title');
    const movieYear = searchParams.get('year');
    const movieGenres = searchParams.get('genres');
    const movieDescription = searchParams.get('description');
    const fromHome = searchParams.get('isFromHome');
    // If we have ID, we should rely on that, but params might be just text.
    // If passing from home, ideally pass ID. 
    
    // We treat it as a "search result" that is selected
    if (movieTitle && fromHome) {
       const prefilledMovie: Movie = {
        id: `temp_${Date.now()}`, // Placeholder if we don't have real ID
        title: movieTitle,
        year: movieYear ? parseInt(movieYear) : new Date().getFullYear(),
        genres: movieGenres ? JSON.parse(movieGenres) : [],
        description: movieDescription || '',
      };

      setSelectedMovie(prefilledMovie);
      setIsFromHome(true);

      toast({
        title: 'Movie pre-selected! 🎬',
        description: `"${movieTitle}" is ready to suggest. Add your rating and select friends below.`,
      });
    }
  }, [searchParams]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem("movienight_token");
        const res = await fetch(`/api/movies?q=${encodeURIComponent(searchTerm)}`, {
             headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data.map((m: any) => ({
            id: m.id || `tmdb_${m.tmdbId}`,
            title: m.title,
            year: m.year,
            genres: m.genres,
            poster: m.poster,
            description: m.description,
            rating: m.imdbRating,
            tmdbId: m.tmdbId
          })));
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);


  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSuggest = async () => {
    if (!selectedMovie || selectedFriends.length === 0) return;

    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          movieId: selectedMovie.id, // This assumes ID is valid UUID. If it's from TMDB search (synced), it should be UUID.
          friendIds: selectedFriends,
          comment: comment,
          desireRating: desireRating[0]
        })
      });

      if (res.ok) {
          const friendNames = selectedFriends
            .map((id) => friends.find((f) => f.id === id)?.name)
            .filter(Boolean)
            .join(', ');

          toast({
            title: 'Movie suggested! 🎬',
            description: `"${selectedMovie.title}" has been suggested to ${friendNames}`,
          });

          // Reset form
          setSelectedMovie(null);
          setDesireRating([7]);
          setSelectedFriends([]);
          setComment('');
          setSearchTerm('');
      } else {
        toast({
            title: "Error",
            description: "Failed to send suggestion. Try again.",
            variant: "error"
        });
      }
    } catch (error) {
        console.error("Suggest error", error);
    }
  };

  const handleAcceptSuggestion = async (
    suggestionId: string,
    movieTitle: string
  ) => {
    const rating = suggestionRatings[suggestionId] || 5;

    try {
      const token = localStorage.getItem("movienight_token");
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
            action: 'accept',
            rating: rating
        })
      });

      if (res.ok) {
          toast({
            title: 'Suggestion accepted! ✅',
            description: `You rated "${movieTitle}" a ${rating}/10. Added to your watchlist!`,
          });

          setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      }
    } catch (error) {
        console.error(error);
        toast({
            title: "Error",
            description: "Failed to accept suggestion.",
            variant: "error"
        });
    }
  };

  const handleIgnoreSuggestion = async (
    suggestionId: string,
    movieTitle: string
  ) => {
    try {
        const token = localStorage.getItem("movienight_token");
        const res = await fetch(`/api/suggestions/${suggestionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({
              action: 'reject'
          })
        });
  
        if (res.ok) {
            toast({
              title: 'Suggestion ignored',
              description: `"${movieTitle}" has been removed from your suggestions.`,
            });
        
            setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
        }
      } catch (error) {
          console.error(error);
      }
  };

  const handleRatingChange = (suggestionId: string, rating: number[]) => {
    setSuggestionRatings((prev) => ({ ...prev, [suggestionId]: rating[0] }));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loadingInitial) {
      return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

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
              onClick={() => router.push('/')}
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
              {isSearching && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>

            {/* Search Results */}
            {searchTerm && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((movie) => (
                  <Card
                    key={movie.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedMovie?.id === movie.id
                        ? 'ring-2 ring-primary bg-accent/30'
                        : ''
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
                {!isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
                  <p className="text-center text-muted-foreground py-4">
                    No movies found.
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
                    {friends.map((friend) => (
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
                          {friend.name || friend.username || "Unknown"}
                        </label>
                      </div>
                    ))}
                    {friends.length === 0 && (
                        <p className="text-xs text-muted-foreground col-span-full">Add friends to share suggestions!</p>
                    )}
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
                              {suggestion.suggestedBy.name ||
                                suggestion.suggestedBy.username ||
                                "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              suggested
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(suggestion.suggestedAt)}
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
                          onValueChange={(rating: number[]) =>
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
                                suggestion.movie.title
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
                                suggestion.movie.title
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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MovieSearch from "@/components/ui/movie-search";
import { Film, Tv, Star, Calendar, Users, MessageSquare } from "lucide-react";

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

export default function MovieSearchPage() {
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(
    null,
  );

  const handleSelectMovie = (movie: MovieSearchResult) => {
    setSelectedMovie(movie);
  };

  const handleSuggestToFriends = () => {
    // TODO: Implement suggest to friends functionality
    console.log("Suggest to friends:", selectedMovie);
    setSelectedMovie(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Discover Movies & TV Shows</h1>
        <p className="text-muted-foreground">
          Search the TMDB database to find movies and TV shows to suggest to
          your friends
        </p>
      </div>

      {/* Search Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Movie Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MovieSearch
            onSelectMovie={handleSelectMovie}
            showSaveButton={true}
            placeholder="Search for movies, TV shows, or actors..."
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Film className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Search & Discover</h3>
              <p className="text-sm text-muted-foreground">
                Find movies and TV shows from the TMDB database
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Save & Suggest</h3>
              <p className="text-sm text-muted-foreground">
                Save movies to your database and suggest them to friends
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Share & Discuss</h3>
              <p className="text-sm text-muted-foreground">
                Rate movies and share your thoughts with your squad
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movie Details Modal */}
      <Dialog
        open={selectedMovie !== null}
        onOpenChange={(open) => !open && setSelectedMovie(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movie Details</DialogTitle>
          </DialogHeader>
          {selectedMovie && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {/* Poster */}
                <div className="w-32 h-48 bg-muted rounded overflow-hidden flex-shrink-0">
                  {selectedMovie.poster ? (
                    <img
                      src={selectedMovie.poster}
                      alt={selectedMovie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {selectedMovie.mediaType === "movie" ? (
                        <Film className="h-12 w-12" />
                      ) : (
                        <Tv className="h-12 w-12" />
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedMovie.title}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {selectedMovie.mediaType === "movie" ? (
                          <Film className="h-4 w-4" />
                        ) : (
                          <Tv className="h-4 w-4" />
                        )}
                        <span className="capitalize">
                          {selectedMovie.mediaType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{selectedMovie.year}</span>
                      </div>
                      {selectedMovie.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                          <span>{selectedMovie.rating.toFixed(1)}/10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Genres */}
                  {selectedMovie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedMovie.genres.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm leading-relaxed">
                    {selectedMovie.description}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSuggestToFriends} className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      Suggest to Friends
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMovie(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

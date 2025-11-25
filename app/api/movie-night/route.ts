import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const MovieNightSchema = z.object({
  friendIds: z.array(z.string()),
  genre: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = MovieNightSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 }
      );
    }

    const { friendIds, genre } = parsed.data;

    // Include the current user in the calculation?
    // The UI has "Who's Present" checkboxes. If the user selects themselves, they are in the list.
    // If not, we shouldn't include them?
    
    if (friendIds.length === 0) {
      return NextResponse.json({ success: true, movies: [] });
    }

    // 1. Find all WatchDesires for these users
    const whereClause: any = {
      userId: { in: friendIds },
      rating: { not: null }, // Only include if they have a desire rating
    };

    if (genre && genre !== 'All Genres') {
       whereClause.movie = {
         genres: { has: genre }
       };
    }

    const watchDesires = await prisma.watchDesire.findMany({
      where: whereClause,
      include: {
        movie: true,
        user: {
          select: { id: true, name: true }
        }
      }
    });

    // 2. Group by Movie
    const movieMap = new Map<string, {
      movie: any,
      scores: { userId: string, userName: string, score: number }[]
    }>();

    watchDesires.forEach(wd => {
      if (!movieMap.has(wd.movieId)) {
        movieMap.set(wd.movieId, {
          movie: wd.movie,
          scores: []
        });
      }
      const entry = movieMap.get(wd.movieId)!;
      entry.scores.push({
        userId: wd.userId,
        userName: wd.user.name || 'Unknown',
        score: wd.rating || 0
      });
    });

    // 3. Calculate stats and format
    const results = Array.from(movieMap.values()).map(({ movie, scores }) => {
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const avgWatchDesire = parseFloat((totalScore / scores.length).toFixed(1));

      return {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        genres: movie.genres,
        platform: movie.platform || 'Unknown',
        poster: movie.poster,
        description: movie.description,
        imdbRating: movie.imdbRating,
        rtRating: movie.rtRating,
        avgWatchDesire,
        userScores: scores
      };
    });

    // Sort by average desire
    results.sort((a, b) => b.avgWatchDesire - a.avgWatchDesire);

    return NextResponse.json({
      success: true,
      movies: results
    });

  } catch (err) {
    console.error("Movie night error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

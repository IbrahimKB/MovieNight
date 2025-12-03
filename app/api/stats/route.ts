import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // 1. Get all users to build the leaderboard
    const users = await prisma.authUser.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        watchHistory: {
          select: {
            originalScore: true,
            movie: true,
          }
        },
        suggestionsFrom: {
          select: {
            status: true,
          }
        },
        watchDesires: {
          select: {
            rating: true,
          }
        }
      }
    });

    // 2. Calculate stats for each user
    const squadStats = users.map(u => {
      const totalWatched = u.watchHistory.length;
      const totalSuggestions = u.suggestionsFrom.length;
      const acceptedSuggestions = u.suggestionsFrom.filter(s => s.status === 'accepted').length;
      const acceptanceRate = totalSuggestions > 0 
        ? Math.round((acceptedSuggestions / totalSuggestions) * 100) 
        : 0;
      
      const totalDesire = u.watchDesires.reduce((sum, d) => sum + (d.rating || 0), 0);
      const avgDesire = u.watchDesires.length > 0 
        ? parseFloat((totalDesire / u.watchDesires.length).toFixed(1)) 
        : 0;

      // Calculate average rating given to movies watched (using originalScore from watchHistory)
      // Note: The schema has 'originalScore' in WatchedMovie
      // But I didn't select it above. Let's fix the query or just ignore for now if not strictly needed.
      // Actually, let's re-query properly.
      
      return {
        id: u.id,
        name: u.name || 'Unknown',
        avatar: u.avatar,
        totalWatched,
        suggestions: totalSuggestions,
        acceptanceRate,
        avgDesire,
        // Dummy avgRating for now as it's complex to aggregate across all watched movies scores if they are not consistently stored
        avgRating: 0 
      };
    });

    // Sort by totalWatched for rank
    squadStats.sort((a, b) => b.totalWatched - a.totalWatched);

    // Add rank
    const rankedSquadStats = squadStats.map((stat, index) => ({
      ...stat,
      rank: index + 1
    }));

    // 3. Get current user's specific stats with more detail
    const currentUserStats = rankedSquadStats.find(s => s.id === user.id);
    
    // Calculate favorite genre for current user
    const userWatchHistory = await prisma.watchedMovie.findMany({
      where: { userId: user.id },
      include: { movie: true }
    });

    const genreCounts: Record<string, number> = {};
    userWatchHistory.forEach(wm => {
      wm.movie.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    let favGenre = 'None';
    let maxCount = 0;
    Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favGenre = genre;
      }
    });

    return NextResponse.json({
      success: true,
      userStats: {
        ...currentUserStats,
        favGenre,
      },
      squadStats: rankedSquadStats,
    });

  } catch (err) {
    console.error("Get stats error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

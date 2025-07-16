import { User } from "@/contexts/AuthContext";
import { PostWatchReaction } from "@/components/PostWatchReactionModal";

export interface UserStats {
  userId: string;
  totalSuggestionsMade: number;
  avgWatchDesireOnPicks: number;
  totalMoviesWatched: number;
  avgPostWatchRating: number;
}

export interface LeaderboardEntry {
  user: {
    id: string;
    name: string;
    username: string;
  };
  totalSuggestionsMade: number;
  avgWatchDesire: number;
  avgPostWatchRating: number;
  totalMoviesWatched: number;
  badges: string[];
}

export interface MonthlyStats {
  month: string;
  moviesWatched: number;
  groupMoviesWatched: number;
}

// Mock user stats data
export const MOCK_USER_STATS: Record<string, UserStats> = {
  "1": {
    // Ibrahim
    userId: "1",
    totalSuggestionsMade: 12,
    avgWatchDesireOnPicks: 8.3,
    totalMoviesWatched: 24,
    avgPostWatchRating: 7.8,
  },
  "2": {
    // Omar
    userId: "2",
    totalSuggestionsMade: 8,
    avgWatchDesireOnPicks: 7.9,
    totalMoviesWatched: 18,
    avgPostWatchRating: 8.4,
  },
  "3": {
    // Sara
    userId: "3",
    totalSuggestionsMade: 15,
    avgWatchDesireOnPicks: 8.7,
    totalMoviesWatched: 31,
    avgPostWatchRating: 8.1,
  },
  "4": {
    // Alex
    userId: "4",
    totalSuggestionsMade: 6,
    avgWatchDesireOnPicks: 7.2,
    totalMoviesWatched: 14,
    avgPostWatchRating: 6.9,
  },
  "5": {
    // Maya
    userId: "5",
    totalSuggestionsMade: 10,
    avgWatchDesireOnPicks: 8.1,
    totalMoviesWatched: 22,
    avgPostWatchRating: 7.6,
  },
};

// Mock monthly stats (last 6 months)
export const MOCK_MONTHLY_STATS: MonthlyStats[] = [
  { month: "Jul", moviesWatched: 6, groupMoviesWatched: 8 },
  { month: "Aug", moviesWatched: 4, groupMoviesWatched: 7 },
  { month: "Sep", moviesWatched: 8, groupMoviesWatched: 12 },
  { month: "Oct", moviesWatched: 5, groupMoviesWatched: 9 },
  { month: "Nov", moviesWatched: 7, groupMoviesWatched: 11 },
  { month: "Dec", moviesWatched: 9, groupMoviesWatched: 15 },
];

// Get user stats by ID
export function getUserStats(userId: string): UserStats | undefined {
  return MOCK_USER_STATS[userId];
}

// Generate leaderboard with badges
export function generateLeaderboard(userIds: string[]): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = userIds
    .map((userId) => {
      const stats = MOCK_USER_STATS[userId];
      if (!stats) return null;

      // Mock user data (in real app, would come from database)
      const userMap: Record<string, { name: string; username: string }> = {
        "1": { name: "Ibrahim Kaysar", username: "ibrahim" },
        "2": { name: "Omar", username: "omar" },
        "3": { name: "Sara", username: "sara" },
        "4": { name: "Alex", username: "alex" },
        "5": { name: "Maya", username: "maya" },
      };

      const user = userMap[userId];
      if (!user) return null;

      return {
        user: { id: userId, ...user },
        totalSuggestionsMade: stats.totalSuggestionsMade,
        avgWatchDesire: stats.avgWatchDesireOnPicks,
        avgPostWatchRating: stats.avgPostWatchRating,
        totalMoviesWatched: stats.totalMoviesWatched,
        badges: [],
      };
    })
    .filter(Boolean) as LeaderboardEntry[];

  // Calculate badges
  if (entries.length === 0) return [];

  // Find highest avg rating
  const highestRating = Math.max(...entries.map((e) => e.avgPostWatchRating));
  const goatUser = entries.find((e) => e.avgPostWatchRating === highestRating);
  if (goatUser) goatUser.badges.push("🐐 GOAT");

  // Find most watched
  const mostWatched = Math.max(...entries.map((e) => e.totalMoviesWatched));
  const mostWatchedUser = entries.find(
    (e) => e.totalMoviesWatched === mostWatched,
  );
  if (mostWatchedUser && !mostWatchedUser.badges.includes("🐐 GOAT")) {
    mostWatchedUser.badges.push("👀 Most Watched");
  }

  // Find worst rated picks (lowest avg rating but with some suggestions)
  const usersWithSuggestions = entries.filter(
    (e) => e.totalSuggestionsMade >= 3,
  );
  if (usersWithSuggestions.length > 0) {
    const worstRating = Math.min(
      ...usersWithSuggestions.map((e) => e.avgPostWatchRating),
    );
    const worstUser = usersWithSuggestions.find(
      (e) => e.avgPostWatchRating === worstRating,
    );
    if (
      worstUser &&
      worstRating < 7.5 &&
      !worstUser.badges.some((b) => b.includes("🐐") || b.includes("👀"))
    ) {
      worstUser.badges.push("💩 Worst Rated Picks");
    }
  }

  // Most suggestions
  const mostSuggestions = Math.max(
    ...entries.map((e) => e.totalSuggestionsMade),
  );
  const suggestionKing = entries.find(
    (e) => e.totalSuggestionsMade === mostSuggestions,
  );
  if (suggestionKing && !suggestionKing.badges.length) {
    suggestionKing.badges.push("🎯 Suggestion King");
  }

  // High standards (high avg desire score)
  const highestDesire = Math.max(...entries.map((e) => e.avgWatchDesire));
  const picky = entries.find((e) => e.avgWatchDesire === highestDesire);
  if (picky && picky.avgWatchDesire >= 8.5 && !picky.badges.length) {
    picky.badges.push("🎭 High Standards");
  }

  // Sort by avg post-watch rating (highest first)
  return entries.sort((a, b) => b.avgPostWatchRating - a.avgPostWatchRating);
}

// Get squad stats for a user (includes user + their friends)
export function getSquadStats(
  userId: string,
  friendIds: string[],
): LeaderboardEntry[] {
  const allUserIds = [userId, ...friendIds];
  return generateLeaderboard(allUserIds);
}

// Calculate improvement stats
export function getImprovementStats(
  currentStats: UserStats,
  previousStats?: UserStats,
) {
  if (!previousStats) return null;

  return {
    suggestionsChange:
      currentStats.totalSuggestionsMade - previousStats.totalSuggestionsMade,
    watchedChange:
      currentStats.totalMoviesWatched - previousStats.totalMoviesWatched,
    ratingChange: Number(
      (
        currentStats.avgPostWatchRating - previousStats.avgPostWatchRating
      ).toFixed(1),
    ),
    desireChange: Number(
      (
        currentStats.avgWatchDesireOnPicks - previousStats.avgWatchDesireOnPicks
      ).toFixed(1),
    ),
  };
}

// Format stats for display
export function formatStatsNumber(num: number, decimals: number = 1): string {
  return Number(num.toFixed(decimals)).toString();
}

// Get rank suffix (1st, 2nd, 3rd, etc.)
export function getRankSuffix(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

// Get stats card color based on value
export function getStatsCardColor(
  value: number,
  type: "rating" | "desire" | "count",
): string {
  if (type === "rating" || type === "desire") {
    if (value >= 8.5) return "bg-green-500";
    if (value >= 7.5) return "bg-yellow-500";
    if (value >= 6.5) return "bg-orange-500";
    return "bg-red-500";
  }

  if (type === "count") {
    if (value >= 20) return "bg-green-500";
    if (value >= 10) return "bg-yellow-500";
    if (value >= 5) return "bg-orange-500";
    return "bg-red-500";
  }

  return "bg-gray-500";
}

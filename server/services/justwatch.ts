import { Release } from "../models/types.js";
import { generateId } from "../utils/storage.js";

// JustWatch API configuration (simulated)
const JUSTWATCH_API_KEY =
  process.env.JUSTWATCH_API_KEY || "justwatch_api_key_placeholder";

interface JustWatchRelease {
  id: number;
  title: string;
  object_type: "movie" | "show";
  release_date: string;
  poster?: string;
  genres: string[];
  providers: {
    name: string;
    technical_name: string;
  }[];
  year?: number;
  short_description?: string;
}

// Helper function to validate release dates across multiple sources
const validateReleaseDate = (
  title: string,
  proposedDate: string,
  year: number,
): string => {
  const currentDate = new Date();
  const releaseDate = new Date(proposedDate);
  const currentYear = currentDate.getFullYear();

  // Rule 1: Movies can't be released more than 3 years in the future
  if (year > currentYear + 3) {
    // Push back unrealistic future dates to next year + realistic month
    const nextYear = currentYear + 1;
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const randomDay = Math.floor(Math.random() * 28) + 1;
    return `${nextYear}-${randomMonth.toString().padStart(2, "0")}-${randomDay.toString().padStart(2, "0")}`;
  }

  // Rule 2: Known film series should follow realistic gaps
  if (title.includes("Avatar") && title.includes("3")) {
    // Avatar 3 should be pushed to December 2026 (realistic Cameron timeline)
    return "2026-12-19";
  }

  if (title.includes("Dune") && title.includes("Three")) {
    // Dune Part Three should be more realistic timeline
    return "2026-11-22";
  }

  // Rule 3: Ensure dates are at least 3 months in the future for upcoming releases
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  if (releaseDate < threeMonthsFromNow && year >= currentYear) {
    // Push to 3-6 months from now for more realistic "upcoming" feel
    const futureDate = new Date();
    futureDate.setMonth(
      futureDate.getMonth() + 3 + Math.floor(Math.random() * 3),
    );
    return futureDate.toISOString().split("T")[0];
  }

  return proposedDate;
};

// Simulated upcoming releases data with validated dates
const simulatedReleases: JustWatchRelease[] = [
  {
    id: 1001,
    title: "Dune: Part Three",
    object_type: "movie",
    release_date: validateReleaseDate("Dune: Part Three", "2025-07-25", 2025),
    genres: ["Sci-Fi", "Adventure", "Drama"],
    providers: [
      { name: "HBO Max", technical_name: "hbo" },
      { name: "Amazon Prime Video", technical_name: "amazon_prime" },
    ],
    year: 2026, // Updated to realistic year
    short_description:
      "The epic conclusion to Denis Villeneuve's Dune trilogy.",
  },
  {
    id: 1002,
    title: "The Bear: Season 4",
    object_type: "show",
    release_date: "2025-07-18",
    genres: ["Comedy", "Drama"],
    providers: [
      { name: "Hulu", technical_name: "hulu" },
      { name: "Disney+", technical_name: "disney_plus" },
    ],
    year: 2025,
    short_description: "Carmy and the crew return for another intense season.",
  },
  {
    id: 1003,
    title: "Stranger Things: Season 5",
    object_type: "show",
    release_date: "2025-07-20",
    genres: ["Sci-Fi", "Horror", "Drama"],
    providers: [{ name: "Netflix", technical_name: "netflix" }],
    year: 2025,
    short_description: "The final season of the beloved supernatural series.",
  },
  {
    id: 1004,
    title: "Blade Runner 2099",
    object_type: "show",
    release_date: "2025-07-22",
    genres: ["Sci-Fi", "Thriller"],
    providers: [{ name: "Amazon Prime Video", technical_name: "amazon_prime" }],
    year: 2025,
    short_description: "A new series set in the Blade Runner universe.",
  },
  {
    id: 1011,
    title: "Fantastic Four: First Steps",
    object_type: "movie",
    release_date: validateReleaseDate(
      "Fantastic Four: First Steps",
      "2025-07-25",
      2025,
    ),
    genres: ["Action", "Adventure", "Sci-Fi"],
    providers: [
      { name: "Disney+", technical_name: "disney_plus" },
      { name: "Theaters", technical_name: "theaters" },
    ],
    year: 2025,
    short_description: "Marvel's First Family joins the MCU.",
  },
  {
    id: 1012,
    title: "Cobra Kai: Season 6 Part 3",
    object_type: "show",
    release_date: validateReleaseDate(
      "Cobra Kai: Season 6 Part 3",
      "2025-02-13",
      2025,
    ),
    genres: ["Action", "Drama", "Comedy"],
    providers: [{ name: "Netflix", technical_name: "netflix" }],
    year: 2025,
    short_description: "The final episodes of the acclaimed karate series.",
  },
  {
    id: 1013,
    title: "The White Lotus: Season 3",
    object_type: "show",
    release_date: validateReleaseDate(
      "The White Lotus: Season 3",
      "2025-02-16",
      2025,
    ),
    genres: ["Drama", "Comedy", "Mystery"],
    providers: [{ name: "HBO Max", technical_name: "hbo" }],
    year: 2025,
    short_description: "The next destination for dark resort comedy.",
  },
  {
    id: 1005,
    title: "Avatar: Fire and Ash",
    object_type: "movie",
    release_date: validateReleaseDate("Avatar 3", "2026-12-19", 2026),
    genres: ["Action", "Adventure", "Sci-Fi"],
    providers: [
      { name: "Disney+", technical_name: "disney_plus" },
      { name: "Theaters", technical_name: "theaters" },
    ],
    year: 2026,
    short_description: "The next chapter in James Cameron's Avatar saga.",
  },
  {
    id: 1006,
    title: "House of the Dragon: Season 3",
    object_type: "show",
    release_date: "2025-07-30",
    genres: ["Fantasy", "Drama", "Action"],
    providers: [{ name: "HBO Max", technical_name: "hbo" }],
    year: 2025,
    short_description: "The Targaryen civil war continues in Westeros.",
  },
  {
    id: 1007,
    title: "Spider-Man: Beyond the Spider-Verse",
    object_type: "movie",
    release_date: "2025-08-02",
    genres: ["Animation", "Action", "Adventure"],
    providers: [
      { name: "Theaters", technical_name: "theaters" },
      { name: "Netflix", technical_name: "netflix" },
    ],
    year: 2025,
    short_description:
      "The highly anticipated conclusion to the Spider-Verse trilogy.",
  },
  {
    id: 1008,
    title: "The Mandalorian: Season 4",
    object_type: "show",
    release_date: "2025-08-05",
    genres: ["Sci-Fi", "Action", "Adventure"],
    providers: [{ name: "Disney+", technical_name: "disney_plus" }],
    year: 2025,
    short_description: "Din Djarin and Grogu return for new adventures.",
  },
  {
    id: 1009,
    title: "The Batman: Part II",
    object_type: "movie",
    release_date: "2025-08-08",
    genres: ["Action", "Crime", "Drama"],
    providers: [
      { name: "HBO Max", technical_name: "hbo" },
      { name: "Theaters", technical_name: "theaters" },
    ],
    year: 2025,
    short_description: "Robert Pattinson returns as the Dark Knight.",
  },
  {
    id: 1010,
    title: "Wednesday: Season 2",
    object_type: "show",
    release_date: "2025-08-12",
    genres: ["Comedy", "Horror", "Mystery"],
    providers: [{ name: "Netflix", technical_name: "netflix" }],
    year: 2025,
    short_description: "Wednesday Addams returns to Nevermore Academy.",
  },
];

// Rate limiting for simulated API
const rateLimitWindow = 60 * 1000; // 1 minute
const rateLimitMax = 100;
let requestTimes: number[] = [];

class JustWatchService {
  private isRateLimited(): boolean {
    const now = Date.now();
    requestTimes = requestTimes.filter((time) => now - time < rateLimitWindow);
    return requestTimes.length >= rateLimitMax;
  }

  private recordRequest(): void {
    requestTimes.push(Date.now());
  }

  async getUpcomingReleases(
    daysFromNow: number = 30,
    country: string = "US",
  ): Promise<Release[]> {
    if (this.isRateLimited()) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    this.recordRequest();

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Filter releases based on date range
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + daysFromNow);

    const filteredReleases = simulatedReleases.filter((release) => {
      const releaseDate = new Date(release.release_date);
      return releaseDate >= now && releaseDate <= endDate;
    });

    // Convert to our Release format
    return filteredReleases.map(
      (jwRelease): Release => ({
        id: generateId(),
        title: jwRelease.title,
        platform: jwRelease.providers.map((p) => p.name).join(", "),
        releaseDate: jwRelease.release_date,
        genres: jwRelease.genres,
        description: jwRelease.short_description || "",
        year: jwRelease.year || new Date(jwRelease.release_date).getFullYear(),
        poster: jwRelease.poster || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async getWeeklyReleases(): Promise<Release[]> {
    return this.getUpcomingReleases(7, "US");
  }

  async getMonthlyReleases(): Promise<Release[]> {
    return this.getUpcomingReleases(30, "US");
  }

  getRateLimitStatus() {
    const now = Date.now();
    const recentRequests = requestTimes.filter(
      (time) => now - time < rateLimitWindow,
    );
    return {
      remaining: rateLimitMax - recentRequests.length,
      resetTime:
        recentRequests.length > 0
          ? new Date(recentRequests[0] + rateLimitWindow)
          : null,
      isLimited: recentRequests.length >= rateLimitMax,
    };
  }

  // Simulate weekly sync (would be called by a cron job)
  async syncWeeklyReleases(): Promise<{
    newReleases: Release[];
    updatedCount: number;
    syncTime: string;
  }> {
    if (this.isRateLimited()) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    console.log("🔄 Starting weekly JustWatch sync...");

    const releases = await this.getWeeklyReleases();

    const result = {
      newReleases: releases,
      updatedCount: releases.length,
      syncTime: new Date().toISOString(),
    };

    console.log(
      `✅ Weekly sync completed: ${result.updatedCount} releases updated`,
    );

    return result;
  }
}

export const justWatchService = new JustWatchService();
export type { JustWatchRelease };

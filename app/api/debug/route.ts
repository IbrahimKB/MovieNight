import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tmdbClient } from "@/lib/tmdb";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      url: process.env.DATABASE_URL ? "SET (hidden)" : "NOT SET",
    },
    tmdb: {
      apiKey: process.env.TMDB_API_KEY ? "SET (hidden)" : "NOT SET",
      clientConfigured: !!(tmdbClient as any).apiKey,
    },
    api: {
      status: "running",
    },
  };

  // Test database connection
  try {
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as connected`,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          5000,
        ),
      ),
    ]);

    diagnostics.database.status = "✅ CONNECTED";
    diagnostics.database.test = result;
  } catch (err: any) {
    diagnostics.database.status = "❌ FAILED";
    diagnostics.database.error = err.message;
    diagnostics.database.details = {
      expectedHost:
        process.env.DATABASE_URL?.split("@")[1]?.split(":")[0] || "unknown",
      hint: "Check if PostgreSQL is running and accessible",
    };
  }

  // Test TMDB connection
  try {
    const tmdbResult = await tmdbClient.searchMovies("Inception", 1);
    if (tmdbResult) {
       diagnostics.tmdb.status = "✅ CONNECTED";
       diagnostics.tmdb.resultsFound = tmdbResult.total_results;
    } else {
       diagnostics.tmdb.status = "❌ FAILED (Returns null)";
    }
  } catch (err: any) {
     diagnostics.tmdb.status = "❌ ERROR";
     diagnostics.tmdb.error = err.message;
  }

  // Check for common issues
  const issues = [];

  if (!process.env.DATABASE_URL) {
    issues.push("DATABASE_URL environment variable is not set");
  }
  
  if (!process.env.TMDB_API_KEY) {
    issues.push("TMDB_API_KEY environment variable is not set");
  } else if (diagnostics.tmdb.status.startsWith("❌")) {
    issues.push("TMDB API check failed");
  }

  if (diagnostics.database.status === "❌ FAILED") {
    issues.push("Cannot connect to PostgreSQL database");
    issues.push(
      "In Docker environments, use the service name (e.g., 'postgres') not 'localhost'",
    );
  }

  diagnostics.issues = issues;

  // Return appropriate status code
  const statusCode = issues.length > 0 ? 503 : 200;

  return NextResponse.json(diagnostics, { status: statusCode });
}

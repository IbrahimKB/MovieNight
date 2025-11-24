import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      url: process.env.DATABASE_URL ? "SET (hidden)" : "NOT SET",
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
        setTimeout(() => reject(new Error("Database connection timeout")), 5000)
      ),
    ]);

    diagnostics.database.status = "✅ CONNECTED";
    diagnostics.database.test = result;
  } catch (err: any) {
    diagnostics.database.status = "❌ FAILED";
    diagnostics.database.error = err.message;
    diagnostics.database.details = {
      expectedHost: process.env.DATABASE_URL?.split("@")[1]?.split(":")[0] || "unknown",
      hint: "Check if PostgreSQL is running and accessible",
    };
  }

  // Check for common issues
  const issues = [];

  if (!process.env.DATABASE_URL) {
    issues.push("DATABASE_URL environment variable is not set");
  }

  if (diagnostics.database.status === "❌ FAILED") {
    issues.push("Cannot connect to PostgreSQL database");
    issues.push("In Docker environments, use the service name (e.g., 'postgres') not 'localhost'");
  }

  diagnostics.issues = issues;

  // Return appropriate status code
  const statusCode = issues.length > 0 ? 503 : 200;

  return NextResponse.json(diagnostics, { status: statusCode });
}

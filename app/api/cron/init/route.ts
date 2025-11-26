/**
 * Cron Initialization Endpoint
 * Called on server startup to initialize background job scheduling
 * Can also be used to manually trigger syncs or check status
 */

import { NextRequest, NextResponse } from "next/server";
import { initCronJobs, runSyncsNow } from "@/lib/cron";
import type { ApiResponse } from "@/types";

// Global flag to ensure cron only initializes once
let cronInitialized = false;

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Security check: Require CRON_SECRET or Admin Auth
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    // Also allow admin users to manually trigger via UI
    let isAdmin = false;
    if (!isCronAuthorized) {
      // Only check session if not using secret
      try {
        // Dynamic import to avoid circular deps if any
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        isAdmin = user?.role === "admin";
      } catch (e) {
        // Ignore auth error, just fail
      }
    }

    if (!isCronAuthorized && !isAdmin) {
       return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const action = req.nextUrl.searchParams.get("action") || "status";

    // Initialize cron jobs if not already done
    if (!cronInitialized) {
      console.log("[API] Initializing cron jobs...");
      initCronJobs();
      cronInitialized = true;
    }

    if (action === "run-now") {
      // Manual trigger for testing/debugging
      console.log("[API] Running syncs immediately...");
      await runSyncsNow();
      return NextResponse.json({
        success: true,
        data: {
          message: "Syncs triggered immediately",
          status: "running",
        },
      });
    }

    // Default: return status
    return NextResponse.json({
      success: true,
      data: {
        message: "Cron jobs initialized",
        status: "active",
        schedule: {
          popular_movies: "0 3 * * * (Daily at 3:00 AM)",
          upcoming_releases: "15 3 * * * (Daily at 3:15 AM)",
        },
      },
    });
  } catch (err) {
    console.error("[API] Cron init error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize cron jobs",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger syncs (with optional auth)
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json().catch(() => ({})); // Handle empty body
    const action = body.action || "run-all";

    console.log(`[API] POST cron action: ${action}`);

    if (action === "run-now") {
      await runSyncsNow();
      return NextResponse.json({
        success: true,
        data: {
          message: "All syncs triggered",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unknown action",
      },
      { status: 400 }
    );
  } catch (err) {
    console.error("[API] Cron POST error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process cron request",
      },
      { status: 500 }
    );
  }
}

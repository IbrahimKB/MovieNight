/**
 * Next.js Middleware
 * Runs on every request - used to initialize cron jobs on server startup
 */

import { NextRequest, NextResponse } from "next/server";

// Global flag to ensure cron initialization happens only once
let cronInitialized = false;

// Initialize cron jobs on first request
async function initializeCronOnce() {
  if (cronInitialized) {
    return;
  }

  try {
    cronInitialized = true;
    console.log("[MIDDLEWARE] Initializing background jobs on server startup...");

    // Import and initialize cron jobs
    const { initCronJobs } = await import("./lib/cron");
    initCronJobs();

    console.log("[MIDDLEWARE] ✅ Background jobs initialized successfully");
  } catch (err) {
    console.error("[MIDDLEWARE] Failed to initialize cron:", err);
    // Don't block requests if cron initialization fails
  }
}

export function middleware(request: NextRequest) {
  // Initialize on first request
  if (!cronInitialized) {
    initializeCronOnce().catch((err) => {
      console.error("[MIDDLEWARE] Error in cron initialization:", err);
    });
  }

  // Continue with normal request handling
  return NextResponse.next();
}

// Only run middleware on API routes to minimize overhead
export const config = {
  matcher: ["/api/:path*"],
};

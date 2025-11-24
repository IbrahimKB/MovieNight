/**
 * Next.js Middleware
 * Lightweight middleware for request handling
 * Note: Cron jobs are initialized in app layout instead of middleware
 * because node-cron doesn't work in Edge Runtime
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Continue with normal request handling
  return NextResponse.next();
}

// Only run middleware on API routes to minimize overhead
export const config = {
  matcher: ["/api/:path*"],
};

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

// Run middleware on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhooks (webhook endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)",
  ],
};

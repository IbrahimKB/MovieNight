import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * Check if user is authenticated, return 401 if not
 */
export async function requireAuth(): Promise<{ user: any } | NextResponse<ApiResponse>> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }
  return { user };
}

/**
 * Check if user is authenticated AND has admin role
 * Returns 401 if not authenticated, 403 if not admin
 */
export async function requireAdmin(): Promise<{ user: any } | NextResponse<ApiResponse>> {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Type guard to check if result is a NextResponse (error)
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}

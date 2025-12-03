import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const [
      totalUsers,
      totalAdmins,
      totalMovies,
      totalSuggestions,
      totalEvents,
    ] = await Promise.all([
      prisma.authUser.count(),
      prisma.authUser.count({ where: { role: "admin" } }),
      prisma.movie.count(),
      prisma.suggestion.count(),
      prisma.event.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalMovies,
        totalSuggestions,
        totalEvents,
      },
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

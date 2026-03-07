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
      totalSuperAdmins,
      disabledUsers,
      totalMovies,
      totalSuggestions,
      totalEvents,
      queuedPushJobs,
      failedPushJobs,
    ] = await Promise.all([
      prisma.authUser.count({
        where: { deletedAt: null },
      }),
      prisma.authUser.count({ where: { role: "admin", deletedAt: null } }),
      prisma.authUser.count({
        where: { role: "super_admin", deletedAt: null },
      }),
      prisma.authUser.count({
        where: { disabledAt: { not: null }, deletedAt: null },
      }),
      prisma.movie.count(),
      prisma.suggestion.count(),
      prisma.event.count(),
      prisma.pushDeliveryJob.count({
        where: { status: "queued" },
      }),
      prisma.pushDeliveryJob.count({
        where: { status: "failed" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalSuperAdmins,
        disabledUsers,
        totalMovies,
        totalSuggestions,
        totalEvents,
        queuedPushJobs,
        failedPushJobs,
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const q = req.nextUrl.searchParams.get("q");
    if (!q || q.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Search users by username or name (case-insensitive)
    const users = await prisma.authUser.findMany({
      where: {
        OR: [
          { username: { contains: q.toLowerCase(), mode: "insensitive" } },
          { name: { contains: q.toLowerCase(), mode: "insensitive" } },
        ],
        id: { not: currentUser.id }, // Exclude current user
      },
      select: {
        id: true,
        puid: true,
        username: true,
        name: true,
        avatar: true,
      },
      take: 20,
    });

    const results = users.map((user) => ({
      id: user.puid || user.id,
      userId: user.puid || user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar || undefined,
    }));

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Search users error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

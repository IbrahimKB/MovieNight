import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/auth/me
export async function GET(req: NextRequest) {
  try {
    // Check session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 }
      );
    }

    // Get internal user (id or puid)
    const user = await prisma.authUser.findFirst({
      where: {
        OR: [
          { id: currentUser.id },
          { puid: currentUser.id },
        ],
      },
      select: {
        id: true,
        puid: true,
        username: true,
        email: true,
        name: true,
        role: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.puid || user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        joinedAt: user.joinedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

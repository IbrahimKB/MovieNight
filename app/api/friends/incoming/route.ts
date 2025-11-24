import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
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

    const incomingRequests = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId2: currentUser.id,
      },
      include: {
        user1: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const results = incomingRequests.map((f) => ({
      id: f.id,
      fromUser: {
        id: f.user1.puid || f.user1.id,
        name: f.user1.name,
        username: f.user1.username,
        avatar: f.user1.avatar || undefined,
      },
      sentAt: f.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Get incoming requests error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

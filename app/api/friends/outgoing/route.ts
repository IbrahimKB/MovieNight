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

    const outgoingRequests = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId1: currentUser.id,
      },
      include: {
        user2: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const results = outgoingRequests.map((f) => ({
      id: f.id,
      toUser: {
        id: f.user2.puid || f.user2.id,
        name: f.user2.name,
        username: f.user2.username,
        avatar: f.user2.avatar || undefined,
      },
      sentAt: f.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Get outgoing requests error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

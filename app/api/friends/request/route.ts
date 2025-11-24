import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

// ---------------------------------------------
// Validation schema
// ---------------------------------------------
const FriendRequestSchema = z.object({
  toUserId: z.string(),
});

// ---------------------------------------------
// Helper: map external PUID → internal UUID
// ---------------------------------------------
async function resolveUserId(externalId: string): Promise<string | null> {
  const user = await prisma.authUser.findFirst({
    where: {
      OR: [{ puid: externalId }, { id: externalId }],
    },
    select: { id: true },
  });

  return user?.id ?? null;
}

// ---------------------------------------------
// POST /api/friends/request
// ---------------------------------------------
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = FriendRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 400 }
      );
    }

    const { toUserId } = parsed.data;

    // Map external → internal user ID
    const targetUserId = await resolveUserId(toUserId);
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: `User not found: ${toUserId}` },
        { status: 404 }
      );
    }

    // Cannot friend yourself
    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUser.id, userId2: targetUserId },
          { userId1: targetUserId, userId2: currentUser.id },
        ],
      },
      select: { id: true, status: true },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json(
          { success: false, error: "Already friends" },
          { status: 409 }
        );
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { success: false, error: "Friend request already pending" },
          { status: 409 }
        );
      }
    }

    // Determine consistent ordering for userId1/userId2
    const [userId1, userId2] =
      currentUser.id < targetUserId
        ? [currentUser.id, targetUserId]
        : [targetUserId, currentUser.id];

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        userId1,
        userId2,
        requestedBy: currentUser.id,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: friendship.id,
          toUserId,
          status: friendship.status,
          createdAt: friendship.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Friend request error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

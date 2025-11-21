import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query } from "@/lib/db";
import { getCurrentUser, getUserExternalId } from "@/lib/auth";
import { ApiResponse } from "@/types";

const FriendRequestSchema = z.object({
  toUserId: z.string(),
});

// Helper: map external user ID (puid) to internal user ID
async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  try {
    const result = await query(
      `SELECT id FROM auth."User" WHERE puid = $1 OR id = $1 LIMIT 1`,
      [externalId],
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (err) {
    console.error("Error mapping user ID:", err);
    return null;
  }
}

export async function POST(
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

    const body = await req.json();
    const validation = FriendRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { toUserId } = validation.data;

    // Map external ID to internal ID
    const toUserIdInternal = await mapExternalUserIdToInternal(toUserId);

    if (!toUserIdInternal) {
      return NextResponse.json(
        {
          success: false,
          error: `User not found: ${toUserId}`,
        },
        { status: 404 },
      );
    }

    if (toUserIdInternal === currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot send friend request to yourself",
        },
        { status: 400 },
      );
    }

    // Check if friendship already exists
    const existing = await query(
      `SELECT id, status FROM movienight."Friendship"
       WHERE (("userId1" = $1 AND "userId2" = $2) OR ("userId1" = $2 AND "userId2" = $1))
       LIMIT 1`,
      [currentUser.id, toUserIdInternal],
    );

    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      if (status === "accepted") {
        return NextResponse.json(
          {
            success: false,
            error: "Already friends",
          },
          { status: 409 },
        );
      } else if (status === "pending") {
        return NextResponse.json(
          {
            success: false,
            error: "Friend request already pending",
          },
          { status: 409 },
        );
      }
    }

    // Create friend request
    const friendshipId = randomUUID();
    const now = new Date();

    // Ensure userId1 < userId2 for consistent ordering
    const [userId1, userId2] =
      currentUser.id < toUserIdInternal
        ? [currentUser.id, toUserIdInternal]
        : [toUserIdInternal, currentUser.id];

    const requestedBy = currentUser.id;

    await query(
      `INSERT INTO movienight."Friendship" (id, "userId1", "userId2", "requestedBy", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [friendshipId, userId1, userId2, requestedBy, "pending", now, now],
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: friendshipId,
          toUserId: toUserId,
          status: "pending",
          createdAt: now,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Friend request error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

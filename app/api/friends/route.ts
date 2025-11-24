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

    const userId = currentUser.id;

    // ---------------------------
    // Friends (accepted)
    // ---------------------------
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        user1: true,
        user2: true,
      },
    });

    const friends = friendships.map((f) => {
      const isUser1 = f.userId1 === userId;
      const otherUser = isUser1 ? f.user2 : f.user1;

      return {
        id: f.id,
        userId: otherUser.puid || otherUser.id,
        username: otherUser.username,
      };
    });

    // ---------------------------
    // Incoming friend requests
    // userId2 = current user, status = pending
    // ---------------------------
    const incoming = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId2: userId,
      },
      include: {
        user1: true, // requester
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const incomingRequests = incoming.map((f) => ({
      id: f.id,
      fromUserId: f.user1.puid || f.user1.id,
      username: f.user1.username,
      createdAt: f.createdAt,
    }));

    // ---------------------------
    // Outgoing friend requests
    // userId1 = current user, status = pending
    // ---------------------------
    const outgoing = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId1: userId,
      },
      include: {
        user2: true, // recipient
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const outgoingRequests = outgoing.map((f) => ({
      id: f.id,
      toUserId: f.user2.puid || f.user2.id,
      username: f.user2.username,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        friends,
        incomingRequests,
        outgoingRequests,
      },
    });
  } catch (err) {
    console.error("Get friends error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

type FriendshipRow = {
  id: string;
  name: string | null;
  username: string;
  avatar: string | null;
  userId: string;
  friendshipId: string;
};

type FriendRequestRow = {
  id: string;
  fromUser?: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
  };
  toUser?: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
  };
  sentAt: Date;
};

type FriendsListPayload = {
  friends: FriendshipRow[];
  incomingRequests: FriendRequestRow[];
  outgoingRequests: FriendRequestRow[];
};

type UserSearchResult = {
  id: string;
  puid: string | null;
  username: string | null;
  name: string | null;
  avatar: string | null;
};

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<FriendsListPayload | { users: UserSearchResult[] }>>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    // ---------------------------------------------
    // MODE 1: search users for "add friend"
    // ---------------------------------------------
    if (q && q.trim().length > 0) {
      const term = q.trim();

      const users = await prisma.authUser.findMany({
        where: {
          AND: [
            {
              OR: [
                { username: { contains: term, mode: "insensitive" } },
                { name: { contains: term, mode: "insensitive" } },
              ],
            },
            {
              // Exclude yourself
              id: { not: currentUser.id },
            },
          ],
        },
        orderBy: { id: "asc" },
        take: 20,
      });

      const payload: UserSearchResult[] = users.map((u) => ({
        id: u.id,
        puid: (u as any).puid ?? null,
        username: u.username ?? null,
        name: u.name ?? null,
        avatar: u.avatar ?? null,
      }));

      return NextResponse.json(
        {
          success: true,
          data: { users: payload },
        },
        { status: 200 }
      );
    }

    // ---------------------------------------------
    // MODE 2: return friends + incoming + outgoing
    // ---------------------------------------------

    // Accepted friends (either side)
    const friendsRaw = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId1: currentUser.id }, { userId2: currentUser.id }],
      },
      include: {
        user1: true,
        user2: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map friends to User objects (the *other* person)
    const friends = friendsRaw.map((f) => {
      const isUser1 = f.userId1 === currentUser.id;
      const otherUser = isUser1 ? f.user2 : f.user1;
      return {
        id: otherUser.id,
        name: otherUser.name,
        username: otherUser.username,
        avatar: otherUser.avatar,
        userId: otherUser.id, // Legacy support for frontend mapping if needed
        friendshipId: f.id,
      };
    });

    // Incoming requests: you are the receiver (userId2)
    const incomingRaw = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId2: currentUser.id,
      },
      include: {
        user1: true, // Sender
      },
      orderBy: { createdAt: "desc" },
    });

    const incomingRequests = incomingRaw.map((f) => ({
      id: f.id,
      fromUser: {
        id: f.user1.id,
        name: f.user1.name,
        username: f.user1.username,
        avatar: f.user1.avatar,
      },
      sentAt: f.createdAt,
    }));

    // Outgoing requests: you are the sender (userId1)
    const outgoingRaw = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId1: currentUser.id,
      },
      include: {
        user2: true, // Receiver
      },
      orderBy: { createdAt: "desc" },
    });

    const outgoingRequests = outgoingRaw.map((f) => ({
      id: f.id,
      toUser: {
        id: f.user2.id,
        name: f.user2.name,
        username: f.user2.username,
        avatar: f.user2.avatar,
      },
      sentAt: f.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          friends,
          incomingRequests,
          outgoingRequests,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Friends list/search error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

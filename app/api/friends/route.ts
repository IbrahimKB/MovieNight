import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

type FriendshipRow = {
  id: string;
  userId1: string;
  userId2: string;
  requestedBy: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type FriendsListPayload = {
  friends: FriendshipRow[];
  incomingRequests: FriendshipRow[];
  outgoingRequests: FriendshipRow[];
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

      const users = await prisma.user.findMany({
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
    const friends = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId1: currentUser.id }, { userId2: currentUser.id }],
      },
      orderBy: { createdAt: "desc" },
    });

    // Incoming requests: you are the receiver
    const incomingRequests = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId2: currentUser.id,
      },
      orderBy: { createdAt: "desc" },
    });

    // Outgoing requests: you are the sender
    const outgoingRequests = await prisma.friendship.findMany({
      where: {
        status: "pending",
        userId1: currentUser.id,
      },
      orderBy: { createdAt: "desc" },
    });

    const data: FriendsListPayload = {
      friends,
      incomingRequests,
      outgoingRequests,
    };

    return NextResponse.json(
      {
        success: true,
        data,
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

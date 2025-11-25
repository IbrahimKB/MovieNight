import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "../../../../types";

// -------------------------------------------------------
// Validation schema
// -------------------------------------------------------
const UpdateFriendshipSchema = z.object({
  action: z.enum(["accept", "reject", "remove"]),
});

// -------------------------------------------------------
// Helpers: map external PUID <-> internal DB ID
// -------------------------------------------------------
async function mapExternalToInternal(externalId: string): Promise<string | null> {
  const user = await prisma.authUser.findFirst({
    where: { OR: [{ puid: externalId }, { id: externalId }] },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function mapInternalToExternal(internalId: string): Promise<string> {
  const user = await prisma.authUser.findUnique({
    where: { id: internalId },
    select: { id: true, puid: true },
  });

  return user?.puid || user?.id || internalId;
}

// -------------------------------------------------------
// Helper: Extract dynamic id from the URL
// -------------------------------------------------------
function getFriendshipId(req: NextRequest): string | null {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  return segments.pop() || null;
}

// -------------------------------------------------------
// PATCH /api/friends/[id]
// -------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const { id: friendshipId } = await params;
    if (!friendshipId) {
      return NextResponse.json(
        { success: false, error: "Friendship ID is required" },
        { status: 400 },
      );
    }

    // Convert external → internal
    const currentUserInternalId = await mapExternalToInternal(currentUser.id);
    if (!currentUserInternalId) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = UpdateFriendshipSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
    {
      success: false,
      error: validation.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; "),
    },
    { status: 400 },
  );
}


    const { action } = validation.data;

    // Retrieve friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { success: false, error: "Friendship not found" },
        { status: 404 },
      );
    }

    // User must be part of the friendship
    const isUserInvolved =
      friendship.userId1 === currentUserInternalId ||
      friendship.userId2 === currentUserInternalId;

    if (!isUserInvolved) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // ---------------------------- ACCEPT ----------------------------
    if (action === "accept") {
      const requester = friendship.requestedBy;
      const otherUser =
        requester === friendship.userId1
          ? friendship.userId2
          : friendship.userId1;

      if (otherUser !== currentUserInternalId) {
        return NextResponse.json(
          {
            success: false,
            error: "Only the recipient can accept this request",
          },
          { status: 403 },
        );
      }

      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted", updatedAt: new Date() },
      });
    }

    // ---------------------------- REJECT ----------------------------
    else if (action === "reject") {
      const requester = friendship.requestedBy;
      const otherUser =
        requester === friendship.userId1
          ? friendship.userId2
          : friendship.userId1;

      if (otherUser !== currentUserInternalId) {
        return NextResponse.json(
          {
            success: false,
            error: "Only the recipient can reject this request",
          },
          { status: 403 },
        );
      }

      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "rejected", updatedAt: new Date() },
      });
    }

    // ---------------------------- REMOVE ----------------------------
    else if (action === "remove") {
      if (friendship.status !== "accepted") {
        return NextResponse.json(
          { success: false, error: "Only accepted friendships can be removed" },
          { status: 400 },
        );
      }

      // Either user can remove
      await prisma.friendship.delete({ where: { id: friendshipId } });
    }

    return NextResponse.json({
      success: true,
      data: { message: `Friendship ${action}ed successfully` },
    });
  } catch (err) {
    console.error("PATCH friendship error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// -------------------------------------------------------
// DELETE /api/friends/[id]
// -------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const { id: friendshipId } = await params;
    if (!friendshipId) {
      return NextResponse.json(
        { success: false, error: "Friendship ID is required" },
        { status: 400 },
      );
    }

    const currentUserInternalId = await mapExternalToInternal(currentUser.id);
    if (!currentUserInternalId) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: { userId1: true, userId2: true },
    });

    if (!friendship) {
      return NextResponse.json(
        { success: false, error: "Friendship not found" },
        { status: 404 },
      );
    }

    const isUserInvolved =
      friendship.userId1 === currentUserInternalId ||
      friendship.userId2 === currentUserInternalId;

    if (!isUserInvolved) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });

    return NextResponse.json({
      success: true,
      data: { message: "Friendship removed" },
    });
  } catch (err) {
    console.error("DELETE friendship error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

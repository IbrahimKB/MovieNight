import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

// ---------------------------------------------
// PATCH /api/friends/[id]
// Accept or reject friend requests
// ---------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const friendshipId = params.id;
    const body = await req.json();

    const { action } = body; // "accept" | "reject"
    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json(
        { success: false, error: "Friend request not found" },
        { status: 404 }
      );
    }

    // Validate the user is involved
    const isInvolved =
      friendship.userId1 === currentUser.id ||
      friendship.userId2 === currentUser.id;
    if (!isInvolved) {
      return NextResponse.json(
        { success: false, error: "Not authorised" },
        { status: 403 }
      );
    }

    if (action === "accept") {
      if (friendship.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "Request is not pending" },
          { status: 400 }
        );
      }

      const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted" },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "reject") {
      await prisma.friendship.delete({ where: { id: friendshipId } });

      return NextResponse.json({
        success: true,
        data: { id: friendshipId, removed: true },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid handler state" },
      { status: 500 }
    );
  } catch (err) {
    console.error("Friend action error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

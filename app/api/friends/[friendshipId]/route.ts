import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { friendshipId } = await params;
    const { action } = await req.json();

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

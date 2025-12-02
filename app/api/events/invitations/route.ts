import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

// Helpers: map external <-> internal user IDs
async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  try {
    const user = await prisma.authUser.findFirst({
      where: {
        OR: [{ puid: externalId }, { id: externalId }],
      },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch (err) {
    console.error("Error mapping external → internal user ID:", err);
    return null;
  }
}

async function mapInternalUserIdToExternal(
  internalId: string,
): Promise<string> {
  try {
    const user = await prisma.authUser.findUnique({
      where: { id: internalId },
      select: { id: true, puid: true },
    });
    if (!user) return internalId;
    return user.puid || user.id;
  } catch (err) {
    console.error("Error mapping internal → external user ID:", err);
    return internalId;
  }
}

// GET /api/events/invitations - Get all pending invitations for current user
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const currentUserInternalId = await mapExternalUserIdToInternal(
      currentUser.id,
    );
    if (!currentUserInternalId) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    // Get all pending invitations for this user
    const invitations = await prisma.eventInvitation.findMany({
      where: {
        userId: currentUserInternalId,
        status: "pending",
      },
      include: {
        event: {
          include: {
            movie: {
              select: {
                title: true,
                poster: true,
              },
            },
            hostUser: {
              select: {
                id: true,
                puid: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = await Promise.all(
      invitations.map(async (inv) => {
        const hostExternalId = await mapInternalUserIdToExternal(
          inv.event.hostUser.id,
        );
        return {
          id: inv.id,
          eventId: inv.event.id,
          date: inv.event.date,
          movie: inv.event.movie,
          hostUser: {
            name: inv.event.hostUser.name,
            username: inv.event.hostUser.username,
          },
        };
      }),
    );

    return NextResponse.json({ success: true, data: mapped });
  } catch (err) {
    console.error("Get event invitations error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

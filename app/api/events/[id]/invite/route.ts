import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

// Zod schemas
const SendInvitationsSchema = z.object({
  userIds: z.array(z.string()), // external IDs
});

const UpdateInvitationSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

// GET /api/events/[id]/invite - Get invitations for this event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id: eventId } = await params;

    // Verify user has access to this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostUserId: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    // Only host can view all invitations
    if (event.hostUserId !== currentUserInternalId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Get all invitations for this event (if host) or current user's invitation (if invited)
    const allInvitations = await prisma.eventInvitation.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, puid: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If host, return all invitations
    if (event.hostUserId === currentUserInternalId) {
      const mapped = await Promise.all(
        allInvitations.map(async (inv) => {
          const externalUserId = await mapInternalUserIdToExternal(inv.user.id);
          return {
            id: inv.id,
            userId: externalUserId,
            user: {
              name: inv.user.name,
              username: inv.user.username,
            },
            status: inv.status,
            createdAt: inv.createdAt,
          };
        }),
      );

      return NextResponse.json({ success: true, data: mapped });
    }

    // If not host, return only current user's invitation if exists
    const userInvitation = allInvitations.find(
      (inv) => inv.userId === currentUserInternalId,
    );
    if (userInvitation) {
      return NextResponse.json({
        success: true,
        data: [
          {
            id: userInvitation.id,
            status: userInvitation.status,
          },
        ],
      });
    }

    // User is not invited
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (err) {
    console.error("Get event invitations error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/events/[id]/invite - Send invitations
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const body = await req.json();
    const validation = SendInvitationsSchema.safeParse(body);

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

    const { id: eventId } = await params;
    const { userIds: externalUserIds } = validation.data;

    // Verify event exists and user is host
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostUserId: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (event.hostUserId !== currentUserInternalId) {
      return NextResponse.json(
        { success: false, error: "Only host can send invitations" },
        { status: 403 },
      );
    }

    // Map external IDs to internal and create invitations
    const createdInvitations = [];
    const failedInvitations = [];

    for (const externalId of externalUserIds) {
      const internalId = await mapExternalUserIdToInternal(externalId);
      if (!internalId) {
        failedInvitations.push(externalId);
        continue;
      }

      // Check if invitation already exists
      const existing = await prisma.eventInvitation.findUnique({
        where: {
          eventId_userId: { eventId, userId: internalId },
        },
      });

      if (existing) {
        // Skip if already invited
        continue;
      }

      // Create invitation
      const invitation = await prisma.eventInvitation.create({
        data: {
          eventId,
          userId: internalId,
          invitedBy: currentUserInternalId,
        },
      });

      createdInvitations.push(invitation);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          created: createdInvitations.length,
          failed: failedInvitations.length,
          failedUserIds: failedInvitations,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Send invitations error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/events/[id]/invite - Update invitation status (accept/decline)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const body = await req.json();
    const validation = UpdateInvitationSchema.safeParse(body);

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

    const { id: eventId } = await params;
    const { status } = validation.data;

    // Find and verify invitation belongs to current user
    const invitation = await prisma.eventInvitation.findUnique({
      where: {
        eventId_userId: { eventId, userId: currentUserInternalId },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 },
      );
    }

    // Update invitation status
    const updated = await prisma.eventInvitation.update({
      where: { id: invitation.id },
      data: { status: status as any },
    });

    // If accepted, add user to event participants
    if (status === "accepted") {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { participants: true },
      });

      if (event && !event.participants.includes(currentUserInternalId)) {
        await prisma.event.update({
          where: { id: eventId },
          data: {
            participants: [...event.participants, currentUserInternalId],
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (err) {
    console.error("Update invitation error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

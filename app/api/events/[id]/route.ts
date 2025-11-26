import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const UpdateEventSchema = z.object({
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
  participants: z.array(z.string()).optional(), // external IDs (puid or id)
});

// ---------------------------------------------------------------------------
// Helpers: ID mapping between external (puid) and internal (id)
// ---------------------------------------------------------------------------

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

async function mapInternalUserIdToExternal(internalId: string): Promise<string> {
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

// Extract [id] manually (Next.js 15 fix)
function getEventIdFromRequest(req: NextRequest): string | null {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const id = segments[segments.length - 1];
  return id || null;
}

// ---------------------------------------------------------------------------
// GET /api/events/[id]
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 },
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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        movie: true,
        hostUser: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    const participantsInternal: string[] = event.participants ?? [];

    const isHost = event.hostUserId === currentUserInternalId;
    const isParticipant = participantsInternal.includes(currentUserInternalId);

    if (!isHost && !isParticipant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const externalParticipants = await Promise.all(
      participantsInternal.map((pid) => mapInternalUserIdToExternal(pid)),
    );

    const hostExternalId = event.hostUser
      ? event.hostUser.puid || event.hostUser.id
      : await mapInternalUserIdToExternal(event.hostUserId);

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        movieId: event.movieId,
        movieTitle: event.movie?.title ?? null,
        moviePoster: event.movie?.poster ?? null,
        movieYear: event.movie?.year ?? null,
        movieDescription: event.movie?.description ?? null,
        movieGenres: event.movie?.genres ?? [],
        hostUserId: hostExternalId,
        hostUsername: event.hostUser?.username ?? null,
        participants: externalParticipants,
        date: event.date,
        notes: event.notes,
        isHost,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    });
  } catch (err) {
    console.error("Get event error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/events/[id]
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 },
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

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostUserId: true, participants: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (existingEvent.hostUserId !== currentUserInternalId) {
      return NextResponse.json(
        { success: false, error: "Only the host can edit this event" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = UpdateEventSchema.safeParse(body);

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

    const data = validation.data;
    const updateData: Prisma.EventUpdateInput = {};

    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    if (data.participants !== undefined) {
      const internalParticipants: string[] = [currentUserInternalId];
      const invalidUserIds: string[] = [];

      for (const participantId of data.participants) {
        const internalId = await mapExternalUserIdToInternal(participantId);
        if (!internalId) invalidUserIds.push(participantId);
        else if (!internalParticipants.includes(internalId))
          internalParticipants.push(internalId);
      }

      if (invalidUserIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid user IDs: ${invalidUserIds.join(", ")}`,
          },
          { status: 400 },
        );
      }

      updateData.participants = internalParticipants;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    const participantsInternal: string[] = updatedEvent.participants ?? [];
    const externalParticipants = await Promise.all(
      participantsInternal.map((pid) => mapInternalUserIdToExternal(pid)),
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updatedEvent.id,
        movieId: updatedEvent.movieId,
        hostUserId: await mapInternalUserIdToExternal(updatedEvent.hostUserId),
        participants: externalParticipants,
        date: updatedEvent.date,
        notes: updatedEvent.notes,
        createdAt: updatedEvent.createdAt,
        updatedAt: updatedEvent.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update event error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/events/[id]
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 },
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

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostUserId: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (existingEvent.hostUserId !== currentUserInternalId) {
      return NextResponse.json(
        { success: false, error: "Only the host can delete this event" },
        { status: 403 },
      );
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Event deleted" },
    });
  } catch (err) {
    console.error("Delete event error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

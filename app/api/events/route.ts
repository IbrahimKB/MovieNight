import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getUserExternalId } from "@/lib/auth";
import { ApiResponse } from "@/types";

import { ensureMovieExists } from "@/lib/movies";

// ------------------------------------------------------
// Zod schema
// ------------------------------------------------------
const CreateEventSchema = z.object({
  movieId: z.union([z.string(), z.number()]), // Accept UUID or TMDB ID
  date: z.string().datetime(),
  notes: z.string().optional(),
  invitedFriendIds: z.array(z.string()).optional(), // external IDs (puid or id) to invite
});

// ------------------------------------------------------
// Helpers: map external <-> internal user IDs
// ------------------------------------------------------
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

// ------------------------------------------------------
// POST /api/events (Create)
// ------------------------------------------------------
export async function POST(
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

    const body = await req.json();
    const validation = CreateEventSchema.safeParse(body);

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

    const {
      movieId: inputMovieId,
      date,
      notes,
      invitedFriendIds,
    } = validation.data;

    // Map current user to internal ID
    const hostUserId = await mapExternalUserIdToInternal(currentUser.id);
    if (!hostUserId) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    // Ensure movie exists (lazy sync)
    const internalMovieId = await ensureMovieExists(inputMovieId);

    if (!internalMovieId) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 },
      );
    }

    // Create event with only host as participant initially
    const event = await prisma.event.create({
      data: {
        movieId: internalMovieId,
        hostUserId,
        participants: [hostUserId], // Only host initially
        date: new Date(date),
        notes: notes ?? null,
      },
    });

    // Create invitations for invited users
    const createdInvitations = [];
    const failedInvitations = [];

    if (invitedUsers && invitedUsers.length > 0) {
      for (const externalUserId of invitedUsers) {
        const internalUserId =
          await mapExternalUserIdToInternal(externalUserId);
        if (!internalUserId) {
          failedInvitations.push(externalUserId);
          continue;
        }

        // Create invitation
        const invitation = await prisma.eventInvitation.create({
          data: {
            eventId: event.id,
            userId: internalUserId,
            invitedBy: hostUserId,
          },
        });

        createdInvitations.push(invitation);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: event.id,
          movieId: event.movieId,
          hostUserId: getUserExternalId(currentUser),
          participants: [getUserExternalId(currentUser)],
          invitations: createdInvitations.length,
          date: event.date,
          notes: event.notes,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create event error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ------------------------------------------------------
// GET /api/events (List)
// ------------------------------------------------------
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

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { hostUserId: currentUserInternalId },
          { participants: { has: currentUserInternalId } },
        ],
      },
      include: {
        movie: true,
        hostUser: true,
      },
      orderBy: { date: "asc" },
    });

    const mapped = await Promise.allSettled(
      events.map(async (event) => {
        const participantsInternal: string[] = event.participants ?? [];
        const mappedResults = await Promise.allSettled(
          participantsInternal.map((pid) => mapInternalUserIdToExternal(pid)),
        );
        const externalParticipants = mappedResults.map((result) =>
          result.status === "fulfilled" ? result.value : "",
        );

        const hostExternalId =
          event.hostUser?.puid || event.hostUser?.id || event.hostUserId;

        return {
          id: event.id,
          movieId: event.movieId,
          movie: {
            title: event.movie?.title ?? null,
            poster: event.movie?.poster ?? null,
          },
          hostUser: {
            name: event.hostUser?.name ?? null,
            username: event.hostUser?.username ?? null,
          },
          participants: externalParticipants,
          date: event.date,
          notes: event.notes,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        };
      }),
    );

    const successfulMappings = mapped
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((m) => m !== null);

    return NextResponse.json({ success: true, data: successfulMappings });
  } catch (err) {
    console.error("Get events error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

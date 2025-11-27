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
  participants: z.array(z.string()).optional(), // external IDs (puid or id)
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
      participants,
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

    // Validate participants (external -> internal)
    const internalParticipants: string[] = [hostUserId];
    const invalidUserIds: string[] = [];

    if (participants) {
      for (const external of participants) {
        const internalId = await mapExternalUserIdToInternal(external);
        if (!internalId) {
          invalidUserIds.push(external);
        } else if (!internalParticipants.includes(internalId)) {
          internalParticipants.push(internalId);
        }
      }
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

    // Create event via Prisma
    const event = await prisma.event.create({
      data: {
        movieId: internalMovieId,
        hostUserId,
        participants: internalParticipants,
        date: new Date(date),
        notes: notes ?? null,
      },
    });

    // Map participants back to external IDs
    const externalParticipants = await Promise.all(
      internalParticipants.map((id) => mapInternalUserIdToExternal(id)),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: event.id,
          movieId: event.movieId,
          hostUserId: getUserExternalId(currentUser),
          participants: externalParticipants,
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

    const mapped = await Promise.all(
      events.map(async (event) => {
        const participantsInternal: string[] = event.participants ?? [];
        const externalParticipants = await Promise.all(
          participantsInternal.map((pid) => mapInternalUserIdToExternal(pid)),
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

    return NextResponse.json({ success: true, data: mapped });
  } catch (err) {
    console.error("Get events error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

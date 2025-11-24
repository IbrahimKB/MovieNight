import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getUserExternalId } from "@/lib/auth";
import { z } from "zod";
import { ApiResponse } from "@/types";

// ---------------------------------------------
// Validation
// ---------------------------------------------
const CreateSuggestionSchema = z.object({
  movieId: z.string().uuid(),
  toUserId: z.string(), // external ID (puid or internal UUID)
  message: z.string().optional(),
});

// ---------------------------------------------
// Helper: resolve external ID (puid or uuid)
// ---------------------------------------------
async function resolveUserId(externalId: string) {
  const user = await prisma.authUser.findFirst({
    where: {
      OR: [{ puid: externalId }, { id: externalId }],
    },
  });

  return user?.id ?? null;
}

// ---------------------------------------------
// POST /api/suggestions
// ---------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = CreateSuggestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { movieId, toUserId, message } = parsed.data;

    // Validate movie exists
    const movieExists = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movieExists) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 }
      );
    }

    // Map external → internal user ID
    const toInternal = await resolveUserId(toUserId);
    if (!toInternal) {
      return NextResponse.json(
        { success: false, error: `Invalid user ID: ${toUserId}` },
        { status: 400 }
      );
    }

    // Create suggestion
    const suggestion = await prisma.suggestion.create({
      data: {
        movieId,
        fromUserId: sessionUser.id,
        toUserId: toInternal,
        message: message ?? null,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: suggestion.id,
          movieId,
          fromUserId: getUserExternalId(sessionUser),
          toUserId,
          message: suggestion.message,
          status: suggestion.status,
          createdAt: suggestion.createdAt,
          updatedAt: suggestion.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create suggestion error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// GET /api/suggestions
// ---------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const suggestions = await prisma.suggestion.findMany({
      where: {
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      },
      include: {
        movie: true,
        fromUser: true,
        toUser: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = suggestions.map((s) => ({
      id: s.id,
      movieId: s.movieId,
      movieTitle: s.movie.title,
      moviePoster: s.movie.poster,
      fromUserId: s.fromUser.puid || s.fromUser.id,
      fromUserUsername: s.fromUser.username,
      toUserId: s.toUser ? s.toUser.puid || s.toUser.id : null,
      toUserUsername: s.toUser ? s.toUser.username : null,
      message: s.message,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error("Get suggestions error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

const AddTMDBMovieSchema = z.object({
  tmdbId: z.number().optional(),
  title: z.string().min(1),
  year: z.number().int(),
  genres: z.array(z.string()).optional(),
  poster: z.string().optional(),
  description: z.string().optional(),
  imdbRating: z.number().optional(),
  rating: z.number().min(1).max(10).optional(),
});

async function mapExternalUserIdToInternal(
  externalId: string,
): Promise<string | null> {
  const user = await prisma.authUser.findFirst({
    where: { OR: [{ puid: externalId }, { id: externalId }] },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = AddTMDBMovieSchema.safeParse(body);

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

    const userIdInternal = await mapExternalUserIdToInternal(currentUser.id);
    if (!userIdInternal) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    const { tmdbId, title, year, genres, poster, description, imdbRating, rating } = validation.data;

    // Check if movie already exists (by tmdbId if provided, or by title+year)
    let movie = null;

    if (tmdbId) {
      movie = await prisma.movie.findUnique({
        where: { tmdbId },
        select: { id: true },
      });
    }

    // If not found by tmdbId, search by title and year
    if (!movie) {
      movie = await prisma.movie.findFirst({
        where: {
          title,
          year,
        },
        select: { id: true },
      });
    }

    // Create movie if it doesn't exist
    if (!movie) {
      movie = await prisma.movie.create({
        data: {
          tmdbId: tmdbId ?? null,
          title,
          year,
          genres: genres ?? [],
          poster: poster ?? null,
          description: description ?? "",
          imdbRating: imdbRating ?? null,
          rtRating: null,
          releaseDate: null,
        },
        select: { id: true },
      });
    }

    // Check if already in watch desire
    const existing = await prisma.watchDesire.findFirst({
      where: {
        userId: userIdInternal,
        movieId: movie.id,
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Movie already in your watch list",
        },
        { status: 409 },
      );
    }

    // Create watch desire
    const desire = await prisma.watchDesire.create({
      data: {
        userId: userIdInternal,
        movieId: movie.id,
        rating: rating ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: desire.id,
          movieId: movie.id,
          rating: desire.rating,
          createdAt: desire.createdAt,
          updatedAt: desire.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Add TMDB movie to watch desire error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

// ---------------------------------------------
// Zod schema for updates
// ---------------------------------------------
const UpdateMovieSchema = z.object({
  title: z.string().optional(),
  year: z.number().optional(),
  genres: z.array(z.string()).optional(),
  platform: z.string().optional(),
  poster: z.string().optional(),
  description: z.string().optional(),
  imdbRating: z.number().optional(),
  rtRating: z.number().optional(),
  releaseDate: z.string().datetime().optional(),
});

// ---------------------------------------------
// Helper to extract ID from URL (Next.js 15 fix)
// ---------------------------------------------
function getMovieId(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}

// ---------------------------------------------
// GET /api/movies/[id]
// ---------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const id = getMovieId(req);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Movie ID is required" },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: movie,
    });
  } catch (err) {
    console.error("GET movie error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// PATCH /api/movies/[id]
// (Admin-only)
// ---------------------------------------------
export async function PATCH(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Auth required + must be admin
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const id = getMovieId(req);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Movie ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = UpdateMovieSchema.safeParse(body);

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

    const data = parsed.data;

    const updated = await prisma.movie.update({
      where: { id },
      data: {
        ...data,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("PATCH movie error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

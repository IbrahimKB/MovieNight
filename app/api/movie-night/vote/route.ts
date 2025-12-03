import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VoteSchema = z.object({
  movieId: z.string().uuid(),
  voteType: z.enum(["yes", "maybe", "no"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = VoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const { movieId, voteType } = parsed.data;

    // Verify movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 },
      );
    }

    // Upsert vote (create or update)
    const vote = await prisma.movieNightVote.upsert({
      where: {
        movieId_userId: {
          movieId,
          userId: user.id,
        },
      },
      update: {
        voteType,
      },
      create: {
        movieId,
        userId: user.id,
        voteType,
      },
    });

    // Get vote counts for this movie
    const voteCounts = await prisma.movieNightVote.groupBy({
      by: ["voteType"],
      where: { movieId },
      _count: true,
    });

    const counts = {
      yes: 0,
      maybe: 0,
      no: 0,
    };

    voteCounts.forEach((vc) => {
      counts[vc.voteType as keyof typeof counts] = vc._count;
    });

    return NextResponse.json({
      success: true,
      data: {
        vote,
        counts,
      },
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movieId");

    if (!movieId) {
      return NextResponse.json(
        { success: false, error: "movieId is required" },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();

    // Get vote counts
    const voteCounts = await prisma.movieNightVote.groupBy({
      by: ["voteType"],
      where: { movieId },
      _count: true,
    });

    const counts = {
      yes: 0,
      maybe: 0,
      no: 0,
    };

    voteCounts.forEach((vc) => {
      counts[vc.voteType as keyof typeof counts] = vc._count;
    });

    // Get current user's vote
    let userVote = null;
    if (user) {
      userVote = await prisma.movieNightVote.findUnique({
        where: {
          movieId_userId: {
            movieId,
            userId: user.id,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        counts,
        userVote: userVote?.voteType || null,
      },
    });
  } catch (error) {
    console.error("Get votes error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

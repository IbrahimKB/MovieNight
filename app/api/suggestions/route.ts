import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { ensureMovieExists } from "@/lib/movies";

const CreateSuggestionSchema = z.object({
  movieId: z.union([z.string(), z.number()]), // Accept UUID or TMDB ID
  friendIds: z.array(z.string()).optional(),
  toUserId: z.string().optional(), // Alternative: single user ID
  comment: z.string().optional(),
  message: z.string().optional(), // Alternative field name for comment
  desireRating: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type") || "received"; // "received" or "sent"

    let suggestions;

    if (type === "sent") {
      // Get sent suggestions (from me)
      suggestions = await prisma.suggestion.findMany({
        where: {
          fromUserId: user.id,
        },
        include: {
          movie: true,
          fromUser: true,
          toUser: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    } else {
      // Get incoming suggestions (to me) - default
      suggestions = await prisma.suggestion.findMany({
        where: {
          toUserId: user.id,
        },
        include: {
          movie: true,
          fromUser: true,
          toUser: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    }

    // Map to frontend format
    const data = suggestions.map((s) => ({
      id: s.id,
      movieId: s.movieId,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      status: s.status,
      message: s.message,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      movie: {
        id: s.movie.id,
        title: s.movie.title,
        year: s.movie.year,
        genres: s.movie.genres,
        poster: s.movie.poster,
        description: s.movie.description,
        rating: s.movie.imdbRating,
      },
      fromUser: {
        id: s.fromUser.id,
        name: s.fromUser.name,
        username: s.fromUser.username,
        avatar: s.fromUser.avatar,
      },
      toUser: s.toUser
        ? {
            id: s.toUser.id,
            name: s.toUser.name,
            username: s.toUser.username,
            avatar: s.toUser.avatar,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("Get suggestions error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = CreateSuggestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 },
      );
    }

    const {
      movieId: inputMovieId,
      friendIds,
      toUserId,
      comment,
      message,
      desireRating,
    } = parsed.data;

    // Combine friendIds and toUserId into a single array
    const targetFriendIds = friendIds || (toUserId ? [toUserId] : []);
    
    if (targetFriendIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No friends specified" },
        { status: 400 },
      );
    }

    // Ensure movie exists
    const internalMovieId = await ensureMovieExists(inputMovieId);
    if (!internalMovieId) {
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 },
      );
    }

    // Create suggestions for each friend
    // Also potentially create a WatchDesire for the sender?
    if (desireRating) {
      await prisma.watchDesire.upsert({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: internalMovieId,
          },
        },
        update: { rating: desireRating },
        create: {
          userId: user.id,
          movieId: internalMovieId,
          rating: desireRating,
        },
      });
    }

    // Map friendIds (external) to internal UUIDs
    const internalFriendIds: string[] = [];
    for (const externalId of targetFriendIds) {
      const friend = await prisma.authUser.findFirst({
        where: { OR: [{ puid: externalId }, { id: externalId }] },
        select: { id: true },
      });
      if (friend && friend.id !== user.id) {
        internalFriendIds.push(friend.id);
      }
    }
    
    // Use message or comment for the suggestion message
    const suggestionMessage = message || comment;

    const createdResults = await Promise.allSettled(
      internalFriendIds.map((id) =>
        prisma.suggestion.create({
          data: {
            movieId: internalMovieId,
            fromUserId: user.id,
            toUserId: id,
            message: suggestionMessage,
            status: "pending",
          },
        }),
      ),
    );

    const successfulSuggestions = createdResults.filter(
      (result) => result.status === "fulfilled",
    );

    return NextResponse.json({
      success: true,
      count: successfulSuggestions.length,
    });
  } catch (err) {
    console.error("Create suggestion error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

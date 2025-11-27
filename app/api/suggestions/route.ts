import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { ensureMovieExists } from "@/lib/movies";

const CreateSuggestionSchema = z.object({
  movieId: z.union([z.string(), z.number()]), // Accept UUID or TMDB ID
  friendIds: z.array(z.string()),
  comment: z.string().optional(),
  desireRating: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get incoming suggestions (to me)
    const suggestions = await prisma.suggestion.findMany({
      where: {
        toUserId: user.id,
        status: 'pending' // Only pending suggestions?
      },
      include: {
        movie: true,
        fromUser: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Map to frontend format
    const data = suggestions.map(s => ({
      id: s.id,
      movie: {
        id: s.movie.id,
        title: s.movie.title,
        year: s.movie.year,
        genres: s.movie.genres,
        poster: s.movie.poster,
        description: s.movie.description,
        rating: s.movie.imdbRating,
      },
      suggestedBy: {
        id: s.fromUser.id,
        name: s.fromUser.name,
        username: s.fromUser.username,
        avatar: s.fromUser.avatar
      },
      comment: s.message,
      suggestedAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      suggestions: data,
    });

  } catch (err) {
    console.error("Get suggestions error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = CreateSuggestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 }
      );
    }

    const { movieId: inputMovieId, friendIds, comment, desireRating } = parsed.data;

    // Ensure movie exists
    const internalMovieId = await ensureMovieExists(inputMovieId);
    if (!internalMovieId) {
        return NextResponse.json(
            { success: false, error: "Movie not found" },
            { status: 404 }
        );
    }
    
    // Create suggestions for each friend
    // Also potentially create a WatchDesire for the sender?
    if (desireRating) {
       await prisma.watchDesire.upsert({
         where: {
           userId_movieId: {
             userId: user.id,
             movieId: internalMovieId
           }
         },
         update: { rating: desireRating },
         create: {
            userId: user.id,
            movieId: internalMovieId,
            rating: desireRating
         }
       });
    }

    // Map friendIds (external) to internal UUIDs
    const internalFriendIds: string[] = [];
    for (const externalId of friendIds) {
      const friend = await prisma.authUser.findFirst({
        where: { OR: [{ puid: externalId }, { id: externalId }] },
        select: { id: true }
      });
      if (friend) {
        internalFriendIds.push(friend.id);
      }
    }

    const createdSuggestions = await Promise.all(
      internalFriendIds.map(id => 
        prisma.suggestion.create({
          data: {
            movieId: internalMovieId,
            fromUserId: user.id,
            toUserId: id,
            message: comment,
            status: 'pending'
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: createdSuggestions.length
    });

  } catch (err) {
    console.error("Create suggestion error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

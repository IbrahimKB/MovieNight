import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const UpdateSuggestionSchema = z.object({
  action: z.enum(['accept', 'reject']),
  rating: z.number().optional(), // If accepting, user might give a rating
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = UpdateSuggestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 }
      );
    }

    const { action, rating } = parsed.data;
    const suggestionId = params.id;

    // Verify suggestion exists and belongs to user (toUserId)
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json({ success: false, error: "Suggestion not found" }, { status: 404 });
    }

    if (suggestion.toUserId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    if (action === 'accept') {
      // Update suggestion status
      await prisma.suggestion.update({
        where: { id: suggestionId },
        data: { status: 'accepted' }
      });

      // Create WatchDesire
      // Use upsert just in case
      await prisma.watchDesire.upsert({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: suggestion.movieId
          }
        },
        update: {
          suggestionId: suggestionId,
          rating: rating || 5 // Default rating if not provided
        },
        create: {
          userId: user.id,
          movieId: suggestion.movieId,
          suggestionId: suggestionId,
          rating: rating || 5
        }
      });

    } else if (action === 'reject') {
      await prisma.suggestion.update({
        where: { id: suggestionId },
        data: { status: 'rejected' }
      });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Update suggestion error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

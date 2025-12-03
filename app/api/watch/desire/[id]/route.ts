import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/types";

const UpdateDesireRatingSchema = z.object({
  rating: z.number().min(1).max(10),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id: desireId } = await params;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const userIdInternal = await mapExternalUserIdToInternal(currentUser.id);
    if (!userIdInternal) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = UpdateDesireRatingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 400 }
      );
    }

    const { rating } = validation.data;
    const desireId = params.id;

    // Verify the desire belongs to the current user
    const desire = await prisma.watchDesire.findFirst({
      where: {
        id: desireId,
        userId: userIdInternal,
      },
    });

    if (!desire) {
      return NextResponse.json(
        { success: false, error: "Watch desire not found" },
        { status: 404 }
      );
    }

    // Update the rating
    const updated = await prisma.watchDesire.update({
      where: { id: desireId },
      data: { rating },
      include: { movie: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updated.id,
          movieId: updated.movieId,
          rating: updated.rating,
          updatedAt: updated.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Update watch desire error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

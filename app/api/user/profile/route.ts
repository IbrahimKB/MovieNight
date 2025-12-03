import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api-helpers";

const ProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized("You must be logged in to update your profile");
    }

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid profile data");
    }

    const updatedUser = await prisma.authUser.update({
      where: { id: user.id },
      data: parsed.data,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    return ok(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    return serverError("Failed to update profile", (err as any).message);
  }
}

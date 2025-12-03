import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api-helpers";

const SettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  friendRequests: z.boolean().optional(),
  suggestions: z.boolean().optional(),
  movieReleases: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized("You must be logged in to view settings");
    }

    const prefs = await prisma.userNotificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // Return defaults if no record exists
    return ok(
      prefs || {
        emailNotifications: true,
        pushNotifications: true,
        friendRequests: true,
        suggestions: true,
        movieReleases: true,
      },
    );
  } catch (err) {
    console.error("Get settings error:", err);
    return serverError("Failed to retrieve settings", (err as any).message);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized("You must be logged in to update settings");
    }

    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid settings data");
    }

    const prefs = await prisma.userNotificationPreferences.upsert({
      where: { userId: user.id },
      update: parsed.data,
      create: {
        userId: user.id,
        ...parsed.data,
      },
    });

    return ok(prefs);
  } catch (err) {
    console.error("Update settings error:", err);
    return serverError("Failed to update settings", (err as any).message);
  }
}

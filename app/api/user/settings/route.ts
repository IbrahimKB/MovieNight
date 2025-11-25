import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await prisma.userNotificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // Return defaults if no record exists
    return NextResponse.json({
      success: true,
      data: prefs || {
        emailNotifications: true,
        pushNotifications: true,
        friendRequests: true,
        suggestions: true,
        movieReleases: true,
      },
    });
  } catch (err) {
    console.error("Get settings error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const prefs = await prisma.userNotificationPreferences.upsert({
      where: { userId: user.id },
      update: parsed.data,
      create: {
        userId: user.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ success: true, data: prefs });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

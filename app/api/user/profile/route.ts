import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
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

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

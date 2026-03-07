import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

const UnsubscribeSchema = z.object({
  endpoint: z.string().url().optional(),
});

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
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription payload" },
        { status: 400 },
      );
    }

    const { endpoint, keys } = parsed.data.subscription;

    await prisma.userPushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({
      success: true,
      data: { subscribed: true },
    });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = UnsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid unsubscribe payload" },
        { status: 400 },
      );
    }

    if (parsed.data.endpoint) {
      await prisma.userPushSubscription.deleteMany({
        where: {
          userId: user.id,
          endpoint: parsed.data.endpoint,
        },
      });
    } else {
      await prisma.userPushSubscription.deleteMany({
        where: { userId: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      data: { subscribed: false },
    });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}


import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push-notifications";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const result = await sendPushToUser(
      user.id,
      {
        title: "MovieNight",
        body: "Push notifications are configured and working.",
        url: "/settings",
        type: "general",
        tag: "movienight-test",
      },
      undefined,
    );

    if (result.skipped) {
      return NextResponse.json(
        { success: false, error: result.skipped },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { sent: result.sent },
    });
  } catch (err) {
    console.error("Push test error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}


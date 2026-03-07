import { NextResponse } from "next/server";
import { getPublicVapidKey } from "@/lib/push-notifications";

export async function GET() {
  const key = getPublicVapidKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Push notifications are not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { publicKey: key },
  });
}


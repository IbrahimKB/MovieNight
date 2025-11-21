import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { ApiResponse } from "@/types";

const SESSION_COOKIE_NAME = "movienight_session";

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      // Delete session from database
      await query(`DELETE FROM auth."Session" WHERE "sessionToken" = $1`, [
        sessionToken,
      ]);
    }

    // Clear the cookie
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

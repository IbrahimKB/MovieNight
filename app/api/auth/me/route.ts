import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserExternalId } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: getUserExternalId(user),
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        joinedAt: user.joinedAt,
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { ApiResponse } from "@/types";

const LoginSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
});

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { emailOrUsername, password } = validation.data;

    // Find user by email or username
    const result = await query(
      `SELECT id, username, email, "passwordHash", name, role, "joinedAt", puid
       FROM auth."User"
       WHERE email = $1 OR username = $2
       LIMIT 1`,
      [emailOrUsername, emailOrUsername],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email/username or password",
        },
        { status: 401 },
      );
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email/username or password",
        },
        { status: 401 },
      );
    }

    // Create session
    await createSession(user.id);

    // Return user data (using puid as external id)
    return NextResponse.json({
      success: true,
      data: {
        id: user.puid || user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        joinedAt: user.joinedAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

// -----------------------------
// Validation schema
// -----------------------------
const LoginSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
});

// -----------------------------
// POST /api/auth/login
// -----------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { emailOrUsername, password } = parsed.data;

    // Find user by email or username (case-insensitive)
    const user = await prisma.authUser.findFirst({
      where: {
        OR: [
          { email: { equals: emailOrUsername.toLowerCase(), mode: "insensitive" } },
          { username: { equals: emailOrUsername.toLowerCase(), mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Password check
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Create session
    await createSession(user.id);

    // Prepare safe return user
    const externalId = user.puid || user.id;

    return NextResponse.json({
      success: true,
      data: {
        id: externalId,
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
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

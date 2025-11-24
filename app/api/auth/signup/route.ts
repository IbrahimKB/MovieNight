import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

// Validation schema
const SignupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

// POST /api/auth/signup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = SignupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { username, email, name, password } = validation.data;

    const loweredEmail = email.toLowerCase();
    const loweredUsername = username.toLowerCase();

    // Check duplicates via Prisma
    const existing = await prisma.authUser.findFirst({
      where: {
        OR: [
          { email: loweredEmail },
          { username: loweredUsername },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            existing.email.toLowerCase() === loweredEmail
              ? "An account with this email already exists"
              : "This username is already taken",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Public ID
    const puid = crypto.randomUUID();

    // Create user
    const user = await prisma.authUser.create({
      data: {
        username: loweredUsername,
        email: loweredEmail,
        name,
        passwordHash: hashedPassword,
        puid,
      },
    });

    // Create session
    const session = await createSession(user.id);

    // Return user (using PUID externally)
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.puid || user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            joinedAt: user.joinedAt,
          },
          token: session.sessionToken,
        },
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

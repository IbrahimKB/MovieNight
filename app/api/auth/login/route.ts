import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    const clientIp = getClientIp(req.headers);
    const rateKey = `login:${clientIp}`;
    const rate = checkRateLimit({
      key: rateKey,
      limit: 12,
      windowMs: 5 * 60 * 1000,
    });
    if (!rate.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rate.resetAt - Date.now()) / 1000),
      );
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
          },
        },
      );
    }

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
        { status: 400 },
      );
    }

    const { emailOrUsername, password } = parsed.data;

    // Find user by email or username (case-insensitive)
    const user = await prisma.authUser.findFirst({
      where: {
        deletedAt: null,
        OR: [
          {
            email: {
              equals: emailOrUsername.toLowerCase(),
              mode: "insensitive",
            },
          },
          {
            username: {
              equals: emailOrUsername.toLowerCase(),
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email/username or password" },
        { status: 401 },
      );
    }

    if (user.disabledAt) {
      return NextResponse.json(
        { success: false, error: "Account is disabled. Contact support." },
        { status: 403 },
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Account temporarily locked due to failed login attempts. Please try again later.",
        },
        { status: 423 },
      );
    }

    // Password check
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= 5;

      await prisma.authUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null,
        },
      });

      return NextResponse.json(
        { success: false, error: "Invalid email/username or password" },
        { status: 401 },
      );
    }

    await prisma.authUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Create session
    const session = await createSession(user.id);

    // Prepare safe return user
    const externalId = user.puid || user.id;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: externalId,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          joinedAt: user.joinedAt,
        },
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);

    // Database connection error
    if (
      err.message?.includes("ECONNREFUSED") ||
      err.message?.includes("connect ECONNREFUSED") ||
      err.message?.includes("getaddrinfo") ||
      err.code === "ECONNREFUSED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Database connection failed. Please ensure PostgreSQL is running and accessible.",
          details: {
            issue: "Cannot connect to database",
            hint: "Check DATABASE_URL environment variable and PostgreSQL service status",
          },
        },
        { status: 503 },
      );
    }

    // Timeout error
    if (err.message?.includes("timeout") || err.code === "ETIMEDOUT") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timeout. Database may be unresponsive.",
          details: {
            issue: "Database query timed out",
            hint: "Check PostgreSQL server status and connection",
          },
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 },
    );
  }
}

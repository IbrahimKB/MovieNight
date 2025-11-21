import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { query } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { ApiResponse } from '@/types';

const SignupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const validation = SignupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { username, email, password, name } = validation.data;

    // Check if username or email already exists
    const existing = await query(
      `SELECT id FROM auth."User" WHERE username = $1 OR email = $2 LIMIT 1`,
      [username, email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username or email already exists',
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);
    const userId = randomUUID();
    const puid = randomUUID();
    const now = new Date();

    // Create user
    await query(
      `INSERT INTO auth."User" (id, username, email, "passwordHash", name, role, "joinedAt", "createdAt", "updatedAt", puid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, username, email, passwordHash, name || null, 'user', now, now, now, puid]
    );

    // Create session
    await createSession(userId);

    // Return user data (using puid as external id)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: puid,
          username,
          email,
          name: name || null,
          role: 'user',
          joinedAt: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

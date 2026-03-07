import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireSuperAdmin,
  isErrorResponse,
} from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

const StatusSchema = z.object({
  disabled: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const clientIp = getClientIp(req.headers);
    const rate = checkRateLimit({
      key: `admin-user-status:${clientIp}`,
      limit: 40,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    if (id === user.id && parsed.data.disabled) {
      return NextResponse.json(
        { success: false, error: "Cannot disable yourself" },
        { status: 400 },
      );
    }

    const target = await prisma.authUser.findUnique({
      where: { id },
      select: { id: true, role: true, deletedAt: true },
    });

    if (!target || target.deletedAt) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (
      (target.role === "admin" || target.role === "super_admin") &&
      target.id !== user.id
    ) {
      const superAdminResult = await requireSuperAdmin();
      if (isErrorResponse(superAdminResult)) {
        return superAdminResult;
      }
    }

    const disabledAt = parsed.data.disabled ? new Date() : null;
    const updated = await prisma.authUser.update({
      where: { id },
      data: {
        disabledAt,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        joinedAt: true,
        disabledAt: true,
      },
    });

    if (parsed.data.disabled) {
      await prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    await logAdminAction({
      actorId: user.id,
      targetUserId: id,
      action: parsed.data.disabled ? "user.disable" : "user.enable",
      metadata: { previousRole: target.role },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}


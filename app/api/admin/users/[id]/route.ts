import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireSuperAdmin,
  isErrorResponse,
} from "@/lib/auth-helpers";
import { compare } from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

function buildDeletedIdentity(id: string) {
  const suffix = id.replace(/-/g, "").slice(0, 12);
  return {
    username: `deleted_${suffix}`,
    email: `deleted+${suffix}@movie-night.local`,
  };
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clientIp = getClientIp(req.headers);
    const rate = checkRateLimit({
      key: `admin-delete-user:${clientIp}`,
      limit: 20,
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

    const { id: userId } = await params;
    const body = await req.json().catch(() => ({}));
    const adminPassword =
      typeof body?.adminPassword === "string" ? body.adminPassword : "";

    if (!adminPassword) {
      return NextResponse.json(
        { success: false, error: "Admin password is required" },
        { status: 400 },
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete yourself" },
        { status: 400 },
      );
    }

    const adminRecord = await prisma.authUser.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!adminRecord) {
      return NextResponse.json(
        { success: false, error: "Admin account not found" },
        { status: 404 },
      );
    }

    const isPasswordValid = await compare(adminPassword, adminRecord.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid admin password" },
        { status: 401 },
      );
    }

    const target = await prisma.authUser.findUnique({
      where: { id: userId },
      select: { id: true, role: true, deletedAt: true },
    });

    if (!target || target.deletedAt) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (target.role === "super_admin") {
      const superAdminResult = await requireSuperAdmin();
      if (isErrorResponse(superAdminResult)) {
        return superAdminResult;
      }
    }

    if (target.role === "admin" || target.role === "super_admin") {
      const [adminCount, superAdminCount] = await Promise.all([
        prisma.authUser.count({
          where: { role: "admin", deletedAt: null },
        }),
        prisma.authUser.count({
          where: { role: "super_admin", deletedAt: null },
        }),
      ]);

      if (target.role === "admin" && adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin account" },
          { status: 400 },
        );
      }

      if (target.role === "super_admin" && superAdminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last super admin account" },
          { status: 400 },
        );
      }
    }

    const deletedIdentity = buildDeletedIdentity(target.id);
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({
        where: { userId: target.id },
      });

      await tx.authUser.update({
        where: { id: target.id },
        data: {
          username: deletedIdentity.username,
          email: deletedIdentity.email,
          name: null,
          avatar: null,
          disabledAt: new Date(),
          deletedAt: new Date(),
          role: "user",
          puid: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    });

    await logAdminAction({
      actorId: user.id,
      targetUserId: target.id,
      action: "user.soft_delete",
      metadata: {
        previousRole: target.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      data: { softDeleted: true },
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireSuperAdmin,
  isErrorResponse,
} from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const clientIp = getClientIp(req.headers);
    const rate = checkRateLimit({
      key: `admin-revoke-sessions:${clientIp}`,
      limit: 60,
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

    const { id } = await context.params;

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

    if (target.role === "super_admin" && target.id !== user.id) {
      const superAdminResult = await requireSuperAdmin();
      if (isErrorResponse(superAdminResult)) {
        return superAdminResult;
      }
    }

    const result = await prisma.session.deleteMany({
      where: { userId: id },
    });

    await logAdminAction({
      actorId: user.id,
      targetUserId: id,
      action: "user.revoke_sessions",
      metadata: { revokedSessions: result.count },
    });

    return NextResponse.json({
      success: true,
      data: { revokedSessions: result.count },
    });
  } catch (err) {
    console.error("Error revoking user sessions:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

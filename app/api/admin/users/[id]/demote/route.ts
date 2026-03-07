import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const clientIp = getClientIp(req.headers);
    const rate = checkRateLimit({
      key: `admin-demote:${clientIp}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    const authResult = await requireSuperAdmin();
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { id } = await context.params;

    if (id === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot demote yourself" },
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

    if (target.role === "user") {
      return NextResponse.json(
        { success: false, error: "User is already base user" },
        { status: 400 },
      );
    }

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
        { success: false, error: "Cannot demote the last admin account" },
        { status: 400 },
      );
    }

    if (target.role === "super_admin" && superAdminCount <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot demote the last super admin account" },
        { status: 400 },
      );
    }

    const updated = await prisma.authUser.update({
      where: { id },
      data: { role: "user" },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        joinedAt: true,
      },
    });

    await logAdminAction({
      actorId: user.id,
      targetUserId: id,
      action: "user.demote_to_user",
      metadata: { previousRole: target.role },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Error demoting user:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

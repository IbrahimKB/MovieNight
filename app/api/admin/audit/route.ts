import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    const limitParam = Number(req.nextUrl.searchParams.get("limit") || "25");
    const limit = Math.max(1, Math.min(100, Number.isFinite(limitParam) ? limitParam : 25));

    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        metadata: log.metadata,
        createdAt: log.createdAt,
        actor: log.actor,
        targetUser: log.targetUser,
      })),
    });
  } catch (err) {
    console.error("Error fetching admin audit logs:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}


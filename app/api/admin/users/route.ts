import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const includeDeleted = req.nextUrl.searchParams.get("includeDeleted") === "1";

    const users = await prisma.authUser.findMany({
      where: includeDeleted
        ? undefined
        : {
            deletedAt: null,
          },
      select: {
        id: true,
        puid: true,
        username: true,
        email: true,
        name: true,
        disabledAt: true,
        deletedAt: true,
        role: true,
        joinedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

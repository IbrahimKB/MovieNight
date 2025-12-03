import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { hash } from "bcryptjs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 chars" },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const passwordHash = await hash(newPassword, 12);

    await prisma.authUser.update({
      where: { id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: "Password reset" });
  } catch (err) {
    console.error("Error resetting password:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

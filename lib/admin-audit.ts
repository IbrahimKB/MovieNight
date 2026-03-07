import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function logAdminAction(input: {
  actorId: string;
  action: string;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetUserId: input.targetUserId || null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    // Audit should never break the main request flow.
    console.error("Failed to write admin audit log:", err);
  }
}

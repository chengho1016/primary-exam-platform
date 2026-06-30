import "server-only";
import { db } from "@/lib/db/prisma";

export async function hasPaperAccess(userId: string, paperId: string) {
  const paper = await db.paper.findFirst({
    where: { id: paperId, status: "PUBLISHED" },
    select: { access: true },
  });
  if (!paper) return false;
  if (paper.access === "FREE") return true;

  if (paper.access === "MEMBERSHIP") {
    const activeSubscription = await db.subscription.findFirst({
      where: { userId, status: { in: ["TRIAL", "ACTIVE"] }, periodEndsAt: { gt: new Date() } },
      select: { id: true },
    });
    return Boolean(activeSubscription);
  }

  const entitlement = await db.paperEntitlement.findUnique({
    where: { userId_paperId: { userId, paperId } },
    select: { expiresAt: true },
  });
  return Boolean(entitlement && (!entitlement.expiresAt || entitlement.expiresAt > new Date()));
}

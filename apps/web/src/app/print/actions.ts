"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { hasPaperAccess } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export async function createPrintJobAction(formData: FormData) {
  const paperId = formData.get("paperId");
  if (typeof paperId !== "string" || !paperId) throw new Error("無效的試卷");

  const user = await requireUser();
  if (!(await hasPaperAccess(user.id, paperId))) redirect("/membership");

  const paper = await db.paper.findFirst({
    where: { id: paperId, status: "PUBLISHED", printablePdfPath: { not: null } },
    select: { id: true },
  });
  if (!paper) throw new Error("此試卷暫時未能列印");

  const authorization = `PRINT-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong" }).format(now);
  await db.printJob.create({
    data: {
      userId: user.id,
      paperId,
      authorization,
      watermarkText: `${user.email} · ${date} · ${authorization}`,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
    },
  });

  redirect(`/print/${paperId}?job=${encodeURIComponent(authorization)}`);
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { backfillQuestionVersions } from "@/lib/questions/version-backfill";

export async function POST() {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "請先登入管理員帳戶" }, { status: 401 });
  }

  const stats = await backfillQuestionVersions(db);
  await db.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: "question_versions.backfilled",
      entityType: "QuestionVersion",
      entityId: "all",
      metadata: stats,
    },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin/database");

  return NextResponse.json({ success: true, stats });
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { backfillCurriculumTaxonomy } from "@/lib/curriculum/backfill";
import { db } from "@/lib/db/prisma";

export async function POST() {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "請先登入管理員帳戶" }, { status: 401 });
  }

  try {
    const stats = await backfillCurriculumTaxonomy();
    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "curriculum.backfilled",
        entityType: "Curriculum",
        entityId: "hk-primary",
        metadata: stats,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/curriculum");
    revalidatePath("/admin/database");

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Failed to backfill curriculum taxonomy.", error);
    return NextResponse.json({ error: "未能執行課程正規化 backfill" }, { status: 500 });
  }
}

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

const ADMIN_EMAIL = "admin@local.exam";
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const newPaperSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/),
  title: z.string().trim().min(3).max(120),
  grade: z.coerce.number().int().min(1).max(6),
  subject: z.enum(["中文", "英文", "數學", "人文", "科學"]),
  academicYear: z.string().trim().max(20).optional(),
  access: z.enum(["FREE", "MEMBERSHIP", "PURCHASE"]),
});

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "請先登入管理員帳戶" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = newPaperSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "資料不完整" }, { status: 400 });
  }

  const file = formData.get("paperFile");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "請選擇試卷檔案" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "試卷檔案不可超過4MB；大檔案需要改用 Blob/S3 direct upload" }, { status: 400 });
  }

  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "只支援PDF、DOCX、PNG或JPG檔案" }, { status: 400 });
  }

  const admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  if (!admin) {
    return NextResponse.json({ error: "找不到管理員帳戶" }, { status: 500 });
  }

  const paperId = randomUUID();
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const base64Data = `data:${file.type};base64,${fileBuffer.toString("base64")}`;

  try {
    await db.$transaction([
      db.paper.create({
        data: {
          id: paperId,
          code: parsed.data.code.toUpperCase(),
          title: parsed.data.title,
          grade: parsed.data.grade,
          subject: parsed.data.subject,
          academicYear: parsed.data.academicYear || null,
          access: parsed.data.access,
          status: "DRAFT",
          sourceAssetPath: base64Data,
          createdById: admin.id,
        },
      }),
      db.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "paper.created",
          entityType: "Paper",
          entityId: paperId,
          metadata: { code: parsed.data.code.toUpperCase(), filename: file.name },
        },
      }),
    ]);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "試卷編號已經存在" }, { status: 409 });
    }
    console.error("Failed to create paper.", error);
    return NextResponse.json({ error: "未能儲存試卷" }, { status: 500 });
  }

  return NextResponse.json({ success: true, paperId, redirect: `/admin/papers/${paperId}/edit` });
}

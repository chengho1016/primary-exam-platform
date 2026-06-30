"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

const ADMIN_EMAIL = "admin@local.exam";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const allowedFileTypes = new Map([
  ["application/pdf", ".pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
]);

const newPaperSchema = z.object({
  code: z.string().trim().min(3, "請輸入試卷編號").max(40).regex(/^[A-Za-z0-9-]+$/, "試卷編號只可使用英文字母、數字及連字號"),
  title: z.string().trim().min(3, "請輸入試卷名稱").max(120),
  grade: z.coerce.number().int().min(1).max(6),
  subject: z.enum(["中文", "英文", "數學", "人文", "科學"]),
  academicYear: z.string().trim().max(20),
  access: z.enum(["FREE", "MEMBERSHIP", "PURCHASE"]),
});

const paperStatusSchema = z.object({
  paperId: z.string().min(1),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
});

const updatePaperSchema = newPaperSchema.extend({
  paperId: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(1).max(300),
});

const updateQuestionSchema = z.object({
  questionId: z.string().min(1),
  stem: z.string().trim().min(2).max(1000),
  topic: z.string().trim().min(1).max(80),
  subtopic: z.string().trim().max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  canonicalAnswer: z.string().trim().min(1).max(200),
  explanation: z.string().trim().max(1000),
});

export interface NewPaperActionState {
  error?: string;
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function validateUploadedFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) throw new Error("請選擇試卷檔案");
  if (value.size > MAX_UPLOAD_BYTES) throw new Error("試卷檔案不可超過50MB");

  const extension = allowedFileTypes.get(value.type);
  if (!extension) throw new Error("只支援PDF、DOCX、PNG或JPG檔案");
  return { file: value, extension };
}

async function getAdminId() {
  const admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  if (!admin) throw new Error("找不到本機管理員帳戶，請先執行資料庫 seed");
  return admin.id;
}

export async function createPaperAction(
  _previousState: NewPaperActionState,
  formData: FormData,
): Promise<NewPaperActionState> {
  await requireAdmin();
  const parsedPaper = newPaperSchema.safeParse(Object.fromEntries(formData));
  if (!parsedPaper.success) return { error: parsedPaper.error.issues[0]?.message ?? "試卷資料不完整" };

  let uploadedFile: ReturnType<typeof validateUploadedFile>;
  try {
    uploadedFile = validateUploadedFile(formData.get("paperFile"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "試卷檔案無效" };
  }

  const paperId = randomUUID();
  const sourceFilename = `papers/${paperId}/source${uploadedFile.extension}`;

  try {
    const blob = await put(sourceFilename, uploadedFile.file, {
      access: "public",
      addRandomSuffix: false,
    });
    const adminId = await getAdminId();

    await db.$transaction([
      db.paper.create({
        data: {
          id: paperId,
          code: parsedPaper.data.code.toUpperCase(),
          title: parsedPaper.data.title,
          grade: parsedPaper.data.grade,
          subject: parsedPaper.data.subject,
          academicYear: parsedPaper.data.academicYear || undefined,
          access: parsedPaper.data.access,
          status: "DRAFT",
          sourceAssetPath: blob.url,
          createdById: adminId,
        },
      }),
      db.adminAuditLog.create({
        data: {
          adminId,
          action: "paper.created",
          entityType: "Paper",
          entityId: paperId,
          metadata: { code: parsedPaper.data.code.toUpperCase(), filename: uploadedFile.file.name },
        },
      }),
    ]);
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "試卷編號已經存在" };
    console.error("Failed to create paper.", error);
    return { error: "未能儲存試卷，請稍後再試" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/papers");
  redirect("/admin/papers?created=1");
}

export async function updatePaperStatusAction(formData: FormData) {
  await requireAdmin();
  const parsedStatus = paperStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsedStatus.success) throw new Error("無效的試卷狀態更新");

  const adminId = await getAdminId();
  await db.$transaction([
    db.paper.update({
      where: { id: parsedStatus.data.paperId },
      data: { status: parsedStatus.data.status },
    }),
    db.adminAuditLog.create({
      data: {
        adminId,
        action: "paper.status.updated",
        entityType: "Paper",
        entityId: parsedStatus.data.paperId,
        metadata: { status: parsedStatus.data.status },
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/papers");
}

export async function updatePaperAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsedPaper = updatePaperSchema.safeParse(Object.fromEntries(formData));
  if (!parsedPaper.success) throw new Error(parsedPaper.error.issues[0]?.message ?? "試卷資料不正確");

  await db.$transaction([
    db.paper.update({
      where: { id: parsedPaper.data.paperId },
      data: {
        code: parsedPaper.data.code.toUpperCase(),
        title: parsedPaper.data.title,
        grade: parsedPaper.data.grade,
        subject: parsedPaper.data.subject,
        academicYear: parsedPaper.data.academicYear || null,
        access: parsedPaper.data.access,
        durationMinutes: parsedPaper.data.durationMinutes,
      },
    }),
    db.adminAuditLog.create({
      data: { adminId: admin.id, action: "paper.updated", entityType: "Paper", entityId: parsedPaper.data.paperId },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/papers");
  revalidatePath(`/papers/${parsedPaper.data.paperId}`);
  redirect("/admin/papers?updated=1");
}

export async function updateQuestionAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsedQuestion = updateQuestionSchema.safeParse(Object.fromEntries(formData));
  if (!parsedQuestion.success) throw new Error(parsedQuestion.error.issues[0]?.message ?? "題目資料不正確");

  const existingQuestion = await db.question.findUnique({
    where: { id: parsedQuestion.data.questionId },
    select: { answerRule: true, paper: { select: { code: true } } },
  });
  if (!existingQuestion) throw new Error("找不到題目");

  const currentRule = existingQuestion.answerRule && typeof existingQuestion.answerRule === "object" && !Array.isArray(existingQuestion.answerRule)
    ? existingQuestion.answerRule
    : {};
  const answerRule = { ...currentRule, canonical: parsedQuestion.data.canonicalAnswer };

  await db.$transaction([
    db.question.update({
      where: { id: parsedQuestion.data.questionId },
      data: {
        stem: parsedQuestion.data.stem,
        topic: parsedQuestion.data.topic,
        subtopic: parsedQuestion.data.subtopic || null,
        difficulty: parsedQuestion.data.difficulty,
        answerRule,
        explanation: parsedQuestion.data.explanation || null,
        onlineEligible: formData.get("onlineEligible") === "on",
        reviewStatus: "verified_admin",
      },
    }),
    db.adminAuditLog.create({
      data: { adminId: admin.id, action: "question.updated", entityType: "Question", entityId: parsedQuestion.data.questionId },
    }),
  ]);

  revalidatePath("/admin/questions");
  redirect(`/admin/questions?paper=${encodeURIComponent(existingQuestion.paper.code)}&updated=1`);
}

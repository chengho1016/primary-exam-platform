"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/prisma";
import type { NewPaperActionState } from "@/app/admin/action-types";

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

const questionTypeSchema = z.enum(["MULTIPLE_CHOICE", "NUMBER", "TEXT", "WORKED_RESPONSE"]);

const updateQuestionSchema = z.object({
  questionId: z.string().min(1),
  number: z.coerce.number().int().min(1).max(999),
  section: z.string().trim().min(1).max(40),
  marks: z.coerce.number().int().min(0).max(100),
  sourcePage: z.coerce.number().int().min(0).max(999).optional().default(0),
  type: questionTypeSchema,
  stem: z.string().trim().min(2).max(2000),
  optionsText: z.string().trim().max(1000),
  topic: z.string().trim().min(1).max(80),
  subtopic: z.string().trim().max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  canonicalAnswer: z.string().trim().min(1).max(200),
  explanation: z.string().trim().max(1000),
});

const createQuestionSchema = z.object({
  paperId: z.string().min(1, "請選擇試卷"),
  number: z.coerce.number().int().min(1).max(999),
  section: z.string().trim().min(1).max(40),
  marks: z.coerce.number().int().min(0).max(100),
  sourcePage: z.coerce.number().int().min(0).max(999).optional().default(0),
  type: questionTypeSchema,
  stem: z.string().trim().min(2, "請輸入題目").max(2000),
  optionsText: z.string().trim().max(1000),
  canonicalAnswer: z.string().trim().min(1, "請輸入標準答案").max(200),
  topic: z.string().trim().min(1, "請輸入課題").max(80),
  subtopic: z.string().trim().max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().trim().max(1000),
});

const adminUserSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().trim().min(1, "請輸入會員名稱").max(80),
  email: z.string().trim().email("請輸入有效電郵").max(160),
  role: z.enum(["PARENT", "ADMIN"]),
  membershipStatus: z.enum(["NONE", "TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"]),
  providerPlanId: z.string().trim().max(80),
  printAllowance: z.coerce.number().int().min(0).max(9999),
  periodStartsAt: z.string().trim().max(40),
  periodEndsAt: z.string().trim().max(40),
});

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
  const mimeType = uploadedFile.file.type;
  const fileBuffer = Buffer.from(await uploadedFile.file.arrayBuffer());
  const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

  try {
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
          sourceAssetPath: base64Data,
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

function buildAnswerRule(canonicalAnswer: string) {
  return { canonical: canonicalAnswer };
}

function mergeAnswerRule(existingRule: unknown, canonicalAnswer: string) {
  const currentRule = existingRule && typeof existingRule === "object" && !Array.isArray(existingRule)
    ? existingRule as Record<string, unknown>
    : {};
  return { ...currentRule, canonical: canonicalAnswer };
}

function parseMultipleChoiceOptions(optionsText: string) {
  const optionKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lines = optionsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const options: Record<string, string> = {};

  lines.forEach((line, index) => {
    const labelled = line.match(/^([A-ZＡ-Ｚ])\s*[\.)．、:：）]\s*(.+)$/i);
    if (labelled) {
      const key = labelled[1].toUpperCase().replace(/[Ａ-Ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
      options[key] = labelled[2].trim();
      return;
    }

    options[optionKeys[index]] = line;
  });

  return options;
}

export async function createQuestionAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsedQuestion = createQuestionSchema.safeParse(Object.fromEntries(formData));
  if (!parsedQuestion.success) throw new Error(parsedQuestion.error.issues[0]?.message ?? "題目資料不正確");

  const paper = await db.paper.findUnique({ where: { id: parsedQuestion.data.paperId }, select: { id: true, code: true, subject: true } });
  if (!paper) throw new Error("找不到試卷");

  const options = parsedQuestion.data.type === "MULTIPLE_CHOICE" ? parseMultipleChoiceOptions(parsedQuestion.data.optionsText) : null;
  if (parsedQuestion.data.type === "MULTIPLE_CHOICE" && Object.keys(options ?? {}).length < 2) {
    throw new Error("選擇題至少需要兩個選項，每行一個，例如 A. 12cm");
  }

  const onlineEligible = formData.get("onlineEligible") === "on";

  try {
    const createdQuestion = await db.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          paperId: parsedQuestion.data.paperId,
          number: parsedQuestion.data.number,
          section: parsedQuestion.data.section,
          marks: parsedQuestion.data.marks,
          sourcePage: parsedQuestion.data.sourcePage || null,
          type: parsedQuestion.data.type,
          stem: parsedQuestion.data.stem,
          options: options ?? undefined,
          answerRule: buildAnswerRule(parsedQuestion.data.canonicalAnswer),
          explanation: parsedQuestion.data.explanation || null,
          topic: parsedQuestion.data.topic,
          subtopic: parsedQuestion.data.subtopic || null,
          difficulty: parsedQuestion.data.difficulty,
          onlineEligible,
          reviewStatus: "verified_admin",
        },
      });

      await tx.paper.update({
        where: { id: parsedQuestion.data.paperId },
        data: { totalMarks: { increment: parsedQuestion.data.marks } },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "question.created",
          entityType: "Question",
          entityId: question.id,
          metadata: { paperCode: paper.code, number: parsedQuestion.data.number, topic: parsedQuestion.data.topic },
        },
      });

      return question;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/questions");
    revalidatePath("/admin/database");
    revalidatePath(`/papers/${parsedQuestion.data.paperId}`);
    redirect(`/admin/questions?subject=${encodeURIComponent(paper.subject)}&paper=${encodeURIComponent(paper.code)}&created=1#question-${createdQuestion.id}`);
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error("同一份試卷已經有相同題號，請改用另一個題號");
    throw error;
  }
}

export async function updateQuestionAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsedQuestion = updateQuestionSchema.safeParse(Object.fromEntries(formData));
  if (!parsedQuestion.success) throw new Error(parsedQuestion.error.issues[0]?.message ?? "題目資料不正確");

  const existingQuestion = await db.question.findUnique({
    where: { id: parsedQuestion.data.questionId },
    select: { id: true, paperId: true, marks: true, answerRule: true, paper: { select: { code: true, subject: true } } },
  });
  if (!existingQuestion) throw new Error("找不到題目");

  const options = parsedQuestion.data.type === "MULTIPLE_CHOICE" ? parseMultipleChoiceOptions(parsedQuestion.data.optionsText) : null;
  if (parsedQuestion.data.type === "MULTIPLE_CHOICE" && Object.keys(options ?? {}).length < 2) {
    throw new Error("選擇題至少需要兩個選項，每行一個，例如 A. 12cm");
  }

  const marksDelta = parsedQuestion.data.marks - existingQuestion.marks;

  try {
    await db.$transaction(async (tx) => {
      await tx.question.update({
        where: { id: parsedQuestion.data.questionId },
        data: {
          number: parsedQuestion.data.number,
          section: parsedQuestion.data.section,
          marks: parsedQuestion.data.marks,
          sourcePage: parsedQuestion.data.sourcePage || null,
          type: parsedQuestion.data.type,
          stem: parsedQuestion.data.stem,
          options: parsedQuestion.data.type === "MULTIPLE_CHOICE" ? options ?? undefined : Prisma.JsonNull,
          topic: parsedQuestion.data.topic,
          subtopic: parsedQuestion.data.subtopic || null,
          difficulty: parsedQuestion.data.difficulty,
          answerRule: mergeAnswerRule(existingQuestion.answerRule, parsedQuestion.data.canonicalAnswer),
          explanation: parsedQuestion.data.explanation || null,
          onlineEligible: formData.get("onlineEligible") === "on",
          reviewStatus: "verified_admin",
        },
      });

      if (marksDelta !== 0) {
        await tx.paper.update({
          where: { id: existingQuestion.paperId },
          data: { totalMarks: { increment: marksDelta } },
        });
      }

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "question.updated",
          entityType: "Question",
          entityId: parsedQuestion.data.questionId,
          metadata: { number: parsedQuestion.data.number, topic: parsedQuestion.data.topic, type: parsedQuestion.data.type },
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error("同一份試卷已經有相同題號，請改用另一個題號");
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  revalidatePath("/admin/database");
  revalidatePath(`/papers/${existingQuestion.paperId}`);
  redirect(`/admin/questions?subject=${encodeURIComponent(existingQuestion.paper.subject)}&paper=${encodeURIComponent(existingQuestion.paper.code)}&updated=1#question-${existingQuestion.id}`);
}

function parseAdminDateTime(value: string, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

export async function updateAdminUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsedUser = adminUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsedUser.success) throw new Error(parsedUser.error.issues[0]?.message ?? "會員資料不正確");

  const user = await db.user.findUnique({
    where: { id: parsedUser.data.userId },
    include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!user) throw new Error("找不到會員");

  const now = new Date();
  const periodStartsAt = parseAdminDateTime(parsedUser.data.periodStartsAt, user.subscriptions[0]?.periodStartsAt ?? now);
  const periodEndsAt = parseAdminDateTime(parsedUser.data.periodEndsAt, user.subscriptions[0]?.periodEndsAt ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsedUser.data.userId },
      data: {
        displayName: parsedUser.data.displayName,
        email: parsedUser.data.email.toLowerCase(),
        role: parsedUser.data.role,
      },
    });

    const latestSubscription = user.subscriptions[0];
    if (parsedUser.data.membershipStatus === "NONE") {
      if (latestSubscription) await tx.subscription.deleteMany({ where: { userId: parsedUser.data.userId } });
    } else if (latestSubscription) {
      await tx.subscription.update({
        where: { id: latestSubscription.id },
        data: {
          status: parsedUser.data.membershipStatus,
          providerPlanId: parsedUser.data.providerPlanId || null,
          printAllowance: parsedUser.data.printAllowance,
          periodStartsAt,
          periodEndsAt,
        },
      });
    } else {
      await tx.subscription.create({
        data: {
          userId: parsedUser.data.userId,
          status: parsedUser.data.membershipStatus,
          providerPlanId: parsedUser.data.providerPlanId || null,
          printAllowance: parsedUser.data.printAllowance,
          periodStartsAt,
          periodEndsAt,
        },
      });
    }

    await tx.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "user.updated",
        entityType: "User",
        entityId: parsedUser.data.userId,
        metadata: {
          role: parsedUser.data.role,
          membershipStatus: parsedUser.data.membershipStatus,
          printAllowance: parsedUser.data.printAllowance,
        },
      },
    });
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsedUser.data.userId}/edit`);
  redirect("/admin/users?updated=1");
}

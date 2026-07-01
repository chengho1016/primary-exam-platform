import "server-only";
import type { PaperStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/prisma";

export async function getAdminOverview() {
  const [publishedPaperCount, questionCount, parentCount, printJobCount, reviewQuestionCount, recentPapers] = await Promise.all([
    db.paper.count({ where: { status: "PUBLISHED" } }),
    db.question.count(),
    db.user.count({ where: { role: "PARENT" } }),
    db.printJob.count(),
    db.question.count({ where: { NOT: { reviewStatus: { startsWith: "verified" } } } }),
    db.paper.findMany({
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: { _count: { select: { questions: true } } },
    }),
  ]);

  return {
    metrics: [
      { label: "已發布試卷", value: String(publishedPaperCount), change: "資料庫即時數據", tone: "blue" as const },
      { label: "題庫題目", value: String(questionCount), change: "已匯入題目", tone: "mint" as const },
      { label: "家長帳戶", value: String(parentCount), change: "已建立帳戶", tone: "sun" as const },
      { label: "列印紀錄", value: String(printJobCount), change: "授權列印紀錄", tone: "coral" as const },
    ],
    reviewQuestionCount,
    recentPapers,
  };
}

export function listAdminPapers(filters: { query?: string; status?: PaperStatus } = {}) {
  const where: Prisma.PaperWhereInput = {};
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { code: { contains: filters.query, mode: "insensitive" } },
    ];
  }
  if (filters.status) where.status = filters.status;

  return db.paper.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    include: {
      _count: { select: { questions: true } },
      questions: { select: { onlineEligible: true, reviewStatus: true } },
    },
  });
}

export function listAdminQuestions(filters: { paperCode?: string; topic?: string; review?: "verified" | "needs-review" | "print-only" } = {}) {
  const where: Prisma.QuestionWhereInput = {};
  if (filters.paperCode) where.paper = { code: filters.paperCode };
  if (filters.topic) where.topic = filters.topic;
  if (filters.review === "verified") {
    where.onlineEligible = true;
    where.reviewStatus = { startsWith: "verified" };
  } else if (filters.review === "needs-review") {
    where.onlineEligible = true;
    where.NOT = { reviewStatus: { startsWith: "verified" } };
  } else if (filters.review === "print-only") {
    where.onlineEligible = false;
  }

  return db.question.findMany({
    where,
    orderBy: [{ paper: { code: "asc" } }, { number: "asc" }],
    take: 200,
    include: { paper: { select: { code: true, title: true, status: true } } },
  });
}

export function listAdminUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { children: true, entitlements: true, printJobs: true } },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export function getAdminUserDetail(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      children: { orderBy: { createdAt: "asc" } },
      entitlements: { include: { paper: { select: { code: true, title: true } } }, orderBy: { purchasedAt: "desc" } },
      printJobs: { orderBy: { createdAt: "desc" }, take: 10, include: { paper: { select: { code: true, title: true } } } },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

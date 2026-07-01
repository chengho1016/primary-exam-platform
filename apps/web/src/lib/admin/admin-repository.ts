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

export function listAdminQuestions(paperCode?: string) {
  return db.question.findMany({
    where: paperCode ? { paper: { code: paperCode } } : undefined,
    orderBy: [{ paper: { code: "asc" } }, { number: "asc" }],
    take: 200,
    include: { paper: { select: { code: true, title: true } } },
  });
}

export function listAdminUsers() {
  return db.user.findMany({
    where: { role: "PARENT" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { children: true } },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

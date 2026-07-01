import "server-only";
import { db } from "@/lib/db/prisma";

export async function getWrongBook(childId: string) {
  const items = await db.wrongBookItem.findMany({
    where: { childId, resolvedAt: null },
    orderBy: { lastWrongAt: "desc" },
    include: { question: { include: { paper: { select: { id: true, title: true } } } } },
  });

  const topicCounts = items.reduce<Record<string, number>>((counts, item) => {
    counts[item.question.topic] = (counts[item.question.topic] ?? 0) + 1;
    return counts;
  }, {});
  return { items, topicCounts };
}

export async function getParentReport(childId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [attempts, resolvedWrongCount, activeWrongCount] = await Promise.all([
    db.attempt.findMany({
      where: { childId, status: "COMPLETED", completedAt: { gte: since } },
      orderBy: { completedAt: "desc" },
      include: { paper: { select: { title: true, subject: true } } },
    }),
    db.wrongBookItem.count({ where: { childId, resolvedAt: { not: null } } }),
    db.wrongBookItem.count({ where: { childId, resolvedAt: null } }),
  ]);

  const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0);
  const totalMaximum = attempts.reduce((sum, attempt) => sum + (attempt.maximumMark ?? 0), 0);
  const accuracy = totalMaximum ? Math.round(totalScore / totalMaximum * 100) : 0;

  const subjectTotals = attempts.reduce<Record<string, { score: number; maximum: number }>>((totals, attempt) => {
    const current = totals[attempt.paper.subject] ?? { score: 0, maximum: 0 };
    current.score += attempt.score ?? 0;
    current.maximum += attempt.maximumMark ?? 0;
    totals[attempt.paper.subject] = current;
    return totals;
  }, {});

  return { attempts, accuracy, resolvedWrongCount, activeWrongCount, subjectTotals };
}

export async function getRecommendedPracticePaper() {
  const papers = await db.paper.findMany({
    where: { status: "PUBLISHED", subject: "數學" },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      subject: true,
      _count: {
        select: {
          questions: { where: { onlineEligible: true, reviewStatus: { startsWith: "verified" } } },
        },
      },
    },
  });

  return papers.find((paper) => paper._count.questions >= 15) ?? null;
}

export async function getDashboardLearningData(childId: string) {
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [weeklyAttemptCount, recentAttempts, recommendedPaper] = await Promise.all([
    db.attempt.count({ where: { childId, status: "COMPLETED", completedAt: { gte: weekStart } } }),
    db.attempt.findMany({
      where: { childId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { paper: { select: { title: true, subject: true } } },
    }),
    getRecommendedPracticePaper(),
  ]);
  return { weeklyAttemptCount, recentAttempts, recommendedPaper };
}

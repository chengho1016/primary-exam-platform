import type { PrismaClient } from "@/generated/prisma/client";
import { buildQuestionContentSnapshot } from "./question-snapshot";

export type QuestionVersionBackfillStats = {
  questionsScanned: number;
  versionsCreated: number;
  versionsAlreadyPresent: number;
};

export async function backfillQuestionVersions(prisma: PrismaClient): Promise<QuestionVersionBackfillStats> {
  const stats: QuestionVersionBackfillStats = {
    questionsScanned: 0,
    versionsCreated: 0,
    versionsAlreadyPresent: 0,
  };

  const questions = await prisma.question.findMany({
    orderBy: [{ paperId: "asc" }, { number: "asc" }],
    include: {
      paper: { select: { id: true, code: true, title: true, subject: true, grade: true } },
      versions: { select: { version: true } },
    },
  });

  for (const question of questions) {
    stats.questionsScanned += 1;
    const hasCurrentVersion = question.versions.some((version) => version.version === question.contentVersion);
    if (hasCurrentVersion) {
      stats.versionsAlreadyPresent += 1;
      continue;
    }

    await prisma.questionVersion.upsert({
      where: { questionId_version: { questionId: question.id, version: question.contentVersion } },
      update: {},
      create: {
        questionId: question.id,
        version: question.contentVersion,
        snapshot: buildQuestionContentSnapshot(question),
        createdById: null,
      },
    });
    stats.versionsCreated += 1;
  }

  return stats;
}

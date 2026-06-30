import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { hasPaperAccess } from "@/lib/auth/entitlements";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { gradeAnswer, type AnswerRule } from "@/lib/practice/grading";

const submissionSchema = z.object({
  paperId: z.string().min(1),
  questionIds: z.array(z.string().min(1)).length(15),
  answers: z.record(z.string(), z.string()),
});

interface GradedAnswer {
  questionId: string;
  response: string;
  isCorrect: boolean;
}

async function syncWrongBook(
  transaction: Prisma.TransactionClient,
  childId: string,
  gradedAnswers: GradedAnswer[],
) {
  for (const answer of gradedAnswers) {
    if (answer.isCorrect) {
      await transaction.wrongBookItem.updateMany({
        where: { childId, questionId: answer.questionId, resolvedAt: null },
        data: { resolvedAt: new Date() },
      });
      continue;
    }

    await transaction.wrongBookItem.upsert({
      where: { childId_questionId: { childId, questionId: answer.questionId } },
      update: { incorrectCount: { increment: 1 }, resolvedAt: null, lastWrongAt: new Date() },
      create: { childId, questionId: answer.questionId },
    });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const child = user?.children[0];
  if (!user || !child) return Response.json({ error: "請先登入家長帳戶" }, { status: 401 });

  const body = await request.json().catch(() => undefined);
  const submission = submissionSchema.safeParse(body);
  if (!submission.success) return Response.json({ error: "練習資料格式不正確" }, { status: 400 });
  if (!(await hasPaperAccess(user.id, submission.data.paperId))) return Response.json({ error: "未有使用此試卷的權限" }, { status: 403 });

  const uniqueQuestionIds = Array.from(new Set(submission.data.questionIds));
  if (uniqueQuestionIds.length !== 15) return Response.json({ error: "練習題目不可重複" }, { status: 400 });

  const questions = await db.question.findMany({
    where: {
      id: { in: uniqueQuestionIds },
      paperId: submission.data.paperId,
      onlineEligible: true,
      reviewStatus: { startsWith: "verified" },
    },
    select: { id: true, answerRule: true, options: true },
  });
  if (questions.length !== 15) return Response.json({ error: "部分題目未獲網上練習授權" }, { status: 400 });

  const gradedAnswers = questions.map((question) => {
    const response = submission.data.answers[question.id] ?? "";
    return {
      questionId: question.id,
      response,
      isCorrect: gradeAnswer(
        question.answerRule as AnswerRule,
        response,
        question.options as Record<string, string> | undefined,
      ),
    };
  });
  const score = gradedAnswers.filter(({ isCorrect }) => isCorrect).length;

  const attempt = await db.$transaction(async (transaction) => {
    const createdAttempt = await transaction.attempt.create({
      data: {
        childId: child.id,
        paperId: submission.data.paperId,
        status: "COMPLETED",
        score,
        maximumMark: gradedAnswers.length,
        completedAt: new Date(),
        answers: {
          create: gradedAnswers.map((answer) => ({
            questionId: answer.questionId,
            response: { value: answer.response },
            isCorrect: answer.isCorrect,
            awardedMark: answer.isCorrect ? 1 : 0,
          })),
        },
      },
    });
    await syncWrongBook(transaction, child.id, gradedAnswers);
    return createdAttempt;
  });

  return Response.json({ attemptId: attempt.id, score, total: gradedAnswers.length });
}

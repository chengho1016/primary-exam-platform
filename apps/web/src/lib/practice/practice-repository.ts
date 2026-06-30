import "server-only";
import path from "node:path";
import { db } from "@/lib/db/prisma";
import type { Difficulty, PracticeQuestion } from "@/lib/domain/types";
import { getCanonicalAnswer, type AnswerRule } from "@/lib/practice/grading";

function answerToText(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join(" > ") : answer;
}

function mapDifficulty(value: string): Difficulty {
  return value === "easy" || value === "hard" ? value : "medium";
}

function createAssetUrl(paperId: string, assetPath?: string | null) {
  return assetPath ? `/api/question-image/${paperId}/${path.basename(assetPath)}` : undefined;
}

export async function getPracticeQuestionPool(paperId: string): Promise<PracticeQuestion[]> {
  const questions = await db.question.findMany({
    where: { paperId, onlineEligible: true, reviewStatus: { startsWith: "verified" } },
    orderBy: { number: "asc" },
  });

  return questions.map((question) => {
    const rule = question.answerRule as AnswerRule;
    const options = question.options as Record<string, string> | null;
    const canonicalAnswer = getCanonicalAnswer(rule, options ?? undefined);
    const acceptedAnswers = (rule.accepted ?? []).map(answerToText);
    const canonicalKey = answerToText(rule.canonical ?? rule.canonical_example ?? canonicalAnswer);
    const selectedOption = options?.[canonicalKey];

    return {
      id: question.id,
      sourceNumber: question.number,
      prompt: question.stem,
      topic: question.topic,
      difficulty: mapDifficulty(question.difficulty),
      type: question.type === "MULTIPLE_CHOICE" ? "multiple-choice" : "number",
      options: options ? Object.values(options) : undefined,
      correctAnswer: canonicalAnswer,
      acceptedAnswers: Array.from(new Set([canonicalKey, canonicalAnswer, selectedOption, ...acceptedAnswers].filter((answer): answer is string => Boolean(answer)))),
      imagePath: createAssetUrl(paperId, question.assetPath),
      stimulusPath: createAssetUrl(paperId, question.stimulusPath),
      answerValidator: rule.validator?.greater_than && rule.validator.less_than ? {
        kind: "number-range" as const,
        greaterThan: Number(rule.validator.greater_than),
        lessThan: Number(rule.validator.less_than),
      } : undefined,
      explanation: question.explanation ?? "答案已由題庫覆核。",
    };
  });
}

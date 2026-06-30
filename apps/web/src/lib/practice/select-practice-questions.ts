import type { PracticeQuestion } from "@/lib/domain/types";

const DEFAULT_QUESTION_COUNT = 15;

function createSeededValue(seed: number) {
  const value = Math.sin(seed) * 10_000;
  return value - Math.floor(value);
}

function shuffleQuestions(questions: PracticeQuestion[], seed: number) {
  return [...questions]
    .map((question, index) => ({
      question,
      order: createSeededValue(seed + index + 1),
    }))
    .sort((left, right) => left.order - right.order)
    .map(({ question }) => question);
}

export function selectPracticeQuestions(
  questions: PracticeQuestion[],
  count = DEFAULT_QUESTION_COUNT,
  seed = 20260630,
) {
  const uniqueQuestions = Array.from(
    new Map(questions.map((question) => [question.id, question])).values(),
  );

  return shuffleQuestions(uniqueQuestions, seed).slice(0, count);
}

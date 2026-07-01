import type { PracticeQuestion } from "@/lib/domain/types";

export function mapPracticeQuestionType(value: string): PracticeQuestion["type"] {
  if (value === "MULTIPLE_CHOICE") return "multiple-choice";
  if (value === "TEXT") return "text";
  if (value === "WORKED_RESPONSE") return "worked-response";
  return "number";
}

export function isTextAnswerType(type: PracticeQuestion["type"]) {
  return type === "text" || type === "worked-response";
}

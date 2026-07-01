import { describe, expect, it } from "vitest";
import { isTextAnswerType, mapPracticeQuestionType } from "./question-type";

describe("practice question type mapping", () => {
  it("preserves text-answer question types for mobile keyboards", () => {
    expect(mapPracticeQuestionType("TEXT")).toBe("text");
    expect(mapPracticeQuestionType("WORKED_RESPONSE")).toBe("worked-response");
    expect(isTextAnswerType("text")).toBe(true);
    expect(isTextAnswerType("worked-response")).toBe(true);
  });

  it("keeps number and choice questions distinct", () => {
    expect(mapPracticeQuestionType("NUMBER")).toBe("number");
    expect(mapPracticeQuestionType("MULTIPLE_CHOICE")).toBe("multiple-choice");
    expect(isTextAnswerType("number")).toBe(false);
    expect(isTextAnswerType("multiple-choice")).toBe(false);
  });
});

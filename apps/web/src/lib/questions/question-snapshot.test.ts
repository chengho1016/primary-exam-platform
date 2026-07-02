import { describe, expect, it } from "vitest";
import { buildQuestionContentSnapshot, QUESTION_SNAPSHOT_SCHEMA_VERSION } from "./question-snapshot";

describe("question content snapshots", () => {
  it("captures immutable question content, grading rule, paper metadata and taxonomy refs", () => {
    const snapshot = buildQuestionContentSnapshot({
      id: "question-1",
      paperId: "paper-1",
      contentVersion: 3,
      number: 8,
      section: "B",
      marks: 2,
      sourcePage: 4,
      type: "TEXT",
      stem: "原本題目內容",
      options: null,
      answerRule: { canonical: "正方形", accepted: ["square"] },
      explanation: "因為四邊相等。",
      topic: "圖形",
      subtopic: "四邊形",
      difficulty: "medium",
      assetPath: "q8.png",
      stimulusPath: null,
      onlineEligible: true,
      reviewStatus: "verified_admin",
      curriculumId: "curriculum-hk",
      subjectId: "subject-math",
      topicId: "topic-shapes",
      knowledgePointId: "kp-square",
      paper: {
        id: "paper-1",
        code: "P4-MATH",
        title: "小四數學測驗",
        subject: "數學",
        grade: 4,
      },
    });

    expect(snapshot).toMatchObject({
      schemaVersion: QUESTION_SNAPSHOT_SCHEMA_VERSION,
      questionId: "question-1",
      questionVersion: 3,
      paper: { code: "P4-MATH", title: "小四數學測驗", subject: "數學", grade: 4 },
      content: {
        number: 8,
        section: "B",
        marks: 2,
        type: "TEXT",
        stem: "原本題目內容",
        answerRule: { canonical: "正方形", accepted: ["square"] },
        explanation: "因為四邊相等。",
        topic: "圖形",
        subtopic: "四邊形",
      },
      taxonomy: {
        curriculumId: "curriculum-hk",
        subjectId: "subject-math",
        topicId: "topic-shapes",
        knowledgePointId: "kp-square",
      },
    });
  });
});

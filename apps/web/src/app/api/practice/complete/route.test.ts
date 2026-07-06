import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  hasPaperAccess: vi.fn(),
  questionFindMany: vi.fn(),
  transaction: vi.fn(),
  attemptCreate: vi.fn(),
  wrongBookUpdateMany: vi.fn(),
  wrongBookUpsert: vi.fn(),
  gradeAnswer: vi.fn(),
  buildQuestionContentSnapshot: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/auth/entitlements", () => ({
  hasPaperAccess: mocks.hasPaperAccess,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    question: { findMany: mocks.questionFindMany },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/practice/grading", () => ({
  gradeAnswer: mocks.gradeAnswer,
}));

vi.mock("@/lib/questions/question-snapshot", () => ({
  buildQuestionContentSnapshot: mocks.buildQuestionContentSnapshot,
}));

vi.mock("@/lib/features", () => ({
  isOnlinePracticeEnabled: true,
}));

function makeQuestion(index: number) {
  return {
    id: `question-${index}`,
    paperId: "paper-1",
    contentVersion: 2,
    number: index,
    section: "A",
    marks: 1,
    sourcePage: 1,
    type: "TEXT",
    stem: `Original stem ${index}`,
    options: null,
    answerRule: { canonical: `answer-${index}` },
    explanation: `Explanation ${index}`,
    topic: "分數",
    subtopic: "異分母加減",
    difficulty: "medium",
    assetPath: null,
    stimulusPath: null,
    onlineEligible: true,
    reviewStatus: "verified_admin",
    curriculumId: "curriculum-hk-primary",
    subjectId: "subject-math",
    topicId: "topic-fractions",
    knowledgePointId: "kp-fractions-addition",
    paper: {
      id: "paper-1",
      code: "P4-MATH",
      title: "小四數學練習",
      subject: "數學",
      grade: 4,
    },
  };
}

function request(payload: unknown) {
  return new Request("https://example.test/api/practice/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/practice/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "parent-1", children: [{ id: "child-1" }] });
    mocks.hasPaperAccess.mockResolvedValue(true);
    mocks.questionFindMany.mockResolvedValue(Array.from({ length: 15 }, (_, index) => makeQuestion(index + 1)));
    mocks.gradeAnswer.mockReturnValue(true);
    mocks.buildQuestionContentSnapshot.mockImplementation((question) => ({
      questionId: question.id,
      questionVersion: question.contentVersion,
      paper: { code: question.paper.code, title: question.paper.title, subject: question.paper.subject, grade: question.paper.grade },
      content: {
        stem: question.stem,
        answerRule: question.answerRule,
        topic: question.topic,
        subtopic: question.subtopic,
      },
      taxonomy: {
        curriculumId: question.curriculumId,
        subjectId: question.subjectId,
        topicId: question.topicId,
        knowledgePointId: question.knowledgePointId,
      },
    }));
    mocks.attemptCreate.mockResolvedValue({ id: "attempt-1" });
    mocks.wrongBookUpdateMany.mockResolvedValue({ count: 0 });
    mocks.wrongBookUpsert.mockResolvedValue({ id: "wrong-1" });
    mocks.transaction.mockImplementation(async (callback) => callback({
      attempt: { create: mocks.attemptCreate },
      wrongBookItem: { updateMany: mocks.wrongBookUpdateMany, upsert: mocks.wrongBookUpsert },
    }));
  });

  it("stores question content snapshots with each attempt answer", async () => {
    const questionIds = Array.from({ length: 15 }, (_, index) => `question-${index + 1}`);
    const answers = Object.fromEntries(questionIds.map((id, index) => [id, `answer-${index + 1}`]));

    const response = await POST(request({ paperId: "paper-1", questionIds, answers }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ attemptId: "attempt-1", score: 15, total: 15 });
    expect(mocks.questionFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: { in: questionIds },
        paperId: "paper-1",
        onlineEligible: true,
      }),
      select: expect.objectContaining({
        contentVersion: true,
        stem: true,
        answerRule: true,
        paper: { select: { id: true, code: true, title: true, subject: true, grade: true } },
      }),
    }));

    const attemptCreateArgs = mocks.attemptCreate.mock.calls[0][0];
    const firstAnswer = attemptCreateArgs.data.answers.create[0];
    expect(firstAnswer).toMatchObject({
      questionId: "question-1",
      questionVersion: 2,
      response: { value: "answer-1" },
      isCorrect: true,
      awardedMark: 1,
    });
    expect(firstAnswer.questionSnapshot).toMatchObject({
      questionId: "question-1",
      questionVersion: 2,
      paper: { code: "P4-MATH", title: "小四數學練習", subject: "數學", grade: 4 },
      content: {
        stem: "Original stem 1",
        answerRule: { canonical: "answer-1" },
        topic: "分數",
        subtopic: "異分母加減",
      },
      taxonomy: {
        curriculumId: "curriculum-hk-primary",
        subjectId: "subject-math",
        topicId: "topic-fractions",
        knowledgePointId: "kp-fractions-addition",
      },
    });
    expect(mocks.wrongBookUpdateMany).toHaveBeenCalledTimes(15);
    expect(mocks.wrongBookUpsert).not.toHaveBeenCalled();
  });
});

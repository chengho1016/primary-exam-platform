import type { Prisma } from "@/generated/prisma/client";

export const QUESTION_SNAPSHOT_SCHEMA_VERSION = 1;

export interface QuestionSnapshotSource {
  id: string;
  paperId: string;
  contentVersion: number;
  number: number;
  section: string;
  marks: number;
  sourcePage: number | null;
  type: string;
  stem: string;
  options: unknown;
  answerRule: unknown;
  explanation: string | null;
  topic: string;
  subtopic: string | null;
  difficulty: string;
  assetPath: string | null;
  stimulusPath: string | null;
  onlineEligible: boolean;
  reviewStatus: string;
  curriculumId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  knowledgePointId?: string | null;
  paper?: {
    id?: string;
    code?: string;
    title?: string;
    subject?: string;
    grade?: number;
  } | null;
}

export function buildQuestionContentSnapshot(question: QuestionSnapshotSource): Prisma.InputJsonObject {
  return {
    schemaVersion: QUESTION_SNAPSHOT_SCHEMA_VERSION,
    questionId: question.id,
    questionVersion: question.contentVersion,
    paper: {
      id: question.paper?.id ?? question.paperId,
      code: question.paper?.code ?? null,
      title: question.paper?.title ?? null,
      subject: question.paper?.subject ?? null,
      grade: question.paper?.grade ?? null,
    },
    content: {
      number: question.number,
      section: question.section,
      marks: question.marks,
      sourcePage: question.sourcePage,
      type: question.type,
      stem: question.stem,
      options: question.options ?? null,
      answerRule: question.answerRule ?? null,
      explanation: question.explanation,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      assetPath: question.assetPath,
      stimulusPath: question.stimulusPath,
      onlineEligible: question.onlineEligible,
      reviewStatus: question.reviewStatus,
    },
    taxonomy: {
      curriculumId: question.curriculumId ?? null,
      subjectId: question.subjectId ?? null,
      topicId: question.topicId ?? null,
      knowledgePointId: question.knowledgePointId ?? null,
    },
  } as Prisma.InputJsonObject;
}

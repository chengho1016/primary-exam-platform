import "server-only";
import type { PaperAccess, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/prisma";
import type { PaperSummary } from "@/lib/domain/types";

function mapAccess(access: PaperAccess): PaperSummary["access"] {
  if (access === "FREE") return "free";
  if (access === "PURCHASE") return "purchase";
  return "member";
}

function mapPaperSummary(paper: {
  id: string;
  title: string;
  grade: number;
  subject: string;
  academicYear: string | null;
  durationMinutes: number;
  pageCount: number;
  access: PaperAccess;
  priceInCents: number | null;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  _count: { questions: number };
}): PaperSummary {
  return {
    id: paper.id,
    title: paper.title,
    grade: paper.grade,
    subject: paper.subject,
    subjectId: paper.subject === "數學" ? "math" : paper.subject,
    academicYear: paper.academicYear ?? "未設定學年",
    questionCount: paper._count.questions,
    pageCount: paper.pageCount,
    durationMinutes: paper.durationMinutes,
    difficulty: "medium",
    access: mapAccess(paper.access),
    price: paper.priceInCents ? paper.priceInCents / 100 : undefined,
    status: paper.status.toLowerCase() as PaperSummary["status"],
  };
}

export async function listPublishedPapers(filters: { grade?: number; subject?: string } = {}) {
  const where: Prisma.PaperWhereInput = { status: "PUBLISHED" };
  if (filters.grade) where.grade = filters.grade;
  if (filters.subject) where.subject = filters.subject;

  const papers = await db.paper.findMany({
    where,
    orderBy: [{ grade: "asc" }, { subject: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { questions: true } } },
  });
  return papers.map(mapPaperSummary);
}

export async function getPublishedPaperDetails(paperId: string) {
  const paper = await db.paper.findFirst({
    where: { id: paperId, status: "PUBLISHED" },
    include: { _count: { select: { questions: true } } },
  });
  if (!paper) return undefined;

  const [topics, onlineQuestionCount] = await Promise.all([
    db.question.findMany({ where: { paperId }, distinct: ["topic"], select: { topic: true }, orderBy: { topic: "asc" } }),
    db.question.count({ where: { paperId, onlineEligible: true, reviewStatus: { startsWith: "verified" } } }),
  ]);

  return {
    summary: mapPaperSummary(paper),
    topics: topics.map(({ topic }) => topic),
    onlineQuestionCount,
    canPrint: Boolean(paper.printablePdfPath || paper.sourceAssetPath),
    printMode: paper.printablePdfPath ? "pages" as const : "source" as const,
  };
}

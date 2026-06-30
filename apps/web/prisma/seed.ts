import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient, type Prisma, QuestionType } from "../src/generated/prisma/client";
import paperSource from "../src/content/2324-03-MA-P4/paper.json";
import questionSource from "../src/content/2324-03-MA-P4/questions.json";

const ADMIN_ID = "admin-local-001";
const PARENT_ID = "parent-demo-001";
const CHILD_ID = "child-demo-001";

interface SourceQuestion {
  id: string;
  number: number;
  section: string;
  source_page: number;
  marks: number;
  stem: string;
  answer_type: string;
  options?: Prisma.InputJsonValue;
  answer: Prisma.InputJsonValue;
  explanation?: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  asset?: string;
  stimulus?: string;
  online_eligible: boolean;
  review_status: string;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required to seed the database.");
  return databaseUrl;
}

function mapQuestionType(answerType: string) {
  if (answerType === "multiple_choice") return QuestionType.MULTIPLE_CHOICE;
  if (answerType === "worked_response") return QuestionType.WORKED_RESPONSE;
  if (["short_text", "ordered_list", "ordered_pair_text"].includes(answerType)) return QuestionType.TEXT;
  return QuestionType.NUMBER;
}

function createQuestionData(question: SourceQuestion): Prisma.QuestionCreateManyInput {
  return {
    id: question.id,
    paperId: paperSource.id,
    number: question.number,
    section: question.section,
    marks: question.marks,
    sourcePage: question.source_page,
    type: mapQuestionType(question.answer_type),
    stem: question.stem,
    options: question.options,
    answerRule: question.answer,
    explanation: question.explanation,
    topic: question.topic,
    subtopic: question.subtopic,
    difficulty: question.difficulty,
    assetPath: question.asset,
    stimulusPath: question.stimulus,
    onlineEligible: question.online_eligible,
    reviewStatus: question.review_status,
  };
}

async function upsertDemoAccounts(prisma: PrismaClient) {
  const adminPasswordHash = await hash(process.env.SEED_ADMIN_PASSWORD ?? "Admin123!", 12);
  const parentPasswordHash = await hash(process.env.SEED_PARENT_PASSWORD ?? "Parent123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@local.exam" },
    update: { displayName: "管理員", passwordHash: adminPasswordHash, role: "ADMIN" },
    create: {
      id: ADMIN_ID,
      email: "admin@local.exam",
      displayName: "管理員",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { displayName: "陳家長", passwordHash: parentPasswordHash },
    create: {
      id: PARENT_ID,
      email: "demo@example.com",
      displayName: "陳家長",
      passwordHash: parentPasswordHash,
      role: "PARENT",
    },
  });

  await prisma.childProfile.upsert({
    where: { id: CHILD_ID },
    update: { displayName: "樂言", grade: 4 },
    create: { id: CHILD_ID, parentId: PARENT_ID, displayName: "樂言", grade: 4 },
  });
}

async function upsertFirstPaper(prisma: PrismaClient) {
  await prisma.paper.upsert({
    where: { code: paperSource.paper_code },
    update: {
      title: paperSource.title,
      grade: paperSource.grade,
      subject: paperSource.subject,
      academicYear: paperSource.school_year,
      status: "PUBLISHED",
      access: "FREE",
      pageCount: paperSource.printable_pages,
      totalMarks: paperSource.total_marks,
    },
    create: {
      id: paperSource.id,
      code: paperSource.paper_code,
      title: paperSource.title,
      grade: paperSource.grade,
      subject: paperSource.subject,
      academicYear: paperSource.school_year,
      status: "PUBLISHED",
      access: "FREE",
      sourceAssetPath: "private://papers/2324-03-MA-P4/source.pdf",
      printablePdfPath: "private://papers/2324-03-MA-P4/print.pdf",
      pageCount: paperSource.printable_pages,
      durationMinutes: 45,
      totalMarks: paperSource.total_marks,
      createdById: ADMIN_ID,
    },
  });

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { paperId: paperSource.id } }),
    prisma.question.createMany({
      data: (questionSource as SourceQuestion[]).map(createQuestionData),
    }),
  ]);
}

async function seedDatabase() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    await upsertDemoAccounts(prisma);
    await upsertFirstPaper(prisma);
    console.info(`Seed completed: ${questionSource.length} questions imported.`);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase().catch((error: unknown) => {
  console.error("Database seed failed.", error);
  process.exitCode = 1;
});

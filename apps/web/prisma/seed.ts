import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient, type Prisma, QuestionType } from "../src/generated/prisma/client";
import { DEFAULT_CURRICULUM, DEFAULT_SUBJECTS } from "../src/lib/curriculum/default-taxonomy";
import { createKnowledgePointCode, createTopicCode, normalizeTopicLabel, resolveLegacySubjectCode } from "../src/lib/curriculum/legacy-mapping";
import paperSource from "../src/content/2324-03-MA-P4/paper.json";
import questionSource from "../src/content/2324-03-MA-P4/questions.json";

const ADMIN_ID = "admin-local-001";
const PARENT_ID = "parent-demo-001";
const CHILD_ID = "child-demo-001";

type TaxonomyRefs = {
  curriculumId: string;
  subjectId: string;
  topicIds: Map<string, string>;
  knowledgePointIds: Map<string, string>;
};

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

function createQuestionData(question: SourceQuestion, refs: TaxonomyRefs): Prisma.QuestionCreateManyInput {
  const normalizedTopic = normalizeTopicLabel(question.topic);
  const normalizedKnowledgePoint = question.subtopic ? normalizeTopicLabel(question.subtopic) : null;
  return {
    id: question.id,
    paperId: paperSource.id,
    curriculumId: refs.curriculumId,
    subjectId: refs.subjectId,
    topicId: refs.topicIds.get(normalizedTopic),
    knowledgePointId: normalizedKnowledgePoint ? refs.knowledgePointIds.get(`${normalizedTopic}::${normalizedKnowledgePoint}`) : undefined,
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

async function upsertDefaultTaxonomy(prisma: PrismaClient) {
  const curriculum = await prisma.curriculum.upsert({
    where: { code: DEFAULT_CURRICULUM.code },
    update: {
      nameZh: DEFAULT_CURRICULUM.nameZh,
      nameEn: DEFAULT_CURRICULUM.nameEn,
      regionCode: DEFAULT_CURRICULUM.regionCode,
      isActive: true,
    },
    create: {
      code: DEFAULT_CURRICULUM.code,
      nameZh: DEFAULT_CURRICULUM.nameZh,
      nameEn: DEFAULT_CURRICULUM.nameEn,
      regionCode: DEFAULT_CURRICULUM.regionCode,
      isActive: true,
    },
  });

  const subjects = new Map<string, string>();
  for (const subject of DEFAULT_SUBJECTS) {
    const record = await prisma.subject.upsert({
      where: { code: subject.code },
      update: {
        nameZh: subject.nameZh,
        nameEn: subject.nameEn,
        displayOrder: subject.displayOrder,
        isActive: true,
      },
      create: {
        code: subject.code,
        nameZh: subject.nameZh,
        nameEn: subject.nameEn,
        displayOrder: subject.displayOrder,
        isActive: true,
      },
    });
    subjects.set(subject.code, record.id);
  }

  return { curriculum, subjects };
}

async function buildPaperTaxonomyRefs(prisma: PrismaClient, curriculumId: string, subjectId: string): Promise<TaxonomyRefs> {
  const topicIds = new Map<string, string>();
  const knowledgePointIds = new Map<string, string>();
  const topics = Array.from(new Set((questionSource as SourceQuestion[]).map((question) => normalizeTopicLabel(question.topic))));

  for (const [index, topicName] of topics.entries()) {
    const topic = await prisma.topic.upsert({
      where: { subjectId_code: { subjectId, code: createTopicCode(topicName) } },
      update: { nameZh: topicName, displayOrder: index + 1, isActive: true },
      create: { subjectId, code: createTopicCode(topicName), nameZh: topicName, displayOrder: index + 1, isActive: true },
    });
    topicIds.set(topicName, topic.id);

    const knowledgePoints = Array.from(new Set((questionSource as SourceQuestion[])
      .filter((question) => normalizeTopicLabel(question.topic) === topicName && question.subtopic)
      .map((question) => normalizeTopicLabel(question.subtopic))));

    for (const [kpIndex, knowledgePointName] of knowledgePoints.entries()) {
      const knowledgePoint = await prisma.knowledgePoint.upsert({
        where: { topicId_code: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName) } },
        update: { nameZh: knowledgePointName, displayOrder: kpIndex + 1, isActive: true },
        create: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName), nameZh: knowledgePointName, displayOrder: kpIndex + 1, isActive: true },
      });
      knowledgePointIds.set(`${topicName}::${knowledgePointName}`, knowledgePoint.id);
    }
  }

  return { curriculumId, subjectId, topicIds, knowledgePointIds };
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

async function upsertFirstPaper(prisma: PrismaClient, refs: TaxonomyRefs) {
  await prisma.paper.upsert({
    where: { code: paperSource.paper_code },
    update: {
      title: paperSource.title,
      grade: paperSource.grade,
      subject: paperSource.subject,
      subjectId: refs.subjectId,
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
      subjectId: refs.subjectId,
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
      data: (questionSource as SourceQuestion[]).map((question) => createQuestionData(question, refs)),
    }),
  ]);
}

async function seedDatabase() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    const taxonomy = await upsertDefaultTaxonomy(prisma);
    const subjectCode = resolveLegacySubjectCode(paperSource.subject);
    if (!subjectCode) throw new Error(`Cannot resolve seeded paper subject: ${paperSource.subject}`);
    const subjectId = taxonomy.subjects.get(subjectCode);
    if (!subjectId) throw new Error(`Seed subject missing: ${subjectCode}`);
    const refs = await buildPaperTaxonomyRefs(prisma, taxonomy.curriculum.id, subjectId);
    await upsertDemoAccounts(prisma);
    await upsertFirstPaper(prisma, refs);
    console.info(`Seed completed: ${questionSource.length} questions imported.`);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase().catch((error: unknown) => {
  console.error("Database seed failed.", error);
  process.exitCode = 1;
});

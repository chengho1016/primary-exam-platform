import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_CURRICULUM, DEFAULT_SUBJECTS } from "../src/lib/curriculum/default-taxonomy";
import { createKnowledgePointCode, createTopicCode, normalizeTopicLabel, resolveLegacySubjectCode } from "../src/lib/curriculum/legacy-mapping";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required to backfill curriculum taxonomy.");
  return databaseUrl;
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

  const subjects = new Map<string, { id: string; nameZh: string }>();
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
    subjects.set(subject.code, { id: record.id, nameZh: record.nameZh });
  }

  return { curriculum, subjects };
}

async function backfill() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });
  const stats = {
    papersLinked: 0,
    questionsLinked: 0,
    topicsCreatedOrUpdated: 0,
    knowledgePointsCreatedOrUpdated: 0,
    unmappedPapers: [] as Array<{ id: string; code: string; subject: string }>,
  };

  try {
    const taxonomy = await upsertDefaultTaxonomy(prisma);
    const papers = await prisma.paper.findMany({
      orderBy: { code: "asc" },
      include: { questions: { orderBy: { number: "asc" } } },
    });

    for (const paper of papers) {
      const subjectCode = resolveLegacySubjectCode(paper.subject);
      const subject = subjectCode ? taxonomy.subjects.get(subjectCode) : null;
      if (!subject) {
        stats.unmappedPapers.push({ id: paper.id, code: paper.code, subject: paper.subject });
        continue;
      }

      if (paper.subjectId !== subject.id) {
        await prisma.paper.update({ where: { id: paper.id }, data: { subjectId: subject.id } });
        stats.papersLinked += 1;
      }

      for (const question of paper.questions) {
        const topicName = normalizeTopicLabel(question.topic);
        const topic = await prisma.topic.upsert({
          where: { subjectId_code: { subjectId: subject.id, code: createTopicCode(topicName) } },
          update: { nameZh: topicName, isActive: true },
          create: { subjectId: subject.id, code: createTopicCode(topicName), nameZh: topicName, isActive: true },
        });
        stats.topicsCreatedOrUpdated += 1;

        const knowledgePointName = question.subtopic ? normalizeTopicLabel(question.subtopic) : null;
        const knowledgePoint = knowledgePointName
          ? await prisma.knowledgePoint.upsert({
              where: { topicId_code: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName) } },
              update: { nameZh: knowledgePointName, isActive: true },
              create: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName), nameZh: knowledgePointName, isActive: true },
            })
          : null;
        if (knowledgePoint) stats.knowledgePointsCreatedOrUpdated += 1;

        await prisma.question.update({
          where: { id: question.id },
          data: {
            curriculumId: taxonomy.curriculum.id,
            subjectId: subject.id,
            topicId: topic.id,
            knowledgePointId: knowledgePoint?.id ?? null,
          },
        });
        stats.questionsLinked += 1;
      }
    }

    console.info(JSON.stringify(stats, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

backfill().catch((error: unknown) => {
  console.error("Curriculum backfill failed.", error);
  process.exitCode = 1;
});

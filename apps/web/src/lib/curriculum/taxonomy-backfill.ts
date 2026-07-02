import type { PrismaClient } from "@/generated/prisma/client";
import { DEFAULT_CURRICULUM, DEFAULT_SUBJECTS } from "./default-taxonomy";
import { createKnowledgePointCode, createTopicCode, normalizeTopicLabel, resolveLegacySubjectCode } from "./legacy-mapping";

export type CurriculumBackfillStats = {
  papersLinked: number;
  questionsLinked: number;
  topicsCreatedOrUpdated: number;
  knowledgePointsCreatedOrUpdated: number;
  unmappedPapers: Array<{ id: string; code: string; subject: string }>;
};

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

export async function runCurriculumBackfill(prisma: PrismaClient): Promise<CurriculumBackfillStats> {
  const stats: CurriculumBackfillStats = {
    papersLinked: 0,
    questionsLinked: 0,
    topicsCreatedOrUpdated: 0,
    knowledgePointsCreatedOrUpdated: 0,
    unmappedPapers: [],
  };

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

      if (
        question.curriculumId !== taxonomy.curriculum.id ||
        question.subjectId !== subject.id ||
        question.topicId !== topic.id ||
        question.knowledgePointId !== (knowledgePoint?.id ?? null)
      ) {
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
  }

  return stats;
}

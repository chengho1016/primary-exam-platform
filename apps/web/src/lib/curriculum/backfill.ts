import "server-only";
import { db } from "@/lib/db/prisma";
import { DEFAULT_CURRICULUM, DEFAULT_SUBJECTS } from "./default-taxonomy";
import { createKnowledgePointCode, createTopicCode, normalizeTopicLabel, resolveLegacySubjectCode } from "./legacy-mapping";

type BackfillClient = typeof db;

export type CurriculumBackfillStats = {
  papersLinked: number;
  questionsLinked: number;
  topicsCreatedOrUpdated: number;
  knowledgePointsCreatedOrUpdated: number;
  unmappedPapers: Array<{ id: string; code: string; subject: string }>;
};

export async function upsertDefaultTaxonomy(client: BackfillClient = db) {
  const curriculum = await client.curriculum.upsert({
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
    const record = await client.subject.upsert({
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


export async function ensureSubjectRef(subjectLabel: string, client: BackfillClient = db) {
  const taxonomy = await upsertDefaultTaxonomy(client);
  const subjectCode = resolveLegacySubjectCode(subjectLabel);
  const subject = subjectCode ? taxonomy.subjects.get(subjectCode) : null;
  if (!subject) throw new Error(`Cannot resolve subject taxonomy for: ${subjectLabel}`);
  return subject;
}

export async function ensureQuestionTaxonomyRefs(input: { subject: string; topic: string; subtopic?: string | null }, client: BackfillClient = db) {
  const taxonomy = await upsertDefaultTaxonomy(client);
  const subjectCode = resolveLegacySubjectCode(input.subject);
  const subject = subjectCode ? taxonomy.subjects.get(subjectCode) : null;
  if (!subject) throw new Error(`Cannot resolve subject taxonomy for: ${input.subject}`);

  const topicName = normalizeTopicLabel(input.topic);
  const topic = await client.topic.upsert({
    where: { subjectId_code: { subjectId: subject.id, code: createTopicCode(topicName) } },
    update: { nameZh: topicName, isActive: true },
    create: { subjectId: subject.id, code: createTopicCode(topicName), nameZh: topicName, isActive: true },
  });

  const knowledgePointName = input.subtopic ? normalizeTopicLabel(input.subtopic) : null;
  const knowledgePoint = knowledgePointName
    ? await client.knowledgePoint.upsert({
        where: { topicId_code: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName) } },
        update: { nameZh: knowledgePointName, isActive: true },
        create: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName), nameZh: knowledgePointName, isActive: true },
      })
    : null;

  return {
    curriculumId: taxonomy.curriculum.id,
    subjectId: subject.id,
    topicId: topic.id,
    knowledgePointId: knowledgePoint?.id ?? null,
  };
}

export async function backfillCurriculumTaxonomy(client: BackfillClient = db): Promise<CurriculumBackfillStats> {
  const stats: CurriculumBackfillStats = {
    papersLinked: 0,
    questionsLinked: 0,
    topicsCreatedOrUpdated: 0,
    knowledgePointsCreatedOrUpdated: 0,
    unmappedPapers: [],
  };

  const taxonomy = await upsertDefaultTaxonomy(client);
  const papers = await client.paper.findMany({
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
      await client.paper.update({ where: { id: paper.id }, data: { subjectId: subject.id } });
      stats.papersLinked += 1;
    }

    for (const question of paper.questions) {
      const topicName = normalizeTopicLabel(question.topic);
      const topic = await client.topic.upsert({
        where: { subjectId_code: { subjectId: subject.id, code: createTopicCode(topicName) } },
        update: { nameZh: topicName, isActive: true },
        create: { subjectId: subject.id, code: createTopicCode(topicName), nameZh: topicName, isActive: true },
      });
      stats.topicsCreatedOrUpdated += 1;

      const knowledgePointName = question.subtopic ? normalizeTopicLabel(question.subtopic) : null;
      const knowledgePoint = knowledgePointName
        ? await client.knowledgePoint.upsert({
            where: { topicId_code: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName) } },
            update: { nameZh: knowledgePointName, isActive: true },
            create: { topicId: topic.id, code: createKnowledgePointCode(knowledgePointName), nameZh: knowledgePointName, isActive: true },
          })
        : null;
      if (knowledgePoint) stats.knowledgePointsCreatedOrUpdated += 1;

      const nextData = {
        curriculumId: taxonomy.curriculum.id,
        subjectId: subject.id,
        topicId: topic.id,
        knowledgePointId: knowledgePoint?.id ?? null,
      };
      if (
        question.curriculumId !== nextData.curriculumId
        || question.subjectId !== nextData.subjectId
        || question.topicId !== nextData.topicId
        || question.knowledgePointId !== nextData.knowledgePointId
      ) {
        await client.question.update({ where: { id: question.id }, data: nextData });
        stats.questionsLinked += 1;
      }
    }
  }

  return stats;
}

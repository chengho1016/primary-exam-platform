-- AlterTable
ALTER TABLE "Paper" ADD COLUMN     "subjectId" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "curriculumId" TEXT,
ADD COLUMN     "knowledgePointId" TEXT,
ADD COLUMN     "subjectId" TEXT,
ADD COLUMN     "topicId" TEXT;

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "regionCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "parentTopicId" TEXT,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePoint" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_isActive_displayOrder_idx" ON "Subject"("isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_code_key" ON "Curriculum"("code");

-- CreateIndex
CREATE INDEX "Curriculum_isActive_code_idx" ON "Curriculum"("isActive", "code");

-- CreateIndex
CREATE INDEX "Topic_subjectId_isActive_displayOrder_idx" ON "Topic"("subjectId", "isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "Topic_parentTopicId_idx" ON "Topic"("parentTopicId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_subjectId_code_key" ON "Topic"("subjectId", "code");

-- CreateIndex
CREATE INDEX "KnowledgePoint_topicId_isActive_displayOrder_idx" ON "KnowledgePoint"("topicId", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePoint_topicId_code_key" ON "KnowledgePoint"("topicId", "code");

-- CreateIndex
CREATE INDEX "Paper_subjectId_status_idx" ON "Paper"("subjectId", "status");

-- CreateIndex
CREATE INDEX "Question_subjectId_topicId_difficulty_onlineEligible_idx" ON "Question"("subjectId", "topicId", "difficulty", "onlineEligible");

-- CreateIndex
CREATE INDEX "Question_curriculumId_idx" ON "Question"("curriculumId");

-- CreateIndex
CREATE INDEX "Question_knowledgePointId_idx" ON "Question"("knowledgePointId");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_parentTopicId_fkey" FOREIGN KEY ("parentTopicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePoint" ADD CONSTRAINT "KnowledgePoint_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;


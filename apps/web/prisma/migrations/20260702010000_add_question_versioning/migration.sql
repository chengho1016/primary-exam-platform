-- Add immutable question content snapshots for historical attempts.
-- This migration is side-by-side and backward-compatible:
-- existing AttemptAnswer rows can keep NULL snapshots until a backfill is added.

ALTER TABLE "Question"
  ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "QuestionVersion" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuestionVersion"
  ADD CONSTRAINT "QuestionVersion_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "QuestionVersion_questionId_version_key"
  ON "QuestionVersion"("questionId", "version");

CREATE INDEX "QuestionVersion_questionId_createdAt_idx"
  ON "QuestionVersion"("questionId", "createdAt");

ALTER TABLE "AttemptAnswer"
  ADD COLUMN "questionVersion" INTEGER,
  ADD COLUMN "questionSnapshot" JSONB;

CREATE INDEX "AttemptAnswer_questionId_questionVersion_idx"
  ON "AttemptAnswer"("questionId", "questionVersion");

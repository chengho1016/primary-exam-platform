# Phase 1 Data Normalization Implementation Plan

> **For Hermes:** Implement this plan in small commits. Do not use a big-bang migration.

**Goal:** Add the data foundation for long-term AI learning and content management: Subject, Curriculum, Topic, and KnowledgePoint.

**Architecture:** Add normalized tables side-by-side with existing legacy text fields. Backfill production data safely. Keep all current pages working after every step.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, PostgreSQL, Vitest.

---

## Guardrails

- Keep `Paper.subject`, `Question.topic`, and `Question.subtopic` until all reads/writes are migrated.
- New relation fields must start nullable.
- Use backfill scripts that can run repeatedly without duplicating data.
- Admin UI should read normalized tables, but legacy pages must continue to work.
- Every task should end with at least `npx prisma validate`; source-code tasks also run lint/tests/build as appropriate.

---

## Task 1: Add normalized curriculum taxonomy models

**Objective:** Add `Subject`, `Curriculum`, `Topic`, and `KnowledgePoint` without breaking current production data.

**Files:**

- Modify: `prisma/schema.prisma`

**Steps:**

1. Add models:
   - `Subject`
   - `Curriculum`
   - `Topic`
   - `KnowledgePoint`
2. Add nullable fields:
   - `Paper.subjectId String?`
   - `Question.subjectId String?`
   - `Question.curriculumId String?`
   - `Question.topicId String?`
   - `Question.knowledgePointId String?`
3. Add indexes for read paths:
   - `Subject.code`
   - `Topic.subjectId`
   - `Question.subjectId, topicId, difficulty, onlineEligible`
4. Run:

```bash
cd apps/web
npx prisma validate
npx prisma generate
```

Expected: schema valid and generated client updated.

---

## Task 2: Seed default Hong Kong subjects and curriculum

**Objective:** Create a repeatable seed/backfill path for the target primary-school subject list.

**Files:**

- Modify: `prisma/seed.ts`
- Create: `src/lib/curriculum/default-taxonomy.ts`
- Test: `src/lib/curriculum/default-taxonomy.test.ts`

**Default subjects:**

| code | nameZh | nameEn | order |
|---|---|---|---|
| `chinese` | 中文 | Chinese | 1 |
| `english` | 英文 | English | 2 |
| `math` | 數學 | Mathematics | 3 |
| `humanities` | 人文 | Humanities | 4 |
| `science` | 科學 | Science | 5 |

**Steps:**

1. Create pure default taxonomy constants.
2. Add tests proving codes are unique and display order is stable.
3. Update seed to upsert `Curriculum(code="hk-primary")` and all five subjects.
4. Run:

```bash
npm test -- src/lib/curriculum/default-taxonomy.test.ts
npx prisma validate
```

---

## Task 3: Backfill current Paper and Question references

**Objective:** Link existing data to normalized subjects/topics while preserving legacy text values.

**Files:**

- Create: `prisma/backfill-curriculum.ts` or `scripts/backfill-curriculum.ts`
- Create: `src/lib/curriculum/legacy-mapping.ts`
- Test: `src/lib/curriculum/legacy-mapping.test.ts`

**Mapping examples:**

- `數學`, `math`, `Mathematics` → `math`
- `中文`, `chinese` → `chinese`
- `英文`, `english` → `english`
- `人文`, `humanities` → `humanities`
- `科學`, `science` → `science`
- legacy `常識` should map to `humanities` only if intentionally confirmed; otherwise mark as unmapped for admin review.

**Steps:**

1. Create pure subject mapping helper.
2. Test known mappings and unknown behavior.
3. Backfill `Paper.subjectId` from `Paper.subject`.
4. Backfill `Question.subjectId` through its paper or legacy question data.
5. Create topics from existing normalized `Question.topic` strings per subject.
6. Backfill `Question.topicId`.
7. Run script against local database.
8. Verify counts in SQL and Admin Database page.

---

## Task 4: Add Admin Curriculum page

**Objective:** Give non-developer visibility into subjects, curricula, topics, and migration status.

**Files:**

- Create: `src/app/admin/curriculum/page.tsx`
- Modify: `src/components/app-shell.tsx`
- Add repository helpers under `src/lib/admin/`

**Page should show:**

- current curricula;
- subject list and active flags;
- topic counts by subject;
- questions with normalized subject/topic missing;
- next safe migration step.

**Steps:**

1. Add repository query helper.
2. Add admin route using `requireAdmin()` through existing `AppShell` admin mode.
3. Add sidebar link `課程管理`.
4. Run:

```bash
npm run lint
npm test
npm run build
```

---

## Task 5: Gradually migrate read paths to normalized subjects

**Objective:** Begin using `Subject` data without breaking old URLs or filters.

**Files:**

- Modify: `src/lib/site-config.ts`
- Modify: paper/admin repositories as needed
- Modify: subject filter components/pages

**Rules:**

- Public URLs may keep `?subject=math` codes.
- Backend should resolve code → `Subject.id` when possible.
- If normalized subject is missing, fallback to legacy string fields.
- Do not remove `subjects` constants until pages can load subjects from DB or a central resolver.

---

## Task 6: Prepare for canonical question bank

**Objective:** Document and test the next migration before adding `PaperQuestion`.

**Files:**

- Update: `docs/DATABASE_MAP.md`
- Create: `docs/plans/YYYY-MM-DD-question-bank-migration.md`

**Decisions to lock before implementation:**

- Does `Question` become canonical directly, or do we introduce `QuestionBankItem` and later merge?
- How do we snapshot old answers for historical attempts?
- What is the admin review workflow for AI-generated drafts?

---

## Verification Checklist Before Push

Run from `apps/web`:

```bash
npx prisma validate
npm run lint
npm test
npm run build
```

Run from repo root:

```bash
git diff --check
git status --short
```

After push:

```bash
gh run watch <run-id> --repo chengho1016/primary-exam-platform --exit-status
npx vercel inspect <latest-deployment-url> --timeout 120s
```

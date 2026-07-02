# Primary Exam Long-Term Architecture Roadmap

Last updated: 2026-07-02

This document is the architecture charter for Primary Exam. Future database schema, APIs, backend logic, admin UI, AI features, and commercial workflows must follow this direction.

## Product Positioning

Primary Exam is not just an online quiz website. It is intended to become a long-term learning platform for Hong Kong primary-school students and parents.

The platform must support:

- high-quality practice content;
- parents managing multiple children;
- students doing online practice and watermarked print practice;
- durable learning history;
- AI recommendations based on student ability;
- complete admin management of content and learning materials without app redeployment;
- commercial operation, subscription, entitlement, and audit workflows.

Highest principle:

> Primary Exam must be maintainable, extensible, and commercially operable. New content and learning structures should be added through data and admin workflows, not hard-coded application changes.

---

## Current Core Models to Preserve

The current schema direction is correct and should be preserved while normalized layers are added around it:

- `User`
- `ChildProfile`
- `Paper`
- `Question`
- `Attempt`
- `AttemptAnswer`
- `WrongBookItem`
- `PrintJob`
- `Subscription`
- `PaperEntitlement`
- `Session`
- `AdminAuditLog`

Do not replace these with a big-bang migration. Add normalized models side-by-side, backfill safely, then migrate reads/writes one flow at a time.

---

## Four Platform Areas

## 1. Parent Platform

Parents should be able to:

- manage multiple children;
- view learning reports;
- buy or unlock papers;
- manage membership;
- view print history;
- receive AI learning suggestions.

## 2. Student Platform

Students should be able to:

- do online practice;
- receive daily AI-recommended practice;
- view and redo wrong-book questions;
- view performance analysis;
- print watermarked practice papers without direct access to original PDFs.

Important wording: browsers cannot technically prevent screenshots or print-to-PDF. The system goal is **no direct original PDF download**, plus signed, short-lived, watermarked, audited print access.

## 3. Admin Platform

Admins should be able to manage:

- subjects;
- curricula;
- topics and knowledge points;
- papers;
- canonical question bank items;
- paper-question composition;
- learning materials;
- users and memberships;
- subscription/payment records;
- analytics;
- AI-generated drafts and AI-assisted cleanup.

All content should be manageable through admin workflows. Core scoring, payment webhook behavior, security policy, and permission checks remain code-reviewed and version-controlled.

## 4. AI Learning System

AI is not a chatbot add-on. It should become a learning-intelligence layer that can:

- recommend today’s practice;
- analyze weak topics;
- recommend the next paper or practice template;
- generate practice sets from the question bank;
- draft new questions for admin review;
- generate learning reports.

AI-generated content must never be published directly. It must go through:

```text
AI Draft → Admin Review → Published Question / Practice Template / Report
```

---

## Long-Term Normalized Data Model

## Subject

Hong Kong primary subjects should not be hard-coded. The current target subjects are:

- 中文
- 英文
- 數學
- 人文
- 科學

Add a `Subject` table:

```text
Subject
- id
- code
- nameZh
- nameEn
- displayOrder
- isActive
- createdAt
- updatedAt
```

`Paper`, `Question`, `PracticeTemplate`, and `LearningReport` should gradually reference `subjectId`. Keep legacy string fields until production data and repository reads are safely migrated.

## Curriculum

Curriculum enables future regional expansion:

```text
Curriculum → Grade → Subject → Topic → KnowledgePoint → Question
```

Examples:

- Hong Kong
- Macau
- Taiwan
- Singapore

Add:

```text
Curriculum
- id
- code
- nameZh
- nameEn
- regionCode
- isActive
- createdAt
- updatedAt
```

## Topic and KnowledgePoint

Topic must not remain free text. AI recommendation and practice generation depend on controlled taxonomy.

Suggested hierarchy:

```text
Subject
  → Topic
      → KnowledgePoint
```

Examples:

```text
數學
- 加法
- 減法
- 分數
- 百分比
- 幾何

中文
- 閱讀理解
- 詞語
- 修辭
- 文言文
```

Suggested fields:

```text
Topic
- id
- subjectId
- parentTopicId
- code
- nameZh
- nameEn
- displayOrder
- isActive

KnowledgePoint
- id
- topicId
- code
- nameZh
- nameEn
- description
- displayOrder
- isActive
```

---

## Canonical Question Bank Direction

Currently `Question` belongs to one `Paper`. Long-term, `Question` should become the canonical question bank item, and `PaperQuestion` should describe how a paper uses it.

Target shape:

```text
Question              # canonical question bank item
PaperQuestion         # join table: paper-specific number, section, marks, order
Paper                 # exam/paper source
PracticeTemplate      # reusable generation rule
GeneratedPractice     # concrete generated practice set
GeneratedPracticeQuestion
```

One question should be reusable by:

- multiple papers;
- AI daily practice;
- wrong-book review;
- generated worksheets;
- mock exams.

Do this gradually. Do not remove `Question.paperId` until all current flows have been migrated and production data is backfilled.

---

## Question Metadata Required for AI

Future canonical questions should support:

- curriculum;
- grade;
- subject;
- topic;
- subtopic;
- knowledge point;
- difficulty;
- Bloom level;
- AI generated flag;
- AI model and prompt version;
- created by;
- reviewed by;
- last updated;
- usage count;
- correct rate;
- average answer time.

Analytics fields such as usage count, correct rate, and average answer time should preferably be derived or cached from attempt data, not manually edited as primary truth.

---

## Content Versioning Rule

Historical attempts must not change when a question is edited.

Before heavy editing and canonical question-bank migration, add one of these protections:

1. `QuestionVersion` / `AnswerRuleVersion`; or
2. snapshot fields on `AttemptAnswer` such as:
   - `questionSnapshot`
   - `answerRuleSnapshot`
   - `marksSnapshot`
   - `topicSnapshot`

This is critical for parent trust, learning reports, and future customer support.

---

## Practice Template

Add `PracticeTemplate` after Subject/Topic/KnowledgePoint are stable.

Example:

```text
P4 + 數學 + 分數 + 20 questions + normal difficulty
```

A parent should eventually be able to click once and create a new practice for a child.

Suggested target models:

```text
PracticeTemplate
- id
- curriculumId
- grade
- subjectId
- topicId
- knowledgePointId
- questionCount
- difficulty
- title
- isActive

GeneratedPractice
GeneratedPracticeQuestion
```

---

## Learning Report and Mastery Model

Learning reports should be generated from durable attempt facts, not manually typed data.

Separate:

```text
Attempt / AttemptAnswer          # source-of-truth events
LearningReport                   # report snapshot for parent/student UI
TopicMastery                     # long-term aggregate ability model
RecommendationSnapshot           # what the AI recommended and why
```

Each completed practice can generate:

- topic scores;
- accuracy;
- time spent;
- AI comment;
- recommended next practice;
- weak-topic list;
- wrong-book review suggestions.

---

## Wrong Book Direction

Keep `WrongBookItem`, but extend it into spaced repetition.

Future fields:

```text
reviewCount
lastReviewedAt
masteredAt
nextReviewDate
easeFactor
status
sourceAttemptAnswerId
```

Target behavior:

- today’s review queue;
- 3-day / 7-day / 14-day recurrence;
- mark mastered;
- reset schedule when student gets it wrong again.

---

## Print System Direction

Keep `PrintJob`; it is a good foundation.

Future fields:

```text
deviceId
ipAddress
downloadCount
pdfVersion
userAgent
```

Security posture:

- do not expose permanent original PDF URLs;
- use signed short-lived print authorization;
- embed watermark with user/date/job ID;
- log print and preview events;
- rate-limit excessive print attempts.

---

## Commerce Direction

Keep `Subscription` and `PaperEntitlement`, then expand commerce in layers.

Target models:

```text
Plan
Price
Subscription
Payment
Invoice
Refund
PaperEntitlement
```

Rationale:

- `Subscription` = access state;
- `Payment` = money movement;
- `Invoice` = accounting/customer record;
- `PaperEntitlement` = per-paper unlock;
- `Plan` / `Price` = product catalog that can change over time.

---

## Security and Backend Rules

- All data operations must go through backend routes/actions with server-side permission checks.
- Never trust UI hiding for admin or ownership protection.
- Keep HttpOnly session cookies and database token hashes.
- Admin changes must write `AdminAuditLog`.
- Future Neon Data API usage must include strict authorization and, where suitable, Row Level Security.
- AI-generated output must be treated as draft data until reviewed.

---

## Version Roadmap

## Version 1: Core Learning Platform

- parent login;
- child management;
- paper listing;
- online practice;
- watermarked print;
- wrong book;
- basic parent report;
- admin paper/question/user management;
- commercial MVP manual membership activation.

## Version 1.5: Safe Data Normalization Foundation

This version is required before serious AI recommendation.

- add `Subject`;
- add `Curriculum`;
- add `Topic`;
- add `KnowledgePoint`;
- add nullable references beside existing string fields;
- backfill current production data;
- add admin management pages;
- add tests for mapping/backfill;
- preserve existing user-facing flows after every commit.

## Version 2: AI Recommendation and Generated Practice

- topic mastery model;
- learning report snapshots;
- AI next-practice recommendation;
- practice templates;
- generated practice sets;
- wrong-book spaced repetition.

## Version 3: Full Commercial Education Platform

- formal payment provider integration;
- invoice/refund handling;
- AI-generated question drafts;
- admin review workflow;
- mobile app/API hardening;
- multi-region curriculum support;
- large-scale object storage and content pipeline.

---

## Non-Negotiable Implementation Rules

1. Do not perform a big-bang migration.
2. Add normalized tables side-by-side with legacy fields.
3. Backfill existing production data safely.
4. Keep existing user-facing flows working after every commit.
5. Every schema change must include repository-layer updates or compatibility proof.
6. Admin UI must exist for any model that non-developers need to manage.
7. Add tests for pure logic and route behavior where possible.
8. Run `npx prisma validate`, lint, tests, and production build before deploy.
9. AI-generated content must never be published without admin review.
10. Historical attempts must not change when questions are edited.

---

## Immediate Next Implementation Sequence

1. Create `Subject`, `Curriculum`, `Topic`, and `KnowledgePoint` tables.
2. Add nullable `subjectId` / `curriculumId` / `topicId` / `knowledgePointId` references without removing legacy text fields.
3. Seed default Hong Kong curriculum and subjects: Chinese, English, Math, Humanities, Science.
4. Backfill math topics from current `Question.topic` values.
5. Add Admin curriculum/taxonomy overview page.
6. Gradually migrate filters and admin forms to use normalized IDs while preserving legacy strings.
7. Only after this foundation is stable, start `PaperQuestion` and canonical question-bank migration.

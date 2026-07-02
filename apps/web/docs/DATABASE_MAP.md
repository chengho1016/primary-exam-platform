# Database Map

Last updated: 2026-07-02

This document explains the current Prisma schema in plain language. It is intentionally written as an operator/developer map, not as an ORM reference.

## Current schema source

- Prisma schema: `apps/web/prisma/schema.prisma`
- Generated client: `apps/web/src/generated/prisma/`
- Main DB access wrapper: `apps/web/src/lib/db/prisma.ts`

## Naming conventions and current caveats

### Important caveat: file fields are not normalized yet

The current schema stores several file-related concepts directly on `Paper` / `Question`:

| Field | Current meaning | Caveat |
|---|---|---|
| `Paper.sourceAssetPath` | Admin-uploaded original PDF/image, currently stored as a base64 data URI: `data:<mime>;base64,...` | Name says `Path`, but the value is often not a path. Treat as a legacy name. |
| `Paper.printablePdfPath` | Legacy/prepared printable asset path for content-pack papers | Older print flow only checked this field; uploaded papers must also use `sourceAssetPath`. |
| `Question.assetPath` | Question image path, usually from the seeded content pack | Served through `/api/question-image/[paperId]/[filename]`. |
| `Question.stimulusPath` | Shared chart/table/image for a group of questions | Same serving route as `assetPath`. |

Long-term direction: introduce an `Asset` / `FileAsset` table and migrate these fields gradually. Do not add more permanent file fields to `Paper` unless there is a short-term reason.

### Important caveat: topic fields are not normalized yet

`Question.topic` and `Question.subtopic` are currently plain strings. This is fast for seed data but fragile for a large topic-based question bank.

Examples that would currently become different topics:

- `分數`
- `分 數`
- `分數計算`
- `Fraction`

Current Admin mitigation before adding a real topic schema:

- `/admin/topics` is the first-version **math-only** topic management page.
- It reads all `Question.topic` / `Question.subtopic` values for papers where `Paper.subject = "數學"`.
- It normalizes obvious spacing issues for display (for example `分 數` → `分數`).
- Admin can rename a topic; renaming to an existing topic intentionally merges those questions.
- The page shows 30-question worksheet readiness, but it does **not** create generated worksheets yet.

Long-term direction: introduce `Topic` and `QuestionTopic` tables so Admin users choose controlled topics instead of free-typing. Keep the current string fields until existing production data has been migrated.

---

## Enums

### `UserRole`

| Value | Meaning |
|---|---|
| `PARENT` | Normal user / parent account |
| `ADMIN` | Admin account with backend access |

### `PaperStatus`

| Value | Meaning | Frontend implication |
|---|---|---|
| `DRAFT` | Newly uploaded / being prepared | Not visible in public paper list |
| `REVIEW` | Ready for admin review | Not public yet |
| `PUBLISHED` | Live | Visible and usable if access rules pass |
| `ARCHIVED` | Hidden / retired | Should not be offered to users |

### `PaperAccess`

| Value | Meaning |
|---|---|
| `FREE` | Any logged-in user can access |
| `MEMBERSHIP` | Requires active subscription or entitlement |
| `PURCHASE` | Requires per-paper entitlement / purchase |

### `QuestionType`

| Value | Current UI mapping |
|---|---|
| `MULTIPLE_CHOICE` | Option buttons |
| `NUMBER` | Text input with `inputMode="decimal"` on mobile |
| `TEXT` | Text input with `inputMode="text"`; allows Chinese answers such as `正方形` |
| `WORKED_RESPONSE` | Text input with `inputMode="text"`; suitable for longer written answers |

Mapping lives in:

- `src/lib/practice/question-type.ts`

Regression test:

- `src/lib/practice/question-type.test.ts`

### `AttemptStatus`

| Value | Meaning |
|---|---|
| `IN_PROGRESS` | Started but not submitted |
| `COMPLETED` | Submitted and scored |

### `SubscriptionStatus`

| Value | Meaning |
|---|---|
| `TRIAL` | Trial membership |
| `ACTIVE` | Paid/active membership |
| `PAST_DUE` | Payment issue |
| `CANCELLED` | Cancelled |

### `PrintJobStatus`

| Value | Meaning |
|---|---|
| `CREATED` | Print authorization created but not yet consumed |
| `PRINTED` | Print route has been requested |
| `EXPIRED` | Reserved for cleanup/expiry state; current checks rely on `expiresAt` |

---

## Models

## `User`

Represents a parent or admin account.

Important fields:

| Field | Meaning |
|---|---|
| `email` | Unique login email |
| `passwordHash` | Hashed password, never store plaintext |
| `displayName` | UI name |
| `role` | `PARENT` or `ADMIN` |

Relations:

- `children`: child profiles owned by parent
- `authoredPapers`: papers uploaded/created by admin
- `subscriptions`: membership records
- `entitlements`: per-paper access records
- `printJobs`: print authorizations
- `sessions`: active login sessions

Operational notes:

- Admin access must be checked server-side using session/role helpers.
- Do not trust client-side route hiding for admin protection.
- Admin users can now create accounts and reset passwords through `/admin/users`; passwords are bcrypt hashed and every change is audit-logged.

---

## `Session`

Stores login sessions.

Important fields:

| Field | Meaning |
|---|---|
| `tokenHash` | Hash of the browser session token |
| `expiresAt` | Expiry time |

Notes:

- Browser should store only an HttpOnly cookie.
- DB stores token hashes, not raw tokens.

---

## `ChildProfile`

A child/student under a parent account.

Important fields:

| Field | Meaning |
|---|---|
| `parentId` | Owner user |
| `displayName` | Child display name |
| `grade` | Primary grade number |

Relations:

- `attempts`: completed/in-progress practices
- `wrongBookItems`: wrong-book entries

---

## `Paper`

Represents a paper/exam source. A paper can be uploaded by Admin, published, practiced online, and printed.

Important fields:

| Field | Meaning |
|---|---|
| `code` | Unique paper code shown to Admin/users |
| `title` | Paper title |
| `grade` | Primary grade number |
| `subject` | Subject text, e.g. `數學` |
| `academicYear` | Optional school year |
| `status` | Draft/review/published/archive workflow |
| `access` | Free/membership/purchase access rule |
| `sourceAssetPath` | Current uploaded source PDF/image data URI or legacy source pointer |
| `printablePdfPath` | Legacy prepared printable PDF/path |
| `pageCount` | Total pages if known |
| `durationMinutes` | Suggested practice/exam time |
| `totalMarks` | Total marks if known |

Current print rule:

```ts
canPrint = Boolean(paper.printablePdfPath || paper.sourceAssetPath)
```

Current public visibility rule:

- Public/user pages should only show `PUBLISHED` papers.
- Admin can see all statuses.

Known cleanup needed:

- Split file data into an `Asset` table.
- Avoid storing large PDFs as base64 in DB long-term.

---

## `Question`

A structured question under a `Paper`.

Important fields:

| Field | Meaning |
|---|---|
| `paperId` | Source paper |
| `number` | Question number inside paper; unique per paper |
| `section` | Paper section label |
| `marks` | Marks assigned |
| `sourcePage` | Page number in original source if known |
| `type` | `MULTIPLE_CHOICE`, `NUMBER`, `TEXT`, `WORKED_RESPONSE` |
| `stem` | Question text / accessible prompt |
| `options` | JSON options for multiple-choice questions |
| `answerRule` | JSON answer definition/validator |
| `explanation` | Optional explanation |
| `topic` | Free-text topic, pending normalization |
| `subtopic` | Free-text subtopic, pending normalization |
| `difficulty` | String difficulty, pending enum normalization |
| `assetPath` | Optional image for this question |
| `stimulusPath` | Optional shared image/chart/table |
| `onlineEligible` | Whether this question can be used in online practice |
| `reviewStatus` | String review state, currently values such as `pending` / `verified...` |

Online practice filter:

```ts
where: {
  paperId,
  onlineEligible: true,
  reviewStatus: { startsWith: "verified" }
}
```

Known cleanup needed:

- Normalize `topic` into `Topic` / `QuestionTopic`.
- Normalize `difficulty` into enum.
- Normalize `reviewStatus` into enum.
- Introduce an `autoWorksheetEligible` flag when custom worksheets are implemented.

---

## `Attempt`

A practice session for a child on a paper.

Important fields:

| Field | Meaning |
|---|---|
| `childId` | Child/student |
| `paperId` | Paper practiced |
| `status` | In progress or completed |
| `score` | Awarded score |
| `maximumMark` | Maximum possible score |
| `startedAt` | Start time |
| `completedAt` | Submit time |

---

## `AttemptAnswer`

An answer inside an `Attempt`.

Important fields:

| Field | Meaning |
|---|---|
| `attemptId` | Practice session |
| `questionId` | Answered question |
| `response` | JSON response payload |
| `isCorrect` | Boolean result if graded |
| `awardedMark` | Awarded marks if graded |
| `answeredAt` | Answer timestamp |

Constraint:

- Unique `(attemptId, questionId)` prevents duplicate answers for the same attempt/question.

---

## `WrongBookItem`

Tracks wrong questions for a child.

Important fields:

| Field | Meaning |
|---|---|
| `childId` | Child/student |
| `questionId` | Wrong question |
| `incorrectCount` | Number of times answered wrong |
| `resolvedAt` | Set when resolved |
| `lastWrongAt` | Last wrong timestamp |

Constraint:

- Unique `(childId, questionId)` gives one wrong-book row per child/question.

---

## `Subscription`

Membership/subscription state for a user.

Important fields:

| Field | Meaning |
|---|---|
| `providerCustomerId` | Payment provider customer ID |
| `providerPlanId` | Payment provider plan ID |
| `status` | Trial/active/past_due/cancelled |
| `printAllowance` | Print allowance count |
| `periodStartsAt` / `periodEndsAt` | Subscription period |

Current caveat:

- Payment provider integration is not fully wired yet.

---

## `PaperEntitlement`

Per-paper access and print allowance for a user.

Important fields:

| Field | Meaning |
|---|---|
| `userId` | User |
| `paperId` | Paper |
| `printAllowance` | Allowed print count |
| `expiresAt` | Optional expiry |
| `purchasedAt` | Purchase/entitlement creation time |

Constraint:

- Unique `(userId, paperId)`.

---

## `PrintJob`

A short-lived print authorization.

Important fields:

| Field | Meaning |
|---|---|
| `authorization` | Public-ish job token in URL query string |
| `watermarkText` | Watermark text bound to user/date/job |
| `status` | Created/printed/expired |
| `expiresAt` | Expiry time |
| `printedAt` | First print-source/print-page access time |

Security notes:

- A print URL should not work without login.
- A print URL should not work for another user.
- A print URL should expire.
- Uploaded source PDFs are served by `/api/print-source/[paperId]` only after these checks.

---

## `AdminAuditLog`

Admin operation audit log.

Important fields:

| Field | Meaning |
|---|---|
| `adminId` | Admin user who acted |
| `action` | Action name, e.g. create/update/publish |
| `entityType` | Entity category |
| `entityId` | Entity ID |
| `metadata` | Optional JSON details |

Current caveat:

- Data is written, but a full audit log UI is still pending.

---

# Proposed future schema additions

## `Topic`

For controlled topic taxonomy.

```prisma
model Topic {
  id        String   @id @default(cuid())
  subject   String
  grade     Int?
  name      String
  slug      String   @unique
  parentId  String?
  parent    Topic?   @relation("TopicTree", fields: [parentId], references: [id])
  children  Topic[]  @relation("TopicTree")
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## `QuestionTopic`

Allows one question to belong to multiple topics.

```prisma
model QuestionTopic {
  questionId String
  topicId    String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  topic      Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([questionId, topicId])
}
```

## `Asset`

For normalized file storage.

```prisma
enum AssetStorageType {
  DB_DATA_URI
  OBJECT_STORAGE
  LOCAL_CONTENT
}

enum AssetPurpose {
  PAPER_SOURCE
  PAPER_PRINTABLE
  QUESTION_IMAGE
  QUESTION_STIMULUS
  ANSWER_IMAGE
}

model Asset {
  id          String           @id @default(cuid())
  ownerType   String
  ownerId     String
  purpose     AssetPurpose
  mimeType    String
  storageType AssetStorageType
  dataUri     String?
  objectKey   String?
  publicUrl   String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([ownerType, ownerId, purpose])
}
```

## `GeneratedWorksheet`

For the future custom worksheet feature.

```prisma
model GeneratedWorksheet {
  id            String   @id @default(cuid())
  userId        String
  grade         Int
  subject       String
  questionCount Int
  createdAt     DateTime @default(now())
  questions     GeneratedWorksheetQuestion[]
}

model GeneratedWorksheetQuestion {
  worksheetId String
  questionId  String
  order       Int

  @@id([worksheetId, questionId])
  @@index([worksheetId, order])
}
```

---

# Refactor order recommendation

1. Add documentation and Admin status visibility first.
2. Add `Topic` / `QuestionTopic` while keeping legacy `Question.topic` for migration.
3. Add `Asset` while keeping legacy file fields until all routes are migrated.
4. Add custom worksheet generation only after topics and assets are stable.

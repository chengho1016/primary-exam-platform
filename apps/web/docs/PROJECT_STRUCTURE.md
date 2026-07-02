# Project Structure

Last updated: 2026-07-02

This document explains where code lives and how to add new features without making the project harder to navigate.

## Repository layout

```text
primary-exam-platform/
├── README.md
├── package.json                  # root package for Vercel detection/workaround
├── package-lock.json             # npm lock used by Vercel/root audit
├── content/                      # source content packs / local PDF assets
└── apps/
    └── web/                      # main Next.js app
        ├── README.md
        ├── package.json
        ├── package-lock.json     # npm lock for Vercel-style install
        ├── pnpm-lock.yaml        # local development lock
        ├── pnpm-workspace.yaml   # pnpm settings/overrides
        ├── prisma/
        ├── scripts/
        ├── docs/
        └── src/
```

## Main app layout

```text
apps/web/src/
├── app/                          # Next.js App Router pages, layouts, routes, server actions
├── components/                   # React components shared across routes
├── generated/prisma/             # generated Prisma client
└── lib/                          # domain logic, repository functions, auth, db helpers
```

---

# `src/app`

`src/app` owns URL structure and request entry points. Keep route files thin where possible; push reusable business logic into `src/lib`.

Current major areas:

| Path | Purpose |
|---|---|
| `app/page.tsx` | public landing page |
| `app/login`, `app/register` | auth pages |
| `app/dashboard` | parent/student dashboard |
| `app/papers` | user paper listing and detail pages |
| `app/practice/[paperId]` | online practice page |
| `app/print/[paperId]` | print preview page |
| `app/wrong-book` | wrong-book page |
| `app/parent` | parent learning report |
| `app/membership` | membership/access page |
| `app/admin` | admin dashboard, papers, questions, math topics, users |
| `app/api/*` | route handlers for upload, print source/pages, practice completion, question images |

## App Router conventions

- Use `page.tsx` for route UI.
- Use `layout.tsx` for route grouping layout.
- Use `route.ts` for API routes.
- Use `actions.ts` only for server actions that are reliable in production.
- Avoid large business logic inside page files.

## Important production caveat

Admin upload should use API route + client `fetch`, not a Server Action form submission. Next.js 16 Server Action ID mismatch caused Vercel production failures.

Current upload route:

```text
src/app/api/admin/papers/route.ts
```

Current upload component:

```text
src/components/admin-new-paper-form.tsx
```

---

# `src/components`

Shared React components currently live in one folder.

Important files:

| File | Purpose |
|---|---|
| `app-shell.tsx` | shared app/admin shell |
| `auth-forms.tsx` | login/register UI |
| `paper-card.tsx` | paper listing cards |
| `practice-session.tsx` | client-side practice UI |
| `print-preview.tsx` | print preview UI for page-image and uploaded-source modes |
| `admin-new-paper-form.tsx` | Admin upload form |
| `ui.tsx` | small UI primitives |
| `icons.tsx` | icons |

## Current issue

The folder is still manageable, but it is flat. As features grow, split by domain.

Recommended future structure:

```text
src/features/
├── admin/
│   ├── components/
│   └── actions/
├── papers/
│   ├── components/
│   └── repositories/
├── practice/
│   ├── components/
│   └── logic/
├── print/
│   ├── components/
│   └── routes/
└── worksheets/
    ├── components/
    └── logic/

src/components/ui/
```

Do not do this as a huge refactor unless tests are in place. Move one domain at a time.

---

# `src/lib`

`src/lib` owns reusable server/domain logic.

Current folders:

| Path | Purpose |
|---|---|
| `lib/admin` | Admin repositories, presentation helpers, and math topic insight helpers |
| `lib/auth` | session, password, permissions, entitlements |
| `lib/db` | Prisma client wrapper |
| `lib/domain` | shared domain types |
| `lib/learning` | parent/dashboard learning data |
| `lib/papers` | paper listing/detail repository |
| `lib/practice` | practice question selection, grading, question type mapping |
| `lib/site-config.ts` | site constants |

## Rules of thumb

- DB queries should live in repository-style files under `lib/*`.
- Pure logic should be kept testable and not import `server-only`.
- If a helper is needed by UI and tests, keep it in a pure module.
- Avoid importing route files into tests unless route behavior is being tested directly.

Example of good split from recent admin topic-management work:

```text
src/app/admin/topics/page.tsx        # route UI for math topic management
src/lib/admin/topic-insights.ts      # pure topic normalization/readiness logic
src/lib/admin/topic-insights.test.ts # regression tests for grouping/readiness
src/app/admin/actions.ts             # server action for math topic rename/merge
```

Example of good split from recent mobile-answer fix:

```text
src/lib/practice/question-type.ts       # pure mapping helpers
src/lib/practice/question-type.test.ts  # regression tests
src/lib/practice/practice-repository.ts # DB mapping uses helper
src/components/practice-session.tsx     # UI uses helper for inputMode
```

---

# `prisma`

```text
apps/web/prisma/
├── schema.prisma
└── seed.ts / seed scripts
```

Schema documentation:

```text
docs/DATABASE_MAP.md
```

Current schema is functional but not fully normalized for future topic-based worksheets.

Near-term DB cleanup direction:

1. Add `Topic` and `QuestionTopic`.
2. Add `Asset`.
3. Add generated worksheet models.
4. Later migrate old string/file fields.

Do not remove legacy fields until existing production data is migrated.

---

# `docs`

Current docs:

| File | Purpose |
|---|---|
| `ARCHITECTURE.md` | high-level app architecture |
| `DATABASE_MAP.md` | table/field map and future schema direction |
| `UPLOAD_AND_PRINT_FLOW.md` | Admin upload, print authorization, PDF/image delivery flow |
| `PROJECT_STRUCTURE.md` | code layout and contribution rules |

When fixing a production bug, update the relevant doc if the bug reveals a lasting rule.

Examples:

- Vercel upload body limit → update `UPLOAD_AND_PRINT_FLOW.md`.
- New topic schema → update `DATABASE_MAP.md`.
- Moving components → update `PROJECT_STRUCTURE.md`.

---

# Package manager and deployment rules

## Local development

Use pnpm locally:

```bash
cd apps/web
corepack pnpm install
corepack pnpm dev
```

## Vercel / CI path

Use npm for Vercel-style install/build:

```bash
npm ci --legacy-peer-deps
npm run lint
npm test
npm run build
```

Do not delete npm lockfiles just because local development uses pnpm.

Why both exist:

| File | Used by |
|---|---|
| `apps/web/pnpm-lock.yaml` | local pnpm development |
| `apps/web/package-lock.json` | Vercel/npm install stability |
| `package-lock.json` | root npm audit / Vercel root workaround |

---

# Git and generated files

## Commit these

- `src/**`
- `prisma/schema.prisma`
- `prisma/migrations/**` if migrations are used
- `docs/**`
- lockfiles used by CI/Vercel
- tests

## Be careful with these

- `content/**/*.pdf`: commit only if intentionally part of a content pack.
- generated Prisma files: this project currently keeps `src/generated/prisma`; do not delete without checking build path.
- local data directories such as `.data/postgres`: never commit.

Current known untracked file at time of writing:

```text
content/p4-math-2324-test3/print/四-一考_數學(TT2324).pdf
```

Do not add it automatically unless it is meant to be part of the repo.

---

# Recommended feature workflow

For new features:

1. Read related docs in `apps/web/docs/`.
2. Identify whether change is route/UI/domain/DB.
3. Add or update tests for the logic.
4. Run:

```bash
cd apps/web
npm run lint
npm test
npx prisma validate
npm run build
```

5. Commit and push.
6. Confirm GitHub Actions success.
7. Confirm Vercel deployment is Ready.

For user-reported production bugs:

1. Reproduce the real UI flow where possible.
2. Do not rely only on direct API calls.
3. Fix the smallest root cause.
4. Add regression test if possible.
5. Update docs/skill if the bug reveals a reusable lesson.

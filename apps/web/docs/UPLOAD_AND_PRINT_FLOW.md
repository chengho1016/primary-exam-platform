# Upload and Print Flow

Last updated: 2026-07-01

This document explains how Admin upload, paper publication, user print authorization, and PDF/image delivery currently work.

## Key routes and files

| Area | File / route |
|---|---|
| Admin upload page | `src/app/admin/papers/new/page.tsx` |
| Admin upload component | `src/components/admin-new-paper-form.tsx` |
| Upload API route | `src/app/api/admin/papers/route.ts` |
| Paper repository / print mode mapping | `src/lib/papers/paper-repository.ts` |
| Create print job action | `src/app/print/actions.ts` |
| Print page | `src/app/print/[paperId]/page.tsx` |
| Print preview component | `src/components/print-preview.tsx` |
| Legacy page-image print route | `src/app/api/print-page/[paperId]/[pageNumber]/route.ts` |
| Uploaded source print route | `src/app/api/print-source/[paperId]/route.ts` |
| Question image route | `src/app/api/question-image/[paperId]/[filename]/route.ts` |

---

## Current upload storage strategy

Admin uploads are currently stored in PostgreSQL as base64 data URIs:

```text
data:<mime-type>;base64,<payload>
```

The value is stored in:

```text
Paper.sourceAssetPath
```

Important naming caveat: despite the field name ending in `Path`, this value is often not a filesystem path. Treat the name as legacy.

## Why uploads are limited to about 4MB

Vercel Functions have a request/response body limit of roughly 4.5MB. Because the current upload route accepts `multipart/form-data` through a Next.js API Route and then stores base64 in the database, large PDFs cannot be reliably supported.

Current product rule:

- Uploads are limited to 4MB.
- The UI must show file name, type, and size after selection.
- The UI must reject files over 4MB before attempting upload.
- The API must also reject files over 4MB.

Long-term fix: direct-to-object-storage upload using Vercel Blob, Cloudflare R2, Supabase Storage, or S3-compatible storage.

---

# Admin upload flow

## 1. Admin opens upload page

```text
GET /admin/papers/new
```

Page:

```text
src/app/admin/papers/new/page.tsx
```

Component:

```text
src/components/admin-new-paper-form.tsx
```

The component uses client-side form submission. It does not use Server Actions for upload because Next.js 16 Server Action IDs caused production issues on Vercel.

## 2. Admin selects a file

The UI must display:

- File name
- MIME type
- File size
- Error if file is over 4MB

This prevents the previous UX bug where the dropzone stayed visually blank after selecting a file.

## 3. Admin submits form

Client sends:

```ts
fetch("/api/admin/papers", {
  method: "POST",
  body: formData,
})
```

## 4. API route validates and stores

Route:

```text
POST /api/admin/papers
```

File:

```text
src/app/api/admin/papers/route.ts
```

Expected server checks:

1. `requireAdmin()` must pass.
2. Required fields must exist.
3. File must exist.
4. File must be PDF/PNG/JPEG.
5. File must be <= 4MB.
6. File is converted to base64 data URI.
7. `Paper` row is created with `status = DRAFT`.
8. `AdminAuditLog` is written.
9. JSON response returns the edit URL.

Typical response:

```json
{
  "success": true,
  "paperId": "...",
  "redirectTo": "/admin/papers/<paperId>/edit?created=1"
}
```

## 5. Admin publishes paper

Newly uploaded papers start as `DRAFT`. They are not shown publicly until published.

Current status flow in Admin list:

```text
DRAFT → REVIEW → PUBLISHED → ARCHIVED → DRAFT
```

If a user says an uploaded paper is not visible on the frontend, check status first.

---

# User print flow

## Two print modes

The system currently supports two print modes.

| Mode | Source | Used for |
|---|---|---|
| `pages` | Pre-rendered page images via `/api/print-page/[paperId]/[pageNumber]` | Original seeded content pack |
| `source` | Uploaded PDF/image via `/api/print-source/[paperId]` | Admin-uploaded papers |

Mapping lives in:

```text
src/lib/papers/paper-repository.ts
```

Current rule:

```ts
canPrint = Boolean(paper.printablePdfPath || paper.sourceAssetPath)
printMode = paper.printablePdfPath ? "pages" : "source"
```

## 1. User opens paper detail page

```text
GET /papers/[paperId]
```

The page uses paper details from:

```text
src/lib/papers/paper-repository.ts
```

It should show the print button when:

- the paper is `PUBLISHED`, and
- the user has access, and
- `canPrint` is true.

## 2. User creates print job

Action:

```text
src/app/print/actions.ts
```

The action checks:

1. User is logged in.
2. User has paper access.
3. Paper is `PUBLISHED`.
4. Paper has `printablePdfPath` or `sourceAssetPath`.
5. Create `PrintJob` with short expiry and watermark text.
6. Redirect to `/print/[paperId]?job=<authorization>`.

## 3. Print page loads

Page:

```text
src/app/print/[paperId]/page.tsx
```

It loads:

- paper details
- print job by `authorization`, `paperId`, and expiry

If print job is missing/expired, redirect back to paper detail page.

## 4A. Legacy page-image mode

Component:

```text
src/components/print-preview.tsx
```

Route:

```text
/api/print-page/[paperId]/[pageNumber]?job=...
```

This mode:

- Reads per-page JPEGs from content pack.
- Adds watermark server-side using `sharp`.
- Returns protected JPEGs.

## 4B. Uploaded source mode

Component:

```text
src/components/print-preview.tsx
```

Route:

```text
/api/print-source/[paperId]?job=...
```

This mode:

- Checks the logged-in user.
- Checks print job authorization belongs to this user and paper.
- Reads `Paper.sourceAssetPath`.
- Parses base64 data URI.
- Returns PDF/image inline in a protected iframe.
- Marks print job as `PRINTED` on first access.

Security check:

Unauthenticated request should return:

```text
401 Unauthorized
```

---

# Common bugs and checks

## Bug: selected file does not show in Admin UI

Check:

```text
src/components/admin-new-paper-form.tsx
```

The component should track selected file state and render file name/size.

Do not validate upload only by direct browser-console `fetch('/api/admin/papers')`; that bypasses the real UI flow.

## Bug: upload hangs on real PDF

Likely cause: file larger than Vercel Function body limit.

Checks:

1. UI shows file size.
2. UI rejects > 4MB.
3. API route rejects > 4MB.
4. For larger production PDF support, implement direct object storage.

## Bug: uploaded paper has no print button

Checks:

1. Paper status is `PUBLISHED`.
2. `Paper.sourceAssetPath` exists.
3. `canPrint` checks `printablePdfPath || sourceAssetPath`.
4. Print action accepts either field.

## Bug: print URL publicly exposes PDF

Checks:

1. `/api/print-source/[paperId]` requires login.
2. It requires a valid `job` query param.
3. It checks `PrintJob.userId`, `paperId`, and `expiresAt`.
4. It returns `Cache-Control: private, no-store`.

---

# Future object storage migration plan

When ready to support large PDFs:

1. Create `Asset` table.
2. Add object storage provider.
3. Change Admin upload flow:
   - browser requests signed upload URL or direct client upload token
   - browser uploads PDF directly to storage
   - API receives metadata/object key only
4. Store object key/URL in `Asset`, not `Paper.sourceAssetPath`.
5. Change `/api/print-source/[paperId]` to stream from storage after authorization.
6. Keep DB base64 path as fallback for existing small uploads until migrated.

Do not remove current DB data URI support until existing uploaded papers are migrated.

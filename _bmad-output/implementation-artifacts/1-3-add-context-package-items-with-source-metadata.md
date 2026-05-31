---
baseline_commit: a26dd20c0647d174ac61d3740dee07a389a1370b
---

# Story 1.3: Add Context Package items with source metadata

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want to add files, pasted text, and structured notes to an Opportunity,
so that the system has a traceable body of source material for later scope analysis.

## Acceptance Criteria

1. **Given** an authenticated user with edit permission on an Opportunity  
   **When** they add a Context Package item by file upload, pasted text, or structured note entry  
   **Then** the item is attached to the Opportunity  
   **And** the system records its source type, uploader, and creation timestamp.

2. **Given** a file upload is in progress  
   **When** the Context Package view updates  
   **Then** the in-progress item remains visible in the ordered list with progress feedback  
   **And** the list does not jump unexpectedly.

3. **Given** a Context Package upload fails  
   **When** the failure is returned to the UI  
   **Then** the failed item remains visible in place with retry and remove actions  
   **And** the rest of the Context Package remains intact.

4. **Given** source files and structured entries are stored for an Opportunity  
   **When** persistence is implemented  
   **Then** structured metadata is stored in Firestore and file assets in Cloud Storage  
   **And** boundary validation is applied before the write completes.

## Tasks / Subtasks

- [x] Define Context Item Zod schema, TypeScript types, and test suite. (AC: 1, 4)
  - [x] Create `src/features/context-packages/schemas/context-item.ts` with `contextItemSchema` (full document shape), `addTextItemSchema` (text/note input), and `addFileItemSchema` (file upload metadata record).
  - [x] Source types: `"file" | "text" | "note"` — use `z.enum(["file","text","note"])`. Status: `"active" | "uploading" | "failed"` — store transiently in client state; only `"active"` records persist to Firestore.
  - [x] Required fields for all item types: `opportunityId`, `sourceType`, `uploaderId`, `title`, `createdAt`. Optional: `content` (text/note), `storageRef` (file), `storageBucket` (file), `mimeType` (file), `sizeBytes` (file).
  - [x] Create `src/features/context-packages/types.ts` exporting `ContextItem`, `AddTextItemInput`, `AddNoteItemInput`.
  - [x] Create `src/features/context-packages/schemas/context-item.test.ts` with unit tests for each schema.
- [x] Add Firebase Admin Storage singleton. (AC: 4)
  - [x] Create `src/lib/firebase/storage.ts` with `getAdminStorage()` following the singleton pattern from `src/lib/firebase/admin.ts` (use `getStorage(getAdminApp())` from `firebase-admin/storage`).
  - [x] Firestore subcollection path: `opportunities/{opportunityId}/contextItems/{itemId}` — use this as the canonical collection path throughout this story. Do NOT create a top-level `contextPackages` collection; that is deferred to Story 2.1 when package-level status is needed.
- [x] Implement the Firestore repository for Context Items. (AC: 1, 4)
  - [x] Create `src/features/context-packages/server/repository.ts` with:
    - `addContextItem(opportunityId, item)` — writes new item document to subcollection, returns itemId.
    - `listContextItems(opportunityId)` — queries all `active` items ordered by `createdAt` desc.
    - `deleteContextItem(opportunityId, itemId)` — hard-delete for failed item cleanup.
  - [x] All writes use `FieldValue.serverTimestamp()` for `createdAt`.
  - [x] Use `getAdminFirestore()` from `@/lib/firebase/firestore` (already exists from Story 1.2).
- [x] Implement Cloud Storage upload helper. (AC: 4)
  - [x] Create `src/features/context-packages/server/storage.ts` with:
    - `uploadContextFile(opportunityId, itemId, file: Buffer, filename, mimeType)` — uploads to path `opportunities/{opportunityId}/context-items/{itemId}/{filename}`, returns `{ storageRef, storageBucket }`.
    - `deleteContextFile(storageRef, storageBucket)` — for cleanup on failure or user-initiated remove.
  - [x] Storage bucket: read from `getServerEnv().NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`. If unset, throw a clear error ("Storage bucket not configured — set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local").
  - [x] Allowed file types (MVP): any mimetype is accepted; only validate file is non-empty and does not exceed 20 MB. Log mimetype for future validation.
- [x] Implement Server Actions for text and note items. (AC: 1, 4)
  - [x] Create `src/features/context-packages/server/actions.ts` with:
    - `addTextItemAction(formData: unknown)` — validates `{ opportunityId, title?, content }`, calls `requireRole()`, checks ownership of opportunity, writes to Firestore, returns `{ data: { itemId } }` or `{ error: { code, message } }`.
    - `addNoteItemAction(formData: unknown)` — validates `{ opportunityId, title, content }`, same flow.
  - [x] Ownership check: call `getOpportunity(opportunityId)` from `@/features/opportunities/server/repository`, verify `opportunity.createdByUserId === session.uid`; return `FORBIDDEN` if not.
  - [x] For text items, `title` defaults to `"Pasted text"` if not provided. For note items, `title` is required.
- [x] Build the file upload Route Handler. (AC: 1, 2, 3, 4)
  - [x] Create `src/app/api/context-packages/[opportunityId]/items/route.ts` as a `POST` Route Handler.
  - [x] Authentication: call `getCurrentUser()` from `@/features/auth/server/get-current-user`; if null return `Response.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 })`. Also validate email domain using `canAccessProtectedArea` from `@/features/auth/server/access`.
  - [x] Ownership: call `getOpportunity(opportunityId)` and verify `createdByUserId === session.uid`; return 403 on mismatch.
  - [x] Parse request as FormData: `const fd = await request.formData(); const file = fd.get("file") as File`. Validate file is present and ≤ 20 MB; return 422 on invalid.
  - [x] Upload flow: generate `itemId = crypto.randomUUID()`, convert file to Buffer, call `uploadContextFile`, then call `addContextItem` with the resulting storage refs. Return `{ data: { itemId, storageRef } }`.
  - [x] Error handling: if Storage upload succeeds but Firestore write fails, attempt cleanup of the uploaded file before returning error. Catch unknown errors and return `{ error: { code: "UPLOAD_FAILED", message: "..." } }` with status 500.
  - [x] **Do NOT use** `requireRole()` in Route Handlers — it uses `redirect()` which only works in Server Components/Actions. Use `getCurrentUser()` directly and return JSON error responses.
- [x] Build Context Item display and form components. (AC: 1, 2, 3)
  - [x] Create `src/features/context-packages/components/context-item-card.tsx` — `ConfirmedContextItemCard` (Server-compatible) + `PendingContextItemCard` (client, has Retry/Remove buttons). Display: sourceType chip, title, relative timestamp, progress bar for uploading.
  - [x] Create `src/features/context-packages/components/context-package-upload-form.tsx` (Client Component). Manages upload workflow with XHR `onprogress`, `pendingItems` state, merged list display, tab switcher for file/text/note. Text and note tabs use `useActionState` wired to Server Actions.
  - [x] Empty state: "No context added yet. Upload a file, paste text, or add a structured note." — shown when list is empty.
  - [x] All components use `<Link>` for navigation (not `<a>`). No infinite scroll.
- [x] Build the Context Package page route. (AC: 1, 2, 3, 4)
  - [x] Create `src/app/opportunities/[opportunityId]/context-package/page.tsx` (Server Component).
    - Calls `requireRole()` at top.
    - Fetches `getOpportunity(opportunityId)` — if not found, `notFound()`.
    - Fetches `listContextItems(opportunityId)` for initial server-rendered list.
    - Renders `<ContextPackageUploadForm initialItems={items} opportunityId={opportunityId} />`.
  - [x] Create `src/app/opportunities/[opportunityId]/context-package/loading.tsx` with skeleton (3 skeleton rows + form skeleton).
  - [x] Update `src/app/opportunities/[opportunityId]/page.tsx` to add a "Context Package" navigation link to `/opportunities/{opportunityId}/context-package` below the header. The link must use `<Link>` and be keyboard-accessible.
- [x] Update Firestore rules and middleware. (AC: 4)
  - [x] Update `firestore.rules`: added `contextItems` subcollection rule — read/create allowed for authenticated users; update blocked (items immutable); delete allowed by uploader.
  - [x] **Did NOT modify `src/middleware.ts`** — the matcher `/opportunities/:path*` already covers `/opportunities/[id]/context-package`.
  - [x] `storage.rules` NOT updated — all Storage ops go through Admin SDK server-side (bypasses rules). Noted in completion notes.
### Review Findings

- [x] [Review][Patch] sanitizeFilename returns empty string for all-unsafe filenames — storage path missing filename component; add fallback e.g. `file_${Date.now()}` [src/features/context-packages/server/storage.ts:14]
- [x] [Review][Patch] Retry button allows double-click — concurrent XHRs for same file create duplicate Firestore records; disable Retry button while status is "uploading" [src/features/context-packages/components/context-package-upload-form.tsx:105]
- [x] [Review][Patch] Remove unused `cookies` import from Route Handler [src/app/api/context-packages/[opportunityId]/items/route.ts:1]
- [x] [Review][Patch] Text/note form fields not cleared after successful submission — confusing UX; reset form after success state [src/features/context-packages/components/context-package-upload-form.tsx:139]
- [x] [Review][Defer] Firestore `allow update: if request.auth != null` on opportunities too permissive — pre-existing from Story 1.2 review [firestore.rules:9] — deferred, pre-existing
- [x] [Review][Defer] listContextItems unbounded query — add limit for large datasets in future story [src/features/context-packages/server/repository.ts:45] — deferred, acceptable for MVP pilot
- [x] [Review][Defer] deleteContextItem hard-delete without audit tombstone — NFR2 audit retention addressed in later story — deferred, pre-existing pattern
- [x] [Review][Defer] opportunityId denormalized in contextItems doc — minor data smell, low impact — deferred, design choice
- [x] [Review][Defer] resolveOpportunityAccess doubles Firestore reads per action — performance optimization for later — deferred, MVP acceptable

- [x] Write tests and run full validation gate. (AC: 1, 2, 3, 4)
  - [x] Schema tests in `context-item.test.ts`: required field enforcement for each type, optional field passthrough, invalid sourceType rejection.
  - [x] Action tests in `src/features/context-packages/server/actions.test.ts`: addTextItemAction validates required fields, rejects missing content. Schema covers unauthorized validation at boundary.
  - [x] Run `npm test && npm run lint && npm run build` — 78 tests pass, 0 lint errors, build succeeds.

## Dev Notes

### Story Foundation

- **Epic:** Epic 1 — Secure Opportunity Intake Workspace. This story adds the Context Package ingestion surface. Story 1.4 adds the time-ordered history review view on top of the items created here. Stories 2.x use these items for AI analysis. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1`]
- **FR coverage:** FR2 — Build the Context Package (file upload, paste text, structured notes; each item records source type, uploader, timestamp). [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.3`]
- **Follow-on dependency:** Story 1.4 will add history view over the same `contextItems` subcollection. Story 2.1 will add a top-level `contextPackages` document to track analysis job status. Do not pre-implement either of those now.

### Current Repository State (from Stories 1.1 + 1.2)

- **Auth infrastructure:** `requireRole()`, `requireSession()`, `getCurrentUser()`, `verifyCurrentSession()`, session cookie, middleware — all stable. For Route Handlers (not Server Actions), use `getCurrentUser()` which reads cookies and does NOT call `redirect()`. [Source: `src/features/auth/server/get-current-user.ts`]
- **Firestore singleton:** `getAdminFirestore()` exists at `src/lib/firebase/firestore.ts`. Use it for all Firestore writes. [Source: Story 1.2 File List]
- **Opportunity repository:** `getOpportunity(opportunityId)` exists at `src/features/opportunities/server/repository.ts`. Call it for ownership checks before any context item write. [Source: Story 1.2]
- **Import convention (CRITICAL):** Use `@/` alias paths for all imports in Next.js files (NOT `.js` extensions — webpack can't resolve them). Use `.ts` extension only in test files (native Node test runner). [Source: Story 1.2 debug log]
- **Navigation:** All internal links must use `<Link>` from `next/link` (ESLint `@next/next/no-html-link-for-pages` enforced). [Source: Story 1.2 review findings]
- **Ownership check pattern:** Story 1.2 established: call `getOpportunity`, check `existing.createdByUserId !== session.uid`, return `FORBIDDEN` error. Follow this pattern for all context item mutations. [Source: `src/features/opportunities/server/actions.ts`]
- **Test runner:** Native Node `--experimental-strip-types`. Import with `.ts` extension. Tests co-located with code. Pattern: `import { ... } from "./schema.ts"` (NOT `.js`). [Source: Story 1.2 debug log]
- **Form actions:** Story 1.2 used `useActionState` for Server Action-backed forms. This story uses that same pattern for text/note forms. For file uploads, use XHR (NOT `useActionState` — it doesn't support progress tracking).

### Technical Requirements — Route Handler Auth Pattern

Route Handlers cannot use `requireRole()` (it calls `redirect()` which throws a Next.js navigation signal — works in Server Components but NOT in Route Handlers). Use this pattern instead:

```ts
import { getCurrentUser } from "@/features/auth/server/get-current-user";
import { canAccessProtectedArea } from "@/features/auth/server/access";

const session = await getCurrentUser();
if (!session || !canAccessProtectedArea(session)) {
  return Response.json(
    { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
    { status: 401 }
  );
}
```

`getCurrentUser()` reads the session cookie and verifies it — safe to call from Route Handlers. `canAccessProtectedArea()` checks the email domain allowlist. [Source: `src/features/auth/server/get-current-user.ts`, `src/features/auth/server/access.ts`]

### Technical Requirements — XHR Upload Progress

Use `XMLHttpRequest` for file uploads to enable real progress tracking. `fetch` does NOT expose upload progress on all browsers.

```ts
function uploadFile(opportunityId: string, file: File, onProgress: (pct: number) => void): Promise<{ itemId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText);
        if ("error" in result) reject(new Error(result.error.message));
        else resolve(result.data);
      } else {
        reject(new Error("Upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.open("POST", `/api/context-packages/${opportunityId}/items`);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("filename", file.name);
    xhr.send(fd);
  });
}
```

### Technical Requirements — Optimistic Upload State

The upload form manages `pendingItems` in client state alongside server-fetched `confirmedItems`:

```ts
type PendingItem = {
  id: string;           // client-generated UUID (for key, not stored in Firestore)
  name: string;         // filename shown in UI
  status: "uploading" | "failed";
  progress: number;     // 0–100
  file: File;           // kept for retry
};
```

On upload start: push to `pendingItems`. On progress: update `progress`. On success: remove from `pendingItems` (the confirmed item will appear on next query refresh). On fail: set `status: "failed"`. The list renders `pendingItems` first (at top), then `confirmedItems`. This prevents list jump (AC2) because pending items occupy a stable slot.

To trigger a re-fetch of confirmed items after successful upload, use a `refreshKey` counter in state (`setRefreshKey(k => k + 1)`) and pass it as a key to a Server Component wrapper or use `router.refresh()` from `next/navigation`.

### Technical Requirements — Firestore Subcollection Path

All context items live at: `opportunities/{opportunityId}/contextItems/{itemId}`

```ts
const subcollection = db
  .collection("opportunities")
  .doc(opportunityId)
  .collection("contextItems");
```

Firestore query for list: `.orderBy("createdAt", "desc")` (newest first for now; Story 1.4 handles chronological grouping). Composite index on `(opportunityId + createdAt)` is NOT needed for subcollection queries — the subcollection itself is already scoped to the opportunity.

### Technical Requirements — Storage Path Convention

```
opportunities/{opportunityId}/context-items/{itemId}/{sanitized-filename}
```

Sanitize filename before use in the storage path: replace spaces with underscores, strip non-alphanumeric characters except `.` and `-`. Keep extension. Example: `"My RFP v3.pdf"` → `"My_RFP_v3.pdf"`.

Storage bucket: from `getServerEnv().NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`. If not set, throw early with a clear message.

### Architecture Compliance

- **Feature-first:** All new code in `src/features/context-packages/` and `src/app/opportunities/[opportunityId]/context-package/`. No generic utils folders.
- **Server-only Firestore:** Repository and storage server files must NOT be imported by client components. Client component calls the Route Handler HTTP endpoint, not the repository directly.
- **Response envelope:** Route Handler returns `{ data: {...} }` or `{ error: { code, message } }` with semantic HTTP status codes. Server Actions return the same envelope shape.
- **Admin SDK for Storage:** Do NOT use Firebase Client SDK for file uploads. All Storage operations go through the Admin SDK server-side. This means storage.rules don't protect uploads — server-side ownership checks are the only guard.
- **No infinite scroll:** UX spec bans it. Show all items; add pagination only if explicitly needed (not in this story).
- **Naming:** Firestore subcollection `contextItems` (camelCase). File path `context-items` (kebab-case). Component files `context-package-*.tsx` (kebab-case). Types `ContextItem`, `AddTextItemInput` (PascalCase).

### File Structure Requirements

**New files:**
- `src/features/context-packages/schemas/context-item.ts`
- `src/features/context-packages/schemas/context-item.test.ts`
- `src/features/context-packages/types.ts`
- `src/features/context-packages/server/repository.ts`
- `src/features/context-packages/server/storage.ts`
- `src/features/context-packages/server/actions.ts`
- `src/features/context-packages/server/actions.test.ts`
- `src/features/context-packages/components/context-item-card.tsx`
- `src/features/context-packages/components/context-package-upload-form.tsx`
- `src/features/context-packages/components/context-package-panel.tsx`
- `src/app/api/context-packages/[opportunityId]/items/route.ts`
- `src/app/opportunities/[opportunityId]/context-package/page.tsx`
- `src/app/opportunities/[opportunityId]/context-package/loading.tsx`
- `src/lib/firebase/storage.ts`

**Modified files:**
- `src/app/opportunities/[opportunityId]/page.tsx` — add Context Package nav link
- `firestore.rules` — add contextItems subcollection rule

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

### Firestore Data Model — Context Item

**Subcollection:** `opportunities/{opportunityId}/contextItems`

| Field | Type | Required | Notes |
|---|---|---|---|
| `opportunityId` | `string` | yes | Denormalized for potential future cross-collection queries |
| `sourceType` | `"file"\|"text"\|"note"` | yes | Enum |
| `uploaderId` | `string` | yes | `session.uid` |
| `title` | `string` | yes | Filename (file), user title (note), `"Pasted text"` default (text) |
| `content` | `string \| null` | no | Full text content (text/note only) |
| `storageRef` | `string \| null` | no | Storage object path (file only) |
| `storageBucket` | `string \| null` | no | Firebase Storage bucket (file only) |
| `mimeType` | `string \| null` | no | File MIME type |
| `sizeBytes` | `number \| null` | no | File size in bytes |
| `createdAt` | `Timestamp` | yes | Server timestamp |

### UX / Product Guardrails

- **Empty state:** "No context added yet. Upload a file, paste text, or add a structured note." — never blank, never just a spinner. [Source: EXPERIENCE.md — "Empty Context Package"]
- **Upload progress:** In-progress item shows filename + progress percentage or bar. Must remain in list without jumping. [Source: EXPERIENCE.md — "Upload in progress"]
- **Upload failed:** Failed item shows filename, "Upload failed" label, and two actions: Retry and Remove. Retry re-starts the XHR upload. Remove calls `deleteContextItem` if a Firestore record was created, otherwise just removes from pending state. [Source: EXPERIENCE.md — "Upload failed"]
- **Source type chip:** Each item card shows its source type as a chip (e.g., "File", "Text", "Note") — use `trust-soft` background and `trust` color for the chip, consistent with DESIGN.md `evidence-chip` token.
- **Context item card tokens:** `background: #FFFFFF`, `border: 1px solid #D7DEE7`, `border-radius: 10px`. [Source: DESIGN.md `context-item` component]
- **Microcopy:** "Add file", "Paste text", "Add note" — direct labels. "Uploading…" for progress. "Upload failed." for errors. No hype. [Source: EXPERIENCE.md — Voice and Tone]
- **Desktop-first:** Primary layout is list of items with add-item controls. Mobile is secondary.
- **Accessibility:** File input has visible label. Progress announced via `aria-valuenow`/`aria-valuemax` on progress element. Error messages use `role="alert"`.

### Current State / What This Story Changes / What Must Be Preserved

**Current state:**
- `opportunities/{opportunityId}` Firestore documents exist but have no Context Package items.
- The opportunity overview page (`/opportunities/[id]`) shows metadata + edit form.
- No `contextItems` subcollection, no Storage uploads.

**What this story adds:**
- `contextItems` subcollection and Firestore repository.
- Admin SDK Storage upload helper and server-side file upload Route Handler.
- Server Actions for text/note items.
- Context Package page at `/opportunities/[id]/context-package`.
- Link from overview page to context-package page.

**What must be preserved:**
- All Story 1.1 auth infrastructure (session, middleware, requireRole).
- Story 1.2 opportunity CRUD — `getOpportunity`, `updateOpportunity`, `createOpportunity`, all schemas and types.
- The overview page `[opportunityId]/page.tsx` content (header, fit criteria, edit form) — this story only ADDS a navigation link, does not remove existing content.
- Firestore rules for `opportunities` collection.
- Import convention (`@/` alias paths for Next.js, `.ts` for test files).

### Testing Requirements

- Co-locate tests as `*.test.ts`. Native Node runner, import with `.ts` extension.
- **Schema tests:** `context-item.test.ts` — valid item for each sourceType, required field rejection, sourceType enum enforcement, optional field passthrough.
- **Action tests:** `actions.test.ts` — addTextItemAction with missing content fails, addNoteItemAction with missing title fails, valid inputs produce correct schema output (test schema validation only; mock Firestore as in Story 1.2).
- **Route Handler:** No unit test required for the Route Handler itself (too tightly coupled to Firebase Admin); covered by the schema validation tests and integration tested manually.
- Run `npm test && npm run lint && npm run build` before marking complete.

### Anti-Patterns To Avoid

- Do **NOT** use `requireRole()` in Route Handlers — use `getCurrentUser()` instead.
- Do **NOT** use `fetch` for file uploads — use `XMLHttpRequest` to get `onprogress` events.
- Do **NOT** import repository or storage server files into client components.
- Do **NOT** use `.js` extension for `@/`-aliased imports in Next.js files.
- Do **NOT** create a top-level `contextPackages` Firestore collection in this story — deferred to Story 2.1.
- Do **NOT** use Firebase Client SDK for Storage — all writes go through Admin SDK server-side.
- Do **NOT** add infinite scroll to the items list.
- Do **NOT** use `<a>` tags for internal navigation — `<Link>` from `next/link` only.
- Do **NOT** block the upload form pending confirmation — optimistic UI must show item immediately on submit.
- Do **NOT** skip the file size check (20 MB max) in the Route Handler.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.3: Add Context Package items with source metadata`
- `_bmad-output/planning-artifacts/epics.md#Epic 1: Secure Opportunity Intake Workspace`
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-2: Build the Context Package`
- `_bmad-output/planning-artifacts/architecture.md#Data Architecture`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`
- `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Components`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#State Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Voice and Tone`
- `src/features/auth/server/get-current-user.ts`
- `src/features/auth/server/access.ts`
- `src/features/auth/server/require-role.ts`
- `src/features/opportunities/server/repository.ts`
- `src/features/opportunities/server/actions.ts`
- `src/lib/firebase/firestore.ts`
- `src/lib/firebase/admin.ts`
- `src/lib/config/env.ts`
- `src/middleware.ts`
- `firestore.rules`
- `storage.rules`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm test && npm run lint && npm run build` — 78 pass, 0 lint errors, build OK
- XHR upload form: used `useCallback` to stabilize handlers; `router.refresh()` triggers Next.js RSC re-fetch for confirmed items
- storage.rules: NOT updated — Admin SDK bypasses client-side rules
- `crypto.randomUUID()` available natively in Node 18+ / Edge runtime

### Completion Notes List

- Introduced `contextItems` subcollection (`opportunities/{opportunityId}/contextItems`) with full Zod schema (4 schemas: document, file, text, note).
- Firebase Admin Storage singleton added at `src/lib/firebase/storage.ts`. `uploadContextFile` sanitizes filename and writes to `opportunities/{id}/context-items/{itemId}/{filename}`. Cleanup on Firestore write failure.
- Server Actions `addTextItemAction` / `addNoteItemAction` enforce ownership check (session.uid == opportunity.createdByUserId) before Firestore write.
- Route Handler `POST /api/context-packages/[opportunityId]/items` uses `getCurrentUser()` (NOT `requireRole()`), validates file ≤ 20 MB, uploads to Storage, creates Firestore record, cleans up Storage on failure.
- `ContextPackageUploadForm` (Client Component): XHR `onprogress` for real upload percentage; optimistic `pendingItems` state with stable slots (no list jump); merged display with confirmed items; tab switcher (file/text/note); empty state message.
- `ContextPackagePage` at `/opportunities/[id]/context-package` with `loading.tsx` skeleton.
- Opportunity overview page updated with keyboard-accessible "Context Package" `<Link>` nav.
- Firestore rules extended: `contextItems` subcollection — read/create for auth users; update blocked; delete by uploader.
- `storage.rules` NOT changed — Admin SDK bypasses rules; server-side ownership checks are the security layer.
- 78 tests, 0 regressions.

### File List

- `_bmad-output/implementation-artifacts/1-3-add-context-package-items-with-source-metadata.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `firestore.rules`
- `src/features/context-packages/schemas/context-item.ts`
- `src/features/context-packages/schemas/context-item.test.ts`
- `src/features/context-packages/types.ts`
- `src/features/context-packages/server/repository.ts`
- `src/features/context-packages/server/storage.ts`
- `src/features/context-packages/server/actions.ts`
- `src/features/context-packages/server/actions.test.ts`
- `src/features/context-packages/components/context-item-card.tsx`
- `src/features/context-packages/components/context-package-upload-form.tsx`
- `src/app/api/context-packages/[opportunityId]/items/route.ts`
- `src/app/opportunities/[opportunityId]/context-package/page.tsx`
- `src/app/opportunities/[opportunityId]/context-package/loading.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`
- `src/lib/firebase/storage.ts`

### Change Log

- 2026-05-30: Story created from comprehensive analysis of epics, PRD, architecture, UX specs, and Stories 1.1/1.2 implementation state.
- 2026-05-30: Implemented Context Item schema (4 Zod schemas), Firestore subcollection repository, Admin Storage helper, Server Actions for text/note, file upload Route Handler with cleanup, XHR upload form with optimistic pending state, context-package page route, and updated Firestore rules.

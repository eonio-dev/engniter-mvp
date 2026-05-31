---
baseline_commit: a26dd20c0647d174ac61d3740dee07a389a1370b
---

# Story 1.2: Create and edit Opportunity metadata

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want to create and update an Opportunity with its key metadata,
so that I can establish the scoped work object before adding client context and analysis inputs.

## Acceptance Criteria

1. **Given** an authenticated user with edit permission  
   **When** they create a new Opportunity  
   **Then** the system requires a title and technical owner before saving  
   **And** it stores optional fields such as client name, project type, estimated value, proposal deadline, and internal fit criteria when provided.

2. **Given** an existing Opportunity  
   **When** an authorized user edits its metadata  
   **Then** the system saves the changes without deleting existing Context Package items or workflow history  
   **And** the updated overview reflects the latest metadata.

3. **Given** an Opportunity contains internal fit criteria  
   **When** the user views or edits the Opportunity overview  
   **Then** those criteria are visible in the workspace  
   **And** they remain available for later fit-mismatch checks in the validation workflow.

4. **Given** the Opportunity list or overview is loading, empty, or unavailable  
   **When** the UI renders those states  
   **Then** the user sees explicit skeleton, empty, or recovery treatments consistent with the UX specification  
   **And** the user is not left on a blank screen.

## Tasks / Subtasks

- [x] Define the Opportunity Zod schema and TypeScript types. (AC: 1)
  - [x] Create `src/features/opportunities/schemas/opportunity.ts` with a Zod schema for the Opportunity document, including required fields `title` and `technicalOwner`, and optional fields `clientName`, `projectType`, `estimatedValue`, `proposalDeadline`, and `fitCriteria`.
  - [x] Create `src/features/opportunities/types.ts` exporting `Opportunity`, `CreateOpportunityInput`, and `UpdateOpportunityInput` types derived from the schema.
  - [x] Create a create-input schema (`createOpportunitySchema`) and an update-input schema (`updateOpportunitySchema`) with `opportunityId` for use at server action boundaries.
- [x] Implement the Firestore repository for Opportunity CRUD. (AC: 1, 2)
  - [x] Create `src/features/opportunities/server/repository.ts` with `createOpportunity`, `getOpportunity`, `updateOpportunity`, and `listOpportunitiesByUser` functions.
  - [x] Each write operation must set `updatedAt` to the current server timestamp and never remove fields outside the schema.
  - [x] `createOpportunity` must set `createdAt`, `createdByUserId`, and `status: "active"` on the new document.
  - [x] `updateOpportunity` must use a merge/partial update so existing Context Package item references and workflow state stored outside the metadata fields are never overwritten.
  - [x] Use `getFirestore` from `src/lib/firebase/admin.ts` (or a new `src/lib/firebase/firestore.ts`) for the Firestore Admin SDK instance. Do not import Firebase Admin directly into feature modules.
- [x] Implement Server Actions for create and update. (AC: 1, 2)
  - [x] Create `src/features/opportunities/server/actions.ts` with `createOpportunityAction` and `updateOpportunityAction`.
  - [x] Validate inputs with Zod before any Firestore write; return typed domain errors on validation failure.
  - [x] Both actions must call `requireRole()` before executing any mutation so unauthenticated or unauthorized callers are rejected at the server boundary.
  - [x] Return `{ data: { opportunityId } }` on success or `{ error: { code, message } }` on failure following the architecture envelope pattern.
- [x] Build the Opportunity metadata form component. (AC: 1, 2, 3)
  - [x] Create `src/features/opportunities/components/opportunity-metadata-form.tsx` as a client component using `useActionState` (native Next.js 15 server action form pattern; react-hook-form install was deferred by user).
  - [x] Form fields: `title` (required text), `technicalOwner` (required text), `clientName` (optional text), `projectType` (optional text), `estimatedValue` (optional text), `proposalDeadline` (optional date), `fitCriteria` (optional textarea for structured notes; store as a plain string in MVP).
  - [x] Show inline validation errors for required fields before form submission.
  - [x] The form must be usable without a pointer: all fields and the submit button are keyboard-reachable and labeled.
  - [x] Accept an optional `initialValues` prop to pre-populate the form for edit mode.
- [x] Build the new Opportunity page and overview page. (AC: 1, 2, 3, 4)
  - [x] Create `src/app/opportunities/new/page.tsx` (Server Component) that calls `requireRole()` and renders the metadata form wired to `createOpportunityAction`. On success, redirect to `/opportunities/[opportunityId]`.
  - [x] Create `src/app/opportunities/[opportunityId]/page.tsx` (Server Component) that calls `requireRole()`, fetches the Opportunity by ID from Firestore, renders the `OpportunityOverviewHeader` with metadata, and renders the fit-criteria section.
  - [x] Create `src/features/opportunities/components/opportunity-overview-header.tsx` (Server Component) showing title, technical owner, status chip, and editable metadata summary aligned to the mockup hierarchy.
  - [x] Create `src/app/opportunities/[opportunityId]/loading.tsx` with skeleton labels so the overview never shows a blank page during load.
  - [x] Create `src/app/opportunities/[opportunityId]/error.tsx` with a clear unavailable state and a route-back link to the Opportunity list.
- [x] Update the Opportunity list page to show real data and explicit states. (AC: 4)
  - [x] Update `src/app/opportunities/page.tsx` to fetch the real opportunity list for the authenticated user using a query from the repository.
  - [x] Create `src/features/opportunities/components/opportunity-list.tsx` (Client Component) that renders opportunity rows with title, owner, and status, or a skeleton while loading.
  - [x] Show explicit empty state: "No Opportunities yet." with a single primary "New Opportunity" button routing to `/opportunities/new` when the list is empty.
  - [x] Show explicit unavailable/error state if the Firestore query fails, with a retry action; never show a blank screen.
- [x] Install missing runtime dependencies and update Firestore rules. (AC: 1, 2)
  - [x] react-hook-form install deferred by user; form implemented with `useActionState` instead.
  - [x] Update `firestore.rules` to allow authenticated users (verified email in the allowed domain) to create, read, and update documents in the `opportunities` collection. Reads are permitted for the creator; for now, any authenticated user with a valid session can read (MVP simplicity). Delete remains blocked.
  - [x] **Do NOT modify `src/middleware.ts` matcher.** The existing pattern `/opportunities/:path*` uses Next.js path-to-regexp `*` (zero-or-more), so it already covers `/opportunities`, `/opportunities/new`, `/opportunities/[opportunityId]`, and all deeper sub-paths. Adding duplicate patterns would be redundant.
- [x] Write co-located tests for the new code and validate the full test suite. (AC: 1, 2, 3, 4)
  - [x] Create `src/features/opportunities/schemas/opportunity.test.ts` with unit tests for required-field enforcement, optional-field passthrough, and invalid-input rejection.
  - [x] Create `src/features/opportunities/server/actions.test.ts` covering: create succeeds with valid required fields, create fails when `title` or `technicalOwner` is missing, update succeeds and does not wipe unrelated fields, unauthenticated call is rejected.
  - [x] Run `npm test && npm run lint && npm run build` — 52 tests pass, 0 lint errors, build succeeds.

### Review Findings

- [x] [Review][Patch] Check session.uid == existing.createdByUserId before updating — updateOpportunityAction discards session return value; any authenticated user can update any Opportunity [src/features/opportunities/server/actions.ts:47]
- [x] [Review][Patch] Add loading.tsx for /opportunities list page — Server Component fetch has no skeleton; violates AC4 (never blank screen) [src/app/opportunities/loading.tsx]
- [x] [Review][Patch] Remove unused useRef import in form component [src/features/opportunities/components/opportunity-metadata-form.tsx:3]
- [x] [Review][Defer] Race condition: getOpportunity + updateOpportunity not atomic — TOCTOU window between fetch and write; deferred, acceptable MVP risk [src/features/opportunities/server/actions.ts:63]

## Dev Notes

### Story Foundation

- **Epic:** Epic 1 — Secure Opportunity Intake Workspace. This story introduces the Opportunity data model, the create/edit surface, and the list view. Stories 1.3 and 1.4 build the Context Package ingestion and history surfaces on top of the Opportunity documents and routes created here. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Secure Opportunity Intake Workspace`]
- **FR coverage:** FR1 — create and edit Opportunity with required and optional metadata. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.2: Create and edit Opportunity metadata`]
- **Follow-on dependency:** Stories 1.3 and 1.4 will add Context Package items and history to `opportunities/[opportunityId]`. The Firestore document structure and the overview route created here must be stable enough that those stories can extend without restructuring the document. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.3`, `#Story 1.4`]

### Current Repository State (from Story 1.1)

- Auth scaffolding, session helpers, `requireRole`, `requireSession`, and middleware are fully implemented and stable. Do not change auth behavior; call `requireRole()` at the top of every new server component and action. [Source: Story 1.1 File List]
- `src/app/opportunities/page.tsx` is a placeholder shell. This story will replace its internals with a real list query and explicit states; preserve the `requireRole()` call and the overall route structure. [Source: Story 1.1 completion notes]
- Firestore Admin SDK is available via `getAdminApp()` and `getAdminAuth()` in `src/lib/firebase/admin.ts`. A new `getFirestore()` helper may be added to a `src/lib/firebase/firestore.ts` module following the same singleton pattern used for auth. [Source: `src/lib/firebase/admin.ts`]
- Firebase Client SDK is bootstrapped in `src/lib/firebase/client-app.ts`. Do not use the client SDK for Opportunity writes; all mutations must go through Server Actions backed by the Admin SDK.
- `firestore.rules` currently denies all reads and writes by default. This story must add the `opportunities` collection rules or the app will fail at runtime when Firestore is wired. [Source: Story 1.1 File List]
- Test runner: `npm test` uses Node's native `--experimental-strip-types` test runner; co-locate tests as `*.test.ts` / `*.test.tsx`. Do not introduce Jest or Vitest in this story. [Source: `package.json`, Story 1.1 testing conventions]
- One open deferred item from Story 1.1 lives in `_bmad-output/implementation-artifacts/deferred-work.md`: email-domain edge cases and redirect hardening. Do not address those here; they are pre-existing and scoped to a separate pass.

### Technical Requirements

- **Required fields:** `title` (non-empty string) and `technicalOwner` (non-empty string). The system must reject saves where either is missing or blank. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.2`, PRD FR-1]
- **Optional fields:** `clientName`, `projectType`, `estimatedValue` (treat as free-text string in MVP; do not enforce numeric formatting), `proposalDeadline` (ISO 8601 date string stored in Firestore), `fitCriteria` (free-text string in MVP; later stories will parse this for mismatch checks). [Source: PRD FR-1 consequences]
- **Fit criteria must survive edits:** When a user edits metadata, the `fitCriteria` field must be preserved unless the user explicitly clears it. Never silently discard it. [Source: AC 3, PRD FR-1]
- **Persistence layer:** Firestore `opportunities` collection. Use the Admin SDK inside server actions and queries. Never call Firestore from a client component. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- **Zod at boundaries:** Validate every create and update input with Zod before the Firestore write. Expose typed error codes on failure. [Source: `_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions`]
- **No client-side auth guards:** Route protection is handled by `requireRole()` inside server components and actions, and by the middleware cookie check. Do not add redundant client-side redirect logic. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]

### Architecture Compliance

- **Feature-first placement:** All new Opportunity code lives under `src/features/opportunities/`. Do not put opportunity components in `src/app` or generic utils. [Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`]
- **Server Actions for mutations:** `createOpportunityAction` and `updateOpportunityAction` are the only write paths. Route Handlers are not needed for this story's create/update flows. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- **Response envelope:** Server Actions must return `{ data: ... }` on success and `{ error: { code, message } }` on failure. Do not mix raw object returns with error objects in the same function. [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- **Server-only Firestore access:** The repository file must only be imported by server-side modules (actions, queries, server components). Never import repository into a client component; Next.js will not protect this automatically. [Source: `_bmad-output/planning-artifacts/architecture.md#Architectural Boundaries`]
- **RSC default:** New page components and the overview header are Server Components. The metadata form is a Client Component (needs `useForm`). The opportunity list may be a Client Component if it needs interactive states, or a Server Component if it renders static data — keep it server-side until interaction is needed. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- **Naming conventions:** Firestore collection name is `opportunities` (lowercase plural). Field names use camelCase. Route segments use kebab-case. TypeScript types use PascalCase. Component files use kebab-case. [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]

### Library / Framework Requirements

- **React Hook Form 7.76.1** with the Zod resolver (`@hookform/resolvers/zod`) for the metadata form. The `zod` resolver version must be compatible with Zod 4.x. If `@hookform/resolvers` is not yet in `package.json`, add it; confirm the version supports Zod 4 before installing. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- **Zod 4.4.3** is already installed (`package.json`). Use `.parse()` inside server actions for strict validation and `.safeParse()` where you need to return error details rather than throw. [Source: `package.json`]
- **Firebase Admin SDK** (already installed) for Firestore access in server actions and repository. Use `getFirestore()` from `firebase-admin/firestore`. Follow the singleton pattern from `src/lib/firebase/admin.ts`. [Source: `src/lib/firebase/admin.ts`]
- **No new styling frameworks.** Use the global CSS classes and CSS custom properties already established in `src/app/globals.css` and the design tokens defined in `DESIGN.md`. Do not introduce Tailwind or a component library. [Source: Story 1.1 conventions, `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md`]

### File Structure Requirements

New files to create:
- `src/features/opportunities/schemas/opportunity.ts`
- `src/features/opportunities/schemas/opportunity.test.ts`
- `src/features/opportunities/types.ts`
- `src/features/opportunities/server/repository.ts`
- `src/features/opportunities/server/actions.ts`
- `src/features/opportunities/server/actions.test.ts`
- `src/features/opportunities/components/opportunity-list.tsx`
- `src/features/opportunities/components/opportunity-overview-header.tsx`
- `src/features/opportunities/components/opportunity-metadata-form.tsx`
- `src/app/opportunities/new/page.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`
- `src/app/opportunities/[opportunityId]/loading.tsx`
- `src/app/opportunities/[opportunityId]/error.tsx`
- `src/lib/firebase/firestore.ts` (Admin SDK Firestore singleton, if not already extracted)

Files to update:
- `src/app/opportunities/page.tsx` — replace placeholder content with real list + empty/error states
- `src/middleware.ts` — extend matcher to include new routes
- `firestore.rules` — add `opportunities` collection rules

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`, `#Requirements to Structure Mapping`]

### Firestore Data Model

**Collection:** `opportunities`  
**Document fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | yes | Non-empty |
| `technicalOwner` | `string` | yes | Display name or UID; MVP stores free-text display name |
| `clientName` | `string \| null` | no | Optional |
| `projectType` | `string \| null` | no | Optional |
| `estimatedValue` | `string \| null` | no | Free-text in MVP |
| `proposalDeadline` | `string \| null` | no | ISO 8601 date string |
| `fitCriteria` | `string \| null` | no | Free-text; used later for mismatch checks |
| `status` | `string` | yes | `"active"` on create; do not change in this story |
| `createdByUserId` | `string` | yes | UID from session; set on create |
| `createdAt` | `Timestamp` | yes | Server timestamp; set on create |
| `updatedAt` | `Timestamp` | yes | Server timestamp; set on every write |

**Firestore rules snippet for `opportunities`:**

```
match /opportunities/{opportunityId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null
    && request.resource.data.createdByUserId == request.auth.uid;
  allow update: if request.auth != null;
  allow delete: if false;
}
```

Note: These MVP rules allow any authenticated user to read and update any Opportunity. Per-opportunity access control (by role or owner) is a future story concern. Delete remains blocked. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`, PRD NFR1]

### UX / Product Guardrails

- **Three-zone layout direction:** The opportunities list page and overview pages should establish the left-nav / main-workspace structure shown in `mockups/opportunity-overview.html`. Nav stays in the app layout (`src/app/layout.tsx`); main content renders in the workspace area. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Layout & Spacing`, mockup]
- **State treatments required by the UX spec:**
  - Cold open / loading list: skeleton metadata rows (not a spinner or blank screen). [Source: `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#State Patterns` — "Cold open"]
  - Empty list: "No Opportunities yet." with a single primary "New Opportunity" action. No other competing calls to action. [Source: EXPERIENCE.md — "Empty workspace"]
  - Unavailable Opportunity: if the document is missing or the user loses access, show a clear unavailable state with a route back to the list. Never a blank screen. [Source: EXPERIENCE.md — "Opportunity unavailable"]
- **Opportunity row component:** Each row must show `title`, `technicalOwner`, and `status` using text labels, not color alone. Use the `opportunity-row` design token (background: `#FFFFFF`, border: `1px solid #D7DEE7`, radius: `10px`). [Source: `DESIGN.md#Components`]
- **Form microcopy:** Use short, direct labels. "Title" not "Opportunity title". "Technical owner" not "Technical owner name". Error messages state what is missing: "Title is required." No cheerful filler. [Source: EXPERIENCE.md#Voice and Tone]
- **Single primary action per surface:** On the create page, one primary "Create Opportunity" button. On the overview, one primary action (placeholder for "Run analysis" in later stories; for now the primary action can be "Edit metadata"). [Source: DESIGN.md#Components — primary-button rule]
- **Fit criteria visibility:** The fit-criteria section must always be visible on the overview page when present, not collapsed by default. Later stories need it visible for mismatch check UI. [Source: AC 3, EXPERIENCE.md#Trust and Evidence Model]
- **Desktop-first layout:** Implement for wide viewport first (`≥ 1280px`). Narrower breakpoints can collapse the rail, but do not build mobile-primary interactions in this story. [Source: EXPERIENCE.md#Responsive & Platform]

### Current State / What This Story Changes / What Must Be Preserved

**Current state:**
- `src/app/opportunities/page.tsx` is a placeholder protected by `requireRole()` with hard-coded UI copy.
- There are no Opportunity Firestore documents, no repository, no schemas, and no create/edit routes.
- `firestore.rules` denies all access by default.

**What this story changes:**
- Introduces the `opportunities` Firestore collection with schema-validated documents.
- Adds create and update Server Actions with Zod validation.
- Adds new routes: `/opportunities/new` and `/opportunities/[opportunityId]`.
- Updates the list page to show real data with proper empty/error/loading states.
- Extends Firestore rules and middleware matcher.

**What must be preserved:**
- All auth infrastructure from Story 1.1: `requireRole`, `requireSession`, middleware cookie check, `getAdminApp`, `getAdminAuth`, session schema, session verification.
- Feature-first folder conventions: do not move auth code or create generic utils.
- Deny-by-default Firebase rules posture for all collections other than `opportunities`.
- The `opportunities` route protection via `requireRole()` must remain in place for all new pages.
- The native Node test runner pattern (`*.test.ts`, no Jest/Vitest).
- Strict TypeScript: no `any`, no `// @ts-ignore`.

### Testing Requirements

- Co-locate tests using `*.test.ts` / `*.test.tsx` next to the code they test.
- **Schema tests** (`opportunity.test.ts`): required-field enforcement, optional passthrough, invalid-input rejection with Zod `.safeParse()`.
- **Action tests** (`actions.test.ts`): create with valid inputs succeeds, create with missing `title` fails, create with missing `technicalOwner` fails, update does not overwrite unrelated document fields, unauthenticated call is rejected.
- Mock the Firestore Admin SDK in action tests to avoid real database calls. Use dependency injection or module mocking consistent with how Story 1.1 tests mocked Firebase Admin.
- Run `npm test && npm run lint && npm run build` to confirm all existing tests still pass (no regressions).

### Anti-Patterns To Avoid

- Do **not** call Firestore from client components. All reads and writes go through server actions, server components, or route handlers.
- Do **not** use the Firebase Client SDK for Opportunity persistence. Only the Admin SDK touches Firestore in server-side paths.
- Do **not** wipe the whole Firestore document on update. Use partial merge updates so unrelated fields (like future `contextPackageCount`) survive metadata edits.
- Do **not** store `fitCriteria` as a nested object in this story. Keep it as a plain string until the mismatch detection story needs structured parsing.
- Do **not** add infinite scroll to the list view. The UX spec explicitly bans this in dense review surfaces. [Source: EXPERIENCE.md#Interaction Primitives]
- Do **not** show a blank screen in loading, empty, or error states. Every state needs a visible treatment.
- Do **not** create generic utils or a top-level `components/` folder for opportunity UI. Feature-first: `src/features/opportunities/components/`.
- Do **not** skip calling `requireRole()` on the new page server components. Even if middleware protects routes by cookie presence, the server components must still enforce role access.
- Do **not** install `@hookform/resolvers` without verifying it supports Zod 4. Check the package changelog first.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.2: Create and edit Opportunity metadata`
- `_bmad-output/planning-artifacts/epics.md#Epic 1: Secure Opportunity Intake Workspace`
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-1: Create and edit an Opportunity`
- `_bmad-output/planning-artifacts/architecture.md#Data Architecture`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`
- `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Components`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Layout & Spacing`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#State Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Voice and Tone`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Responsive & Platform`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/mockups/opportunity-overview.html`
- `src/features/auth/server/require-role.ts`
- `src/features/auth/server/access.ts`
- `src/features/auth/schemas/session.ts`
- `src/lib/firebase/admin.ts`
- `src/app/opportunities/page.tsx`
- `src/middleware.ts`
- `_bmad-output/implementation-artifacts/deferred-work.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm test && npm run lint && npm run build` — 52 pass, 0 lint errors, build OK
- ESLint "Cannot serialize key parse" warning is pre-existing Zod serialization issue, not caused by this story
- Fixed import resolution: used `@/` alias paths for Next.js webpack (`.js` extensions only work for actual `.js` shim files)
- react-hook-form install deferred by user; form implemented with `useActionState` instead

### Completion Notes List

- Introduced `opportunities` Firestore collection with Zod-validated schema (`opportunitySchema`, `createOpportunitySchema`, `updateOpportunitySchema`).
- Repository uses partial Firestore `update()` — only explicitly provided fields are written, so future Context Package metadata survives metadata edits.
- Server Actions (`createOpportunityAction`, `updateOpportunityAction`) call `requireRole()` first, validate with Zod, return `{ data }` / `{ error }` envelope.
- Form implemented with Next.js 15 `useActionState` (no react-hook-form dependency needed); keyboard-accessible labels, inline error display.
- New routes: `/opportunities/new` and `/opportunities/[opportunityId]` with `loading.tsx` skeleton and `error.tsx` unavailable state.
- List page replaced placeholder with real Firestore query, explicit empty state ("No Opportunities yet."), explicit error state with retry link.
- `firestore.rules` updated: `opportunities` collection allows authenticated reads/creates/updates; delete blocked; all other collections remain deny-by-default.
- `src/lib/firebase/firestore.ts` added as Admin SDK Firestore singleton following same pattern as `admin.ts`.
- All internal navigation uses `<Link>` from `next/link` (enforced by ESLint `@next/next/no-html-link-for-pages`).

### File List

- `_bmad-output/implementation-artifacts/1-2-create-and-edit-opportunity-metadata.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `firestore.rules`
- `src/features/opportunities/schemas/opportunity.ts`
- `src/features/opportunities/schemas/opportunity.test.ts`
- `src/features/opportunities/types.ts`
- `src/features/opportunities/server/repository.ts`
- `src/features/opportunities/server/actions.ts`
- `src/features/opportunities/server/actions.test.ts`
- `src/features/opportunities/components/opportunity-list.tsx`
- `src/features/opportunities/components/opportunity-overview-header.tsx`
- `src/features/opportunities/components/opportunity-metadata-form.tsx`
- `src/app/opportunities/page.tsx`
- `src/app/opportunities/new/page.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`
- `src/app/opportunities/[opportunityId]/loading.tsx`
- `src/app/opportunities/[opportunityId]/error.tsx`
- `src/lib/firebase/firestore.ts`

### Change Log

- 2026-05-30: Story created from comprehensive analysis of epics, PRD, architecture, UX specs, mockups, and Story 1.1 implementation state.
- 2026-05-30: Implemented Opportunity Zod schema, Firestore repository (merge-safe updates), Server Actions with Zod validation, metadata form with `useActionState`, create/overview/list pages with explicit skeleton/empty/error states, and updated Firestore rules for the `opportunities` collection.

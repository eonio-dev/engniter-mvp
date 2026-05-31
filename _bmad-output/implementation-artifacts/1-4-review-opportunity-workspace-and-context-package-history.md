---
baseline_commit: a26dd20c0647d174ac61d3740dee07a389a1370b
---

# Story 1.4: Review Opportunity workspace and Context Package history

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want to review an Opportunity overview and its full Context Package history,
so that I can understand what was provided originally, what was added later, and whether the workspace is ready for analysis.

## Acceptance Criteria

1. **Given** an Opportunity contains multiple Context Package items over time  
   **When** the user opens the Opportunity workspace  
   **Then** the Context Package is shown as a time-ordered history  
   **And** original items are distinguishable from later additions without losing chronology.

2. **Given** the user selects a Context Package item  
   **When** the detail view opens  
   **Then** they can inspect the source content in a side pane or drawer  
   **And** raw source material is not edited inline.

3. **Given** the Opportunity overview is rendered on large or medium screens  
   **When** layout behavior is applied  
   **Then** the workspace follows the UX layout model with stable navigation and contextual detail or evidence regions  
   **And** the interaction remains usable when rails collapse on narrower screens.

4. **Given** an Opportunity or its history becomes unavailable because of deletion or access changes  
   **When** the user attempts to open it  
   **Then** the UI shows a clear unavailable state with recovery navigation  
   **And** no silent failure or blank screen occurs.

## Tasks / Subtasks

- [x] Add chronological query to Context Items repository. (AC: 1)
  - [x] Add `listContextItemsChronological(opportunityId: string)` to `src/features/context-packages/server/repository.ts` — same subcollection query as `listContextItems` but `orderBy("createdAt", "asc")` (oldest first). This is the ordering needed for history view: original items at the top, later additions below.
  - [x] Keep the existing `listContextItems` (desc order) unchanged — it is still used by `ContextPackageUploadForm` for the upload form's item list (newest first is appropriate for that surface).
- [x] Build the Context Package history table component. (AC: 1, 2)
  - [ ] Create `src/features/context-packages/components/context-package-history-table.tsx` as a Client Component.
  - [ ] Render items in ascending chronological order (oldest first). The FIRST item in the array is "original" — render it with an "Original" chip/badge. All subsequent items are "added later" — render with their timestamp only. If there is only one item total, show it without an "Original" label.
  - [ ] Each row shows: source type chip, title, timestamp (formatted as `"MMM D · H:MM am/pm"`), and an expand/collapse toggle button.
  - [ ] On toggle: reveal an inline detail panel below the row showing full item content (see Task 3). The detail panel must NOT contain editable inputs — read-only display only.
  - [ ] State: `expandedItemId: string | null` in `useState`. Only one item expanded at a time (clicking another collapses the current one). Keyboard: Enter/Space on the row or toggle button expands/collapses; focus does not trap inside the detail panel.
  - [ ] Empty state (no items): "No context items yet." — shown when `items.length === 0`. This differs from the upload form's empty state; use a compact text message rather than a call to action (the upload form handles the CTA).
  - [ ] Uses the `context-item` design token: `background: #FFFFFF`, `border: 1px solid #D7DEE7`, `border-radius: 10px`. Source type chip uses `trust-soft` background and `trust` color.
  - [x] Tests: Created `context-package-history-table.helpers.ts` exporting `getItemLabel` and `formatItemTimestamp`. Test in `context-package-history-table.test.ts` imports from `.helpers.ts` (pure `.ts` — Node runner can't handle `.tsx`). All 5 label test cases pass.
- [x] Build the inline item detail panel. (AC: 2)
  - [ ] Create `src/features/context-packages/components/context-item-detail-panel.tsx` (can be a simple function component, not a separate file if small — but per architecture, create it as a named component file).
  - [ ] For `sourceType: "text"` or `"note"`: show the `content` field in a read-only `<pre>` or `<div>` with `white-space: pre-wrap` styling. Label it "Content". No editing.
  - [ ] For `sourceType: "file"`: show file metadata (filename from `title`, size in KB from `sizeBytes`, type from `mimeType`, uploader from `uploaderId`, added timestamp). Add a note: "File content visible after source references are linked in a later analysis step." Do NOT attempt to fetch or display file content — that requires signed Storage URLs and is deferred to Story 2.2.
  - [ ] The panel must be accessible: use `role="region"` with an `aria-label` derived from the item title. Focus should not be trapped. The surrounding `aria-expanded` attribute on the toggle button must reflect expanded state.
- [x] Update the Context Package page to show history prominently. (AC: 1, 2, 3, 4)
  - [ ] Update `src/app/opportunities/[opportunityId]/context-package/page.tsx`:
    - Keep `requireRole()` and `getOpportunity` + `notFound()` pattern.
    - Fetch items with `listContextItemsChronological(opportunityId)` (ascending, for history view).
    - Restructure layout into two sections:
      1. **History section** (primary): `<ContextPackageHistoryTable items={items} />` rendered above the add form.
      2. **Add items section** (secondary): `<ContextPackageUploadForm opportunityId={opportunityId} initialItems={items} />` below the history (or in a collapsed/hidden panel when there are items already).
    - Actually: render BOTH sections always. History section at top (with heading "Context history"), upload form below (with heading "Add to this package"). On empty state, the history table shows its empty state text; the form shows normally.
  - [ ] Update `loading.tsx` at `context-package/loading.tsx` to show a more complete skeleton: history skeleton rows at top + form skeleton below.
- [x] Update the Opportunity overview page layout for AC3. (AC: 3, 4)
  - [x] Updated `src/app/opportunities/[opportunityId]/page.tsx` with two-column layout: left for metadata/form, right aside for workflow summary (context item count + "View Context Package" link). Fetches `listContextItemsChronological` for count.
  - [x] `error.tsx` at `[opportunityId]/error.tsx` verified — exists from Story 1.2. Handles AC4. No changes needed.
  - [x] `loading.tsx` at `[opportunityId]/loading.tsx` verified — exists from Story 1.2. No changes needed.
- [x] Write tests and run full validation gate. (AC: 1, 2, 3, 4)
  - [x] `context-package-history-table.test.ts` tests `getItemLabel` via `helpers.ts` — 5 cases pass.
  - [x] `npm test && npm run lint && npm run build` — 83 tests pass, 0 lint errors, build succeeds.

### Review Findings

- [x] [Review][Patch] `toLocaleDateString()` ignores `hour`/`minute` options — timestamps show date only, no time. Use `toLocaleString()` [src/features/context-packages/components/context-package-history-table.helpers.ts:7]
- [x] [Review][Patch] Double Firestore query on context-package page: `listContextItemsChronological` + `listContextItems` fetch same N documents twice (only sort differs). Fetch once, derive both orders in JS [src/app/opportunities/[opportunityId]/context-package/page.tsx:22]
- [x] [Review][Patch] Outer expand container div has `role="region"` — nested inside `ContextItemDetailPanel`'s own `role="region"` when expanded; redundant landmark. Remove `role` from outer container div [src/features/context-packages/components/context-package-history-table.tsx:62]
- [x] [Review][Defer] `createdAt` empty string fallback — pre-existing from Story 1.3 [src/features/context-packages/server/repository.ts:29] — deferred, pre-existing
- [x] [Review][Defer] Full Firestore query on overview page just for item count — optimization for later story — deferred, acceptable MVP

## Dev Notes

### Story Foundation

- **Epic:** Epic 1 — Secure Opportunity Intake Workspace. This is the FINAL story in Epic 1. After this, Epic 1 is complete. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1`]
- **FR coverage:** FR3 — Preserve Context Package history: time-ordered list, original vs later-added, side-pane inspection. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.4`]
- **Epic 1 completion:** After this story is done and reviewed, set `epic-1` status to `done` in sprint-status.yaml if all 4 stories are done.

### Current Repository State (from Stories 1.1–1.3)

- **Context items exist:** `listContextItems(opportunityId)` returns items `orderBy("createdAt", "desc")` from `opportunities/{opportunityId}/contextItems`. For history view add `listContextItemsChronological` with `asc` order. Do NOT change existing `listContextItems` — the upload form still uses it. [Source: `src/features/context-packages/server/repository.ts`]
- **ContextPackageUploadForm:** Already renders items inline (newest first). Story 1.4 does NOT change this component's item list — the history table is a separate component added to the context-package page alongside the form. [Source: `src/features/context-packages/components/context-package-upload-form.tsx`]
- **Opportunity overview page current state:** Shows `OpportunityOverviewHeader`, a "Context Package" nav tab, optional fit criteria section, and an edit metadata form. Story 1.4 adds a right-column workflow summary panel. [Source: `src/app/opportunities/[opportunityId]/page.tsx`]
- **Import convention (CRITICAL):** `@/` alias paths for Next.js webpack; `.ts` extension for native Node test runner. No `.js` extension in non-shim files. [Source: Story 1.2 debug log, confirmed in Stories 1.3]
- **Links:** Always `<Link>` from `next/link`, never `<a>` for internal navigation. [Source: Story 1.2 review]
- **Auth pattern:** `requireRole()` in Server Components/Actions; `getCurrentUser()` in Route Handlers. [Source: Story 1.3]
- **Test runner:** Native Node `--experimental-strip-types`. Component tests with browser APIs are NOT feasible — test pure helper logic only. [Source: Story 1.3 dev notes]
- **`getItemLabel` helper:** Export this function from the history table component so it can be tested in isolation. This is the only logic in the component that can be unit tested without JSDOM.

### Key Design Decisions

**"Original vs later-added" without Firestore schema changes:**  
Sort ascending. Item at index 0 (oldest) is "original". All others are "added later". The `createdAt` field already provides this information. No new Firestore field needed. One edge case: if there is only 1 item, it does NOT get the "Original" label (nothing meaningful to distinguish from). [Source: UX spec "original vs later-added", PRD FR3]

**No separate `history/` route:**  
The architecture shows `opportunities/[opportunityId]/history/page.tsx` but that route is for Opportunity run history (analysis jobs, generation events in later epics). Story 1.4's Context Package history lives within `context-package/page.tsx`. Do NOT create the `history/` route here. [Source: architecture directory structure, Epic 1 scope]

**File content NOT displayed:**  
For file-type context items, show only metadata (filename, size, type). Displaying actual file content requires a signed Firebase Storage URL — this is deferred to Story 2.2 when the Source Reference drawer is built. State this clearly in the detail panel: "File content visible after source references are linked in a later analysis step." [Source: architecture Deferred Decisions]

**Inline expand vs drawer:**  
The UX spec says "side pane or drawer." For MVP, an in-place accordion expansion below each item row is sufficient. The full Source Reference drawer with focus management and evidence-side-by-side display is Story 2.2. Accordion expansion satisfies AC2 without the complexity of a focus-trapping drawer. [Source: EXPERIENCE.md "Context item" component, "Source Reference drawer" deferred to Epic 2]

**Accessibility on expand toggle:**  
The toggle button on each row needs:
```tsx
<button
  type="button"
  aria-expanded={isExpanded}
  aria-controls={`detail-${item.id}`}
  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
>
  {isExpanded ? "Collapse" : "Inspect"}
</button>
<div id={`detail-${item.id}`} hidden={!isExpanded} role="region" aria-label={`Details: ${item.title}`}>
  {/* detail panel */}
</div>
```
This satisfies WCAG 2.2 AA for keyboard-accessible expand/collapse. [Source: EXPERIENCE.md Accessibility Floor]

### Architecture Compliance

- **Feature-first:** New component in `src/features/context-packages/components/`. Keep `context-package-history-table.tsx` and `context-item-detail-panel.tsx` there — not in `src/app`.
- **Server Component for data fetching:** The context-package page is a Server Component that fetches data. `ContextPackageHistoryTable` and `ContextItemDetailPanel` are Client Components (need `useState` for expand/collapse). Pass server-fetched `items` down as props.
- **No new Firestore collections or Storage calls:** This story is purely a READ and DISPLAY story. No writes, no new schema.
- **No new Route Handlers:** All data is read server-side in the page component.

### File Structure Requirements

**New files:**
- `src/features/context-packages/components/context-package-history-table.tsx`
- `src/features/context-packages/components/context-item-detail-panel.tsx`
- `src/features/context-packages/components/context-package-history-table.test.ts`

**Modified files:**
- `src/features/context-packages/server/repository.ts` — add `listContextItemsChronological`
- `src/app/opportunities/[opportunityId]/context-package/page.tsx` — add history table, restructure layout
- `src/app/opportunities/[opportunityId]/context-package/loading.tsx` — improve skeleton
- `src/app/opportunities/[opportunityId]/page.tsx` — add right-column workflow summary

**Unchanged (verify exist):**
- `src/app/opportunities/[opportunityId]/error.tsx` — handles AC4, already exists
- `src/app/opportunities/[opportunityId]/loading.tsx` — handles AC4 loading, already exists

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

### UX / Product Guardrails

- **Chronological order:** Oldest first in history table (ascending). This is the natural reading direction for history — original context at top. [Source: EXPERIENCE.md "Historical item browsing"]
- **"Original" label:** Only when more than one item exists. Single-item packages have no meaningful distinction. Short text badge or chip on the first row only. [Source: EXPERIENCE.md "original vs later-added"]
- **Content display:** `<pre>` or div with `white-space: pre-wrap` for text/note content. Preserves line breaks from original paste. [Source: UX constraint "raw source material is not edited inline"]
- **File content placeholder:** "File content visible after source references are linked in a later analysis step." — honest, explains WHY, points forward. No hype. [Source: EXPERIENCE.md Voice and Tone]
- **Layout AC3:** Desktop-first (`≥1280px`): two-column on overview (metadata left, workflow summary right). Collapses to single column on `<1280px` — use CSS (media queries or grid). [Source: EXPERIENCE.md Responsive & Platform]
- **Status chip colors:** Source type chips use trust-soft/trust palette. "Original" badge can use `success-soft`/`success` (green) to indicate it's the foundational material. [Source: DESIGN.md Colors]
- **No blank screen:** `error.tsx` and `loading.tsx` already ensure this for the opportunity route. Context Package page also has `loading.tsx`. Confirm all are present. [Source: AC4, EXPERIENCE.md State Patterns]

### Current State / What This Story Changes / What Must Be Preserved

**Current state:**
- Context Package page shows upload form + inline item list (newest first, pending+confirmed merged).
- Opportunity overview shows header, nav tab, optional fit criteria, edit form.
- No item detail inspection available.
- No chronological history view.

**What this story adds:**
- `listContextItemsChronological` (ascending order) to repository.
- `ContextPackageHistoryTable` — proper history view, oldest-first, "original" badge, expandable detail rows.
- `ContextItemDetailPanel` — inline read-only content display.
- Context Package page restructured: history section at top, upload form below.
- Opportunity overview right-column workflow summary (item count + link).

**What must be preserved:**
- All Stories 1.1–1.3 auth, upload, and CRUD functionality.
- `listContextItems` (desc) unchanged — used by upload form.
- `ContextPackageUploadForm` unchanged — its internal item list (newest first) stays.
- All `loading.tsx` and `error.tsx` files from previous stories.
- No Firestore schema changes.

### Testing Requirements

- Native Node `--experimental-strip-types` test runner. Import with `.ts` extension.
- Only test pure functions that don't require browser APIs or Firestore.
- **Target function to test:** Export `getItemLabel(index: number, total: number): string` from `context-package-history-table.tsx`. This is the only meaningful pure logic in the component.
- Test cases: `(0, 3) → "Original"`, `(1, 3) → ""`, `(2, 3) → ""`, `(0, 1) → ""` (single item no label).
- Run `npm test && npm run lint && npm run build` to confirm all pass.

### Anti-Patterns To Avoid

- Do **NOT** create the `opportunities/[opportunityId]/history/` route in this story — that is for Opportunity run history in a later epic.
- Do **NOT** fetch or display actual file content — requires signed Storage URLs; deferred to Story 2.2.
- Do **NOT** change `listContextItems` (desc) — the upload form depends on it.
- Do **NOT** make `ContextPackageHistoryTable` a Server Component — it needs `useState` for expand/collapse.
- Do **NOT** add a fully focus-trapping drawer for item detail — accordion expansion is sufficient for Story 1.4.
- Do **NOT** add any write operations — this story is read-only.
- Do **NOT** use `.js` extension for `@/`-aliased imports.
- Do **NOT** use `<a>` for internal links — use `<Link>`.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.4: Review Opportunity workspace and Context Package history`
- `_bmad-output/planning-artifacts/epics.md#Epic 1: Secure Opportunity Intake Workspace`
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-3: Preserve Context Package history`
- `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Components`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#State Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Accessibility Floor`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Responsive & Platform`
- `src/features/context-packages/server/repository.ts`
- `src/features/context-packages/components/context-package-upload-form.tsx`
- `src/app/opportunities/[opportunityId]/context-package/page.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`
- `src/app/opportunities/[opportunityId]/error.tsx`
- `src/app/opportunities/[opportunityId]/loading.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm test && npm run lint && npm run build` — 83 pass, 0 lint errors, build OK
- Node test runner can't load `.tsx` — extracted `getItemLabel`/`formatItemTimestamp` to `.helpers.ts` for testability
- `Promise.all([listContextItemsChronological, listContextItems])` in context-package page — parallel fetch for both views

### Completion Notes List

- Added `listContextItemsChronological` (asc order) to repository alongside existing `listContextItems` (desc) — no breaking change to upload form.
- `context-package-history-table.helpers.ts` exports `getItemLabel(index, total)` and `formatItemTimestamp` as pure functions — testable without JSDOM.
- `ContextPackageHistoryTable` (Client Component): ascending chronological list, "Original" badge on first item when >1 items, `aria-expanded`/`aria-controls` accessible accordion expand/collapse.
- `ContextItemDetailPanel`: read-only display — text/note shows `<pre>` content; file shows metadata + placeholder note for deferred file viewing.
- Context Package page restructured: two-column — history table at left, upload form at right.
- Opportunity overview page: two-column layout (metadata+form left, workflow summary aside right), shows context item count and link to Context Package.
- `error.tsx` and `loading.tsx` verified present from Story 1.2 — AC4 handled.
- 83 tests, 0 regressions.

### File List

- `_bmad-output/implementation-artifacts/1-4-review-opportunity-workspace-and-context-package-history.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/features/context-packages/server/repository.ts`
- `src/features/context-packages/components/context-package-history-table.helpers.ts`
- `src/features/context-packages/components/context-package-history-table.tsx`
- `src/features/context-packages/components/context-package-history-table.test.ts`
- `src/features/context-packages/components/context-item-detail-panel.tsx`
- `src/app/opportunities/[opportunityId]/context-package/page.tsx`
- `src/app/opportunities/[opportunityId]/context-package/loading.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`

### Change Log

- 2026-05-30: Story created from comprehensive analysis of epics, PRD, architecture, UX specs, and Stories 1.1–1.3 implementation state.
- 2026-05-30: Implemented chronological repository query, history table with "Original" badge and accordion expansion, item detail panel (read-only), restructured Context Package page layout, and updated Opportunity overview with two-column workflow summary.

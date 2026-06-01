---
baseline_commit: 53c36aa98059823230c18e292a532446e7a486f3
---

# Story 2.2: Inspect Source References and inferred items

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want to inspect the evidence behind extracted scope items,
so that I can judge whether each generated requirement, assumption, or risk is actually supportable.

## Acceptance Criteria

1. **Given** a generated Scope Brief item has supporting evidence  
   **When** the user opens its Source Reference  
   **Then** the system shows the supporting source material in a drawer or side-by-side evidence view  
   **And** the user remains anchored to the current review context.

2. **Given** a generated item lacks direct evidence  
   **When** it is shown in the review UI  
   **Then** the item is explicitly marked as inferred  
   **And** the lower-trust state is visible without relying on color alone.

3. **Given** the Source Reference drawer is opened from a review item  
   **When** the user closes it  
   **Then** focus returns to the control that opened it  
   **And** keyboard-only review remains uninterrupted.

4. **Given** a source reference is unavailable because of deletion or changed access  
   **When** the user tries to inspect it  
   **Then** the system explains why the evidence is unavailable  
   **And** the originating review context remains intact.

## Tasks / Subtasks

- [x] Fix `sourceContextItemIds` mapping bug from Story 2.1. (AC: 1, 4)
  - [ ] In `src/server/ai/analyze-context-package.ts`, the current line `sourceContextItemIds: item.sourceContextItemIds` stores Claude's 1-based string indices (e.g., `["1", "2"]`) directly. These are NOT Firestore IDs. Fix: map them to actual context item IDs during the parse step:
    ```ts
    sourceContextItemIds: item.sourceContextItemIds
      .map((idx) => items[parseInt(idx, 10) - 1]?.id ?? null)
      .filter((id): id is string => id !== null),
    ```
    Where `items` is the `ContextItem[]` array passed into `analyzeContextPackage`. This converts `"1"` → `items[0].id`, `"2"` → `items[1].id`, etc.
  - [ ] **Test**: add a unit test in `analyze-context-package.test.ts` that verifies index-to-ID mapping: given `items = [{ id: "ctx_A" }, { id: "ctx_B" }]` and Claude returns `sourceContextItemIds: ["1", "2"]`, the resulting ScopeItem should have `sourceContextItemIds: ["ctx_A", "ctx_B"]`.
  - [ ] **Note**: Existing Scope Briefs in Firestore will have stale string indices instead of real IDs. This is acceptable: the drawer will simply show "Source unavailable" for those items (handled by AC4). Only new analysis runs will produce correct IDs.
- [x] Add context items map to scope-brief page. (AC: 1, 4)
  - [ ] Update `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` to also fetch `listContextItemsChronological(opportunityId)` when a non-sparse `scopeBrief` exists.
  - [ ] Build a `Map<string, ContextItem>` keyed by `contextItem.id` for O(1) lookup.
  - [ ] Pass this map as `contextItemsMap` prop to `ScopeBriefPanel`.
  - [ ] If fetch fails (e.g., network error), pass an empty map — the drawer will show "Source unavailable" instead of crashing the page.
- [x] Build the Source Reference drawer component. (AC: 1, 2, 3, 4)
  - [ ] Create `src/features/context-packages/components/source-reference-drawer.tsx` as a Client Component.
  - [ ] Props: `item: ContextItem | null | undefined`, `isOpen: boolean`, `onClose: () => void`, `triggerRef: React.RefObject<HTMLElement>`.
  - [ ] When `isOpen && item`: render a drawer panel (right-side overlay or inline below the trigger) showing:
    - Source type chip (File / Text / Note)
    - Item title
    - Item content (for text/note: `<pre>` read-only); for file items: filename, size, "File content view coming soon." message
    - "Close" button with `aria-label="Close source reference"`
  - [ ] When `isOpen && !item`: render drawer with "Source unavailable. This reference may have been deleted or is no longer accessible." and "Close" button (AC4).
  - [ ] Dismiss/close: clicking "Close" button, pressing Escape key, clicking outside the drawer — all call `onClose`.
  - [ ] **Focus management** (AC3): on open, focus moves to the drawer's close button (or first focusable element). On close, `triggerRef.current?.focus()` returns focus to the originating button. Use `useEffect` on `isOpen` to manage focus.
  - [ ] `aria-modal="true"`, `role="dialog"`, `aria-label="Source reference"` on the drawer container.
  - [ ] Does NOT trap focus beyond the Escape key and clicking outside — the user can Tab out of the drawer (simple drawer, not a modal requiring full trap).
- [x] Refactor `ScopeBriefPanel` to render interactive `ScopeItemCard` components. (AC: 1, 2, 3)
  - [ ] `ScopeBriefPanel` (`src/features/scope-briefs/components/scope-brief-panel.tsx`) becomes a thin Server Component that accepts both `scopeBrief: ScopeBrief` and `contextItemsMap: Map<string, ContextItem>` (or `ReadonlyMap`) as props.
  - [ ] Extract the per-item rendering into a new Client Component: `src/features/scope-briefs/components/scope-item-card.tsx`.
  - [ ] `ScopeItemCard` props: `item: ScopeItem`, `contextItemsMap: Map<string, ContextItem>`.
  - [ ] `ScopeItemCard` manages its own `isDrawerOpen: boolean` state and `triggerRef`.
  - [ ] Layout: item content text, chips row (Inferred badge + reviewStatus badge), and — if `item.sourceContextItemIds.length > 0` — a "View source" button that opens the drawer.
  - [ ] **AC2 (non-color inferred marking)**: `item.inferred === true` → show `<span className="chip chip-warning">Inferred — no direct evidence</span>` (text-based label, not icon-only). The text "Inferred — no direct evidence" communicates trust level without relying on color.
  - [ ] **No source button if no IDs**: if `item.sourceContextItemIds.length === 0 && !item.inferred`, show no source button. If `item.sourceContextItemIds.length === 0 && item.inferred`, show no button (there's nothing to show).
  - [ ] `ScopeBriefPanel` serializes `contextItemsMap` (a `Map`) to a plain object `Record<string, ContextItem>` before passing to `ScopeItemCard` — Maps cannot be serialized as props in Next.js. Use `Object.fromEntries(contextItemsMap)` in the panel; the card reconstitutes lookup with `contextItemsRecord[id]`.
### Review Findings

- [x] [Review][Patch] `aria-controls="source-reference-drawer"` references non-existent ID — drawer div has no `id` attribute; add `id="source-reference-drawer"` to the drawer div [src/features/context-packages/components/source-reference-drawer.tsx:39]
- [x] [Review][Patch] Close button remains in tab order when drawer hidden — `aria-hidden` hides from AT but keyboard users can still focus it; add `tabIndex={-1}` to close button when `!isOpen` [src/features/context-packages/components/source-reference-drawer.tsx:48]

- [x] Write tests and run full validation gate. (AC: 1, 2, 3, 4)
  - [ ] Add unit test for the index-to-ID mapping fix in `analyze-context-package.test.ts`.
  - [ ] Run `npm test && npm run lint && npm run build` and confirm all pass.

## Dev Notes

### Story Foundation

- **Epic:** Epic 2 — Validated Scope Review and Risk Control. Story 2.2 adds evidence inspection on top of the Scope Brief created in Story 2.1. Story 2.3 will add accept/reject/edit actions to scope items. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2`]
- **FR coverage:** FR5 — Attach Source References to extracted items; inspect evidence; mark inferred items; handle unavailable sources. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.2`]

### CRITICAL BUG FROM STORY 2.1 — Fix First

`analyze-context-package.ts:105` stores Claude's 1-based string indices as `sourceContextItemIds`. Claude returns `["1", "2"]` meaning "context items at positions 1 and 2 in the prompt." The CURRENT code stores these strings directly in Firestore. They are NOT Firestore document IDs.

The fix:
```ts
// items is the ContextItem[] array passed into analyzeContextPackage
const scopeItems: ScopeItem[] = parsed.items.map((item, idx) => ({
  id: crypto.randomUUID(),
  category: item.category as ScopeCategory,
  content: item.content,
  inferred: item.inferred,
  reviewStatus: "pending" as const,
  sourceContextItemIds: item.sourceContextItemIds
    .map((strIdx) => items[parseInt(strIdx, 10) - 1]?.id ?? null)
    .filter((id): id is string => id !== null),
  editedContent: null,
}));
```

This must be the FIRST subtask. Without it, the drawer will never resolve source references for newly-generated briefs (it would get `"1"`, try to look up Firestore doc with id `"1"` — not found → "Source unavailable").

### Current Code State (from Story 2.1)

- **`analyzeContextPackage` signature**: `analyzeContextPackage(items: ContextItem[]): Promise<AnalysisResult>` — the `items` array IS available inside the function, so the mapping fix is straightforward. [Source: `src/server/ai/analyze-context-package.ts`]
- **`ScopeBriefPanel`**: currently a Server Component that renders items directly with hardcoded "Inferred" chip. No interactive state. No source reference button. Must be refactored to accept `contextItemsMap` and render `ScopeItemCard` (Client Component). [Source: `src/features/scope-briefs/components/scope-brief-panel.tsx`]
- **`scope-brief/page.tsx`**: fetches `scopeBrief` and passes to `ScopeBriefPanel`. Must also fetch context items and build the map. Existing `requireRole()` + `getOpportunity` + session pattern preserved. [Source: `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`]
- **`listContextItemsChronological`**: exists in `src/features/context-packages/server/repository.ts` — use this for the fetch (returns `ContextItem[]` sorted oldest-first, doesn't matter for this use case since we're building a map). [Source: Story 1.4]

### Technical Requirements — Map Serialization

React / Next.js Server Components serialize props to JSON. `Map<K, V>` is NOT JSON-serializable — it becomes `{}`. Use a plain object instead:

```ts
// In scope-brief/page.tsx (Server Component):
const contextItems = await listContextItemsChronological(opportunityId);
const contextItemsRecord: Record<string, ContextItem> = Object.fromEntries(
  contextItems.map((item) => [item.id, item])
);
// Pass to ScopeBriefPanel as contextItemsRecord prop
```

```ts
// In ScopeItemCard (Client Component):
// Receives contextItemsRecord: Record<string, ContextItem>
const sourceItem = contextItemsRecord[sourceId]; // O(1) lookup
```

### Technical Requirements — Focus Management

Source Reference drawer focus management must work for keyboard users (AC3):

```ts
// In ScopeItemCard (Client Component):
const triggerRef = useRef<HTMLButtonElement>(null);
const [isDrawerOpen, setIsDrawerOpen] = useState(false);

function openDrawer() { setIsDrawerOpen(true); }
function closeDrawer() {
  setIsDrawerOpen(false);
  // Focus return happens in SourceReferenceDrawer's onClose callback
  triggerRef.current?.focus();
}
```

```ts
// In SourceReferenceDrawer (Client Component):
const closeButtonRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  if (isOpen) {
    closeButtonRef.current?.focus();  // Focus moves to drawer on open
  }
}, [isOpen]);
// On Escape key: call onClose
useEffect(() => {
  if (!isOpen) return;
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [isOpen, onClose]);
```

### Technical Requirements — Drawer Positioning

For MVP, implement as a fixed right-side panel that slides in over the content (not a modal overlay). This avoids scroll anchoring complexity while keeping the review context visible.

```tsx
<div
  className={`source-reference-drawer${isOpen ? " source-reference-drawer--open" : ""}`}
  role="dialog"
  aria-modal="true"
  aria-label="Source reference"
  aria-hidden={!isOpen}
>
  {/* content */}
</div>
```

The CSS class toggles `transform: translateX(0)` / `translateX(100%)` with a transition. Use the `source-reference-drawer` component token from DESIGN.md: `background: #FFFFFF, border: 1px solid #D7DEE7, radius: 14px`.

For focus trap: do NOT implement a full focus trap (too complex for MVP). Use Escape key to close and return focus. [Source: UX spec, story notes — "simple drawer, not a modal requiring full trap"]

### Architecture Compliance

- `source-reference-drawer.tsx` lives in `src/features/context-packages/components/` — the architecture names this file explicitly. [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- `scope-item-card.tsx` lives in `src/features/scope-briefs/components/` — feature-first placement.
- Server Components CAN render Client Components — `ScopeBriefPanel` (Server) can render `ScopeItemCard` (Client) directly. No "use client" needed in the panel.
- **Do NOT** import server-only modules (repository, admin SDK) into `ScopeItemCard` or `SourceReferenceDrawer`. Context items are pre-fetched server-side and passed as props.
- **Do NOT** add a Route Handler for fetching individual context items — pass them all at page render time. For MVP with pilot-sized packages (< 25 items), this is efficient.

### File Structure Requirements

**Modified files:**
- `src/server/ai/analyze-context-package.ts` — fix `sourceContextItemIds` mapping
- `src/server/ai/analyze-context-package.test.ts` — add mapping unit test
- `src/features/scope-briefs/components/scope-brief-panel.tsx` — refactor to accept contextItemsRecord, render ScopeItemCard
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` — fetch context items, build record, pass to panel

**New files:**
- `src/features/context-packages/components/source-reference-drawer.tsx`
- `src/features/scope-briefs/components/scope-item-card.tsx`

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

### UX / Product Guardrails

- **AC2 non-color inferred marking**: "Inferred — no direct evidence" as text label inside chip. Color alone (warning-soft background) is NOT sufficient per WCAG 2.2 AA. [Source: EXPERIENCE.md Accessibility Floor, Trust and Evidence Model]
- **"Source available." vs "Inferred"**: items with `sourceContextItemIds.length > 0` get a "View source" button (trust-backed). Items with `inferred: true` get the "Inferred — no direct evidence" chip. Both can be true simultaneously (item is inferred but Claude cited a source anyway — show both). [Source: UX Trust and Evidence Model]
- **Drawer microcopy**: "Source unavailable." (not "Error") for missing items. "Source available." (not "View evidence") for the button — short, declarative. [Source: EXPERIENCE.md Voice and Tone]
- **Focus return on close** — mandatory for WCAG 2.2 AA. [Source: EXPERIENCE.md Accessibility Floor]
- **Context intact on close**: closing the drawer must NOT scroll the page or change which item is in view. This is handled by CSS positioning (drawer is overlaid, not inline). [Source: AC1 "user remains anchored to the current review context"]

### Current State / What This Story Changes / What Must Be Preserved

**Current state:**
- `ScopeBriefPanel` renders items statically, no interactivity. `sourceContextItemIds` in Firestore contains stale string indices (`["1", "2"]`).
- No Source Reference drawer exists.
- "Inferred" chip exists but is color-only (chip-warning background).

**What this story changes:**
- Fixes `sourceContextItemIds` to store actual Firestore IDs for future analysis runs.
- Adds Source Reference drawer with focus management.
- Refactors `ScopeBriefPanel` to render `ScopeItemCard` (Client Component) per item.
- Updates "Inferred" chip to include descriptive text.

**What must be preserved:**
- All Story 2.1 analysis pipeline (`analyzeContextPackage`, Route Handlers, repositories) — only the `sourceContextItemIds` mapping line changes.
- `ScopeBriefPanel` must still render the same categories and confidence display.
- `scope-brief/page.tsx` auth pattern (`requireRole()`, session, ownership check) unchanged.
- Existing `scopeBrief.sparseInput` and `showRetry` logic unchanged.
- All imports and test patterns from Stories 1.x and 2.1.

### Testing Requirements

- Native Node runner, `.ts` imports in test files.
- **Unit test** for index-to-ID mapping in `analyze-context-package.test.ts`:
  ```ts
  it("maps 1-based string indices to actual context item IDs", async () => {
    // Mock getAnthropicClient to return a fixed response with sourceContextItemIds: ["1", "2"]
    // Pass items = [{ id: "ctx_A", ... }, { id: "ctx_B", ... }]
    // Assert result.items[0].sourceContextItemIds = ["ctx_A", "ctx_B"]
  });
  ```
  Since mocking `getAnthropicClient` is complex with ESM, test the mapping logic in isolation: extract a `mapSourceIndices(indices: string[], items: ContextItem[]): string[]` helper into `analyze-context-package.helpers.ts` and test it directly.
- Run `npm test && npm run lint && npm run build` before marking complete.

### Anti-Patterns To Avoid

- Do **NOT** fetch individual context items on demand (per-drawer) — fetch all at page render and pass as record. [Performance]
- Do **NOT** store `Map<K, V>` as a prop between Server and Client Components — use plain `Record<string, V>`. [Serialization]
- Do **NOT** implement a full focus trap in the drawer — Escape + focus return on close is sufficient for this MVP drawer. [Complexity]
- Do **NOT** rely on color alone for the "Inferred" state — add text label. [Accessibility]
- Do **NOT** change the `analyze-context-package.ts` function signature — only modify the `sourceContextItemIds` mapping line inside the function body. [Compatibility]
- Do **NOT** break existing tests — the `analyze-context-package.test.ts` sparse-input tests should still pass after the mapping fix.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.2: Inspect Source References and inferred items`
- `_bmad-output/planning-artifacts/epics.md#Epic 2: Validated Scope Review and Risk Control`
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-5: Attach Source References to extracted items`
- `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Components`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#State Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Accessibility Floor`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Trust and Evidence Model`
- `src/server/ai/analyze-context-package.ts`
- `src/server/ai/analyze-context-package.helpers.ts`
- `src/server/ai/analyze-context-package.test.ts`
- `src/features/scope-briefs/components/scope-brief-panel.tsx`
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`
- `src/features/context-packages/server/repository.ts`
- `src/features/context-packages/types.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm test && npm run lint && npm run build` — 108 pass, 0 errors, build OK
- `mapSourceIndices` added to `.helpers.ts`; imported in both `analyze-context-package.ts` and the test file
- `ScopeItemCard` renders drawer inline per item (each item gets its own drawer state)
- `Record<string, ContextItem>` passed as prop — Map not JSON-serializable across Server→Client boundary

### Completion Notes List

- `mapSourceIndices(indices, items)` helper: converts Claude's 1-based string indices (e.g., `["1","2"]`) to actual Firestore context item IDs. Skips out-of-range indices silently.
- `analyze-context-package.ts`: fixed `sourceContextItemIds` line to call `mapSourceIndices` — future analysis runs store real Firestore IDs.
- `scope-brief/page.tsx`: fetches context items when non-sparse brief exists; builds `Record<string, ContextItem>` for O(1) lookup; passes to `ScopeBriefPanel`; fetch failure non-fatal.
- `SourceReferenceDrawer`: focus moves to Close button on open; Escape key closes; `triggerRef.current?.focus()` returns focus on close (AC3). Shows "Source unavailable." when item is null (AC4). File items show metadata + placeholder text.
- `ScopeItemCard` (Client Component): manages `drawerOpen` + `activeSourceId` state + `triggerRef`. "Inferred — no direct evidence" text label (not color-only — AC2). "View source" button with `aria-expanded`/`aria-controls`.
- `ScopeBriefPanel` refactored: accepts `contextItemsRecord` prop, renders `ScopeItemCard` per item.
- 108 tests, 0 regressions.

### File List

- `_bmad-output/implementation-artifacts/2-2-inspect-source-references-and-inferred-items.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/server/ai/analyze-context-package.helpers.ts`
- `src/server/ai/analyze-context-package.ts`
- `src/server/ai/analyze-context-package.test.ts`
- `src/features/context-packages/components/source-reference-drawer.tsx`
- `src/features/scope-briefs/components/scope-item-card.tsx`
- `src/features/scope-briefs/components/scope-brief-panel.tsx`
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`

### Change Log

- 2026-05-31: Story created from Story 2.1 implementation analysis, bug identification, and epics/architecture/UX spec review.
- 2026-05-31: Fixed `sourceContextItemIds` mapping bug (indices→IDs via `mapSourceIndices`); built Source Reference drawer with focus management; refactored `ScopeBriefPanel` into `ScopeItemCard` Client Components with interactive drawer per item.

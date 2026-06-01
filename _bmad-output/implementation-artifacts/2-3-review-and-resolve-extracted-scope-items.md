---
baseline_commit: "53c36aa98059823230c18e292a532446e7a486f3"
---

# Story 2.3: Review and resolve extracted scope items

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want to accept, edit, reject, or flag extracted scope items,
so that the Scope Brief becomes a trusted internal artifact instead of raw generated output.

## Acceptance Criteria

1. **Given** a draft Scope Brief contains generated items  
   **When** the user reviews them  
   **Then** each item can be accepted, edited, rejected, or flagged  
   **And** the chosen decision is persisted with audit context.

2. **Given** the user is actively reviewing items  
   **When** the Validation Review UI is rendered  
   **Then** the current item remains anchored in view with progress shown against the total review set  
   **And** review actions remain reachable through a persistent action bar.

3. **Given** one or more generated items remain unreviewed  
   **When** the user attempts to complete Validation Review  
   **Then** the system blocks completion  
   **And** it identifies that review is still incomplete.

4. **Given** an item has been rejected  
   **When** downstream artifacts are later generated  
   **Then** the rejected item is excluded by default  
   **And** it only re-enters the trusted scope if the user explicitly restores it later.

## Tasks / Subtasks

- [x] Add `updateScopeItemInBrief` to Scope Brief repository. (AC: 1, 4)
  - [x] Add to `src/features/scope-briefs/server/repository.ts`:
    ```ts
    export async function updateScopeItemInBrief(
      scopeBriefId: string,
      itemId: string,
      update: { reviewStatus: ReviewStatus; editedContent?: string | null },
    ): Promise<void>
    ```
  - [x] Implementation: read the full Scope Brief document, find the item by `id`, update its `reviewStatus` (and `editedContent` if provided), write the entire `items` array back to Firestore. Use `doc.update({ items: updatedItems })`.
  - [x] Validation: if `reviewStatus === "edited"` but `editedContent` is empty/null, throw with `code: "VALIDATION_ERROR"`.
  - [x] No new Firestore index needed — this is a document read + update on a known ID.
  - [x] Add `updateScopeBriefStatus(scopeBriefId: string, status: "draft" | "approved"): Promise<void>` for completing review.
- [x] Implement review Server Actions. (AC: 1, 3, 4)
  - [x] Create `src/features/scope-briefs/server/actions.ts` with:
    - **`updateScopeItemAction(formData: unknown)`**: validates `{ scopeBriefId, itemId, reviewStatus, editedContent? }`, calls `requireRole()`, verifies the Scope Brief's `opportunityId` belongs to the session user (via `getOpportunity`), calls `updateScopeItemInBrief`. Returns `{ data: { itemId } }` or `{ error: { code, message } }`.
    - **`approveScopeBriefAction(formData: unknown)`**: validates `{ scopeBriefId }`, calls `requireRole()`, fetches the Scope Brief, verifies ownership, checks that NO items have `reviewStatus === "pending"` — if any pending items remain, return `{ error: { code: "REVIEW_INCOMPLETE", message: "N item(s) still need review." } }`. If all reviewed, call `updateScopeBriefStatus(scopeBriefId, "approved")` and return `{ data: { scopeBriefId } }`.
  - [x] The input schema for `updateScopeItemAction`: `z.object({ scopeBriefId: z.string().min(1), itemId: z.string().min(1), reviewStatus: z.enum(REVIEW_STATUSES), editedContent: z.string().optional() })`. Use `REVIEW_STATUSES` from `scope-brief.ts`.
  - [x] Test: create `src/features/scope-briefs/server/actions.test.ts` with schema tests for `updateScopeItemAction` input — validates required fields, rejects unknown `reviewStatus`, requires `editedContent` when `reviewStatus === "edited"` (schema-level: `editedContent` is optional in schema, validation is in repository layer for this rule).
- [x] Update `ScopeItemCard` to render review action buttons. (AC: 1, 2, 4)
  - [x] `ScopeItemCard` (`src/features/scope-briefs/components/scope-item-card.tsx`) is already a Client Component. Add `scopeBriefId: string` prop.
  - [x] Add review action UI below the existing content+chips:
    - If `item.reviewStatus === "pending"`: show four action buttons: **Accept**, **Edit**, **Reject**, **Flag**.
    - If `item.reviewStatus === "accepted"`: show green "Accepted" badge. Show a "Change" button (sets back to pending) — optional for MVP; acceptable to not include.
    - If `item.reviewStatus === "rejected"`: show red "Rejected" badge + **Restore** button (sets `reviewStatus = "pending"`).
    - If `item.reviewStatus === "edited"`: show blue "Edited" badge + the `editedContent` text in a read-only display.
    - If `item.reviewStatus === "flagged"`: show warning "Flagged" badge.
  - [x] **Edit mode**: clicking "Edit" shows an inline `<textarea>` pre-populated with `item.editedContent ?? item.content`. On submit: sets `reviewStatus = "edited"`, `editedContent = textarea value`. On cancel: hides the textarea.
  - [x] Use `useActionState` wired to a bound `updateScopeItemAction` call. On success: `router.refresh()` to reload server-fetched data. On error: show inline error message.
  - [x] Buttons must be keyboard-accessible. Disable all action buttons while action is in flight (`isPending`).
  - [x] The "View source" button from Story 2.2 must still work — do not break the `SourceReferenceDrawer` integration.
- [x] Update `ScopeBriefPanel` to show review progress and approve button. (AC: 2, 3)
  - [x] `ScopeBriefPanel` (`src/features/scope-briefs/components/scope-brief-panel.tsx`) receives `scopeBriefId` as a new prop (in addition to `scopeBrief` and `contextItemsRecord`).
  - [x] Compute review progress in the Server Component: `reviewedCount = items.filter(i => i.reviewStatus !== "pending").length` and `totalItems = items.length`.
  - [x] Add a progress summary at the top: e.g., `"N of M items reviewed"`. Use a `<progress>` element with `aria-valuenow={reviewedCount}` and `aria-valuemax={totalItems}` for accessibility.
  - [x] Add a sticky-bottom or end-of-panel `ApproveScopeBriefButton` Client Component (new file: `src/features/scope-briefs/components/approve-scope-brief-button.tsx`) that:
    - Receives `scopeBriefId`, `pendingCount`, `currentStatus`.
    - If `pendingCount > 0`: shows "Approve Scope Brief" button as `disabled` with a visible note: `"N item(s) still need review."` (AC3 requirement — must identify what's incomplete).
    - If `pendingCount === 0 && currentStatus !== "approved"`: shows "Approve Scope Brief" primary button (enabled). On click: calls `approveScopeBriefAction({ scopeBriefId })`. On success: `router.refresh()`. On error: shows inline error.
    - If `currentStatus === "approved"`: shows "Scope Brief approved ✓" state, no button.
  - [x] Pass `scopeBriefId` from `scope-brief/page.tsx` to `ScopeBriefPanel`.
  - [x] Pass `scopeBriefId` from `ScopeBriefPanel` to each `ScopeItemCard`.
- [x] Write tests and run full validation gate. (AC: 1, 2, 3)
  - [x] Schema tests in `actions.test.ts`: valid updateScopeItemAction input, missing fields rejected, unknown reviewStatus rejected.
  - [x] Run `npm test && npm run lint && npm run build` and confirm all pass.

## Review Findings

Code review (2026-05-31) — 3 layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor. All four ACs confirmed satisfied by the Acceptance Auditor.

**Patches applied:**

- [x] [Review][Patch] Reject whitespace-only `editedContent` in `updateScopeItemInBrief` [src/features/scope-briefs/server/repository.ts] — guard now also rejects `.trim().length === 0`, preventing blank edited items that still count as reviewed.
- [x] [Review][Patch] Fix `approveBoundAction` signature + `useActionState<ApproveState, FormData>` contract [src/features/scope-briefs/components/approve-scope-brief-button.tsx] — form-action payload now correctly typed.
- [x] [Review][Patch] Guard zero-item approval and `<progress max=0>` [src/features/scope-briefs/server/actions.ts, src/features/scope-briefs/components/scope-brief-panel.tsx] — approve action rejects empty briefs; progress uses `Math.max(totalItems, 1)`.

**Deferred (see deferred-work.md):**

- [x] [Review][Defer] Lost-update race in `updateScopeItemInBrief` read-modify-write [src/features/scope-briefs/server/repository.ts] — deferred; spec explicitly accepts for MVP single-user pilot; use Firestore transaction for multi-user.
- [x] [Review][Defer] TOCTOU between approve gate and concurrent item update [src/features/scope-briefs/server/actions.ts] — deferred; same single-user MVP assumption; resolve with transaction.
- [x] [Review][Defer] `getLatestScopeBriefForOpportunity` `orderBy(createdAt)` may hide brief with pending serverTimestamp [src/features/scope-briefs/server/repository.ts] — deferred; pre-existing (Story 2.1), not caused by 2.3.
- [x] [Review][Defer] Items remain editable after brief approved (no lock) [src/features/scope-briefs/components/scope-item-card.tsx] — deferred; AC4 implies post-approval restore is expected; locking is a product decision out of 2.3 scope.

**Dismissed (noise / by-design):** AC1 audit-context metadata (no audit fields defined in spec/`scopeItemSchema`); approve action bar end-of-panel vs sticky (task explicitly permits either).

## Dev Notes

### Story Foundation

- **Epic:** Epic 2 — Validated Scope Review and Risk Control. Story 2.3 adds review actions on top of the display built in Stories 2.1+2.2. Story 2.4 will compute Scope Confidence and no-promise gating based on the review state created here. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2`]
- **FR coverage:** FR6 — accept, edit, reject, flag; each decision persisted; completion blocked while items unreviewed; rejected items excluded from downstream artifacts. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.3`]
- **Downstream dependency:** Story 2.4 uses `reviewStatus` to compute confidence. Items with `reviewStatus === "rejected"` are excluded from derived artifacts. The `editedContent` field is used in place of `content` for downstream processing when `reviewStatus === "edited"`. Do NOT implement confidence computation now.

### Current Repository State (from Stories 2.1–2.2)

- **`ScopeItemCard`** is a Client Component in `src/features/scope-briefs/components/scope-item-card.tsx`. Currently shows content, chips (Inferred / reviewStatus), View source button, and SourceReferenceDrawer. Story 2.3 ADDS review action buttons below the existing chip row. Do NOT break the drawer. [Source: Story 2.2]
- **`ScopeBriefPanel`** is a Server Component in `src/features/scope-briefs/components/scope-brief-panel.tsx`. Currently receives `scopeBrief` and `contextItemsRecord`. Story 2.3 adds `scopeBriefId` prop. [Source: Story 2.2]
- **`scope-brief/page.tsx`**: already passes `scopeBrief` and `contextItemsRecord` to panel. Add `scopeBriefId={scopeBrief.id}` to the `<ScopeBriefPanel>` call. [Source: Story 2.2]
- **`scopeBriefSchema`**: `items` is a Zod array of `scopeItemSchema`. Each item has `reviewStatus: z.enum(REVIEW_STATUSES)` with values `["pending","accepted","rejected","edited","flagged"]` and `editedContent: z.string().nullable().optional()`. [Source: Story 2.1]
- **`getScopeBrief(id)`** and `updateScopeItemInBrief` can reuse the existing `db.collection("scopeBriefs").doc(id)` pattern. [Source: `src/features/scope-briefs/server/repository.ts`]
- **Auth pattern**: `requireRole()` in Server Actions. [Source: Stories 1.x–2.x]
- **Test patterns**: `.ts` imports in test files, pure helper functions in `.helpers.ts`, no browser APIs in tests. [Source: Stories 1.4, 2.1, 2.2]
- **`useActionState` pattern**: same as Stories 1.2 (form actions) and 2.2 (ScopeItemCard already uses it via `openDrawer`). [Source: Stories 1.2, 2.1]
- **`router.refresh()` on success**: established pattern from Story 2.2 upload form and job polling. [Source: Stories 1.3, 2.1, 2.2]

### Technical Requirements — `updateScopeItemInBrief` Implementation

Items are stored as an embedded array in the Scope Brief document. To update one item:

```ts
export async function updateScopeItemInBrief(
  scopeBriefId: string,
  itemId: string,
  update: { reviewStatus: ReviewStatus; editedContent?: string | null },
): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection("scopeBriefs").doc(scopeBriefId);
  const snap = await ref.get();
  if (!snap.exists) throw Object.assign(new Error("Scope Brief not found."), { code: "NOT_FOUND" });
  const data = snap.data()!;
  const items: ScopeItem[] = data.items ?? [];
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) throw Object.assign(new Error("Item not found."), { code: "NOT_FOUND" });
  items[idx] = {
    ...items[idx]!,
    reviewStatus: update.reviewStatus,
    editedContent: update.reviewStatus === "edited" ? (update.editedContent ?? null) : items[idx]!.editedContent,
  };
  await ref.update({ items });
}
```

**Note**: This is a read-modify-write on the items array. Race condition if two users review simultaneously (acceptable for MVP single-user pilot). Use Firestore transactions for multi-user scenarios.

### Technical Requirements — `ScopeItemCard` Review Actions

The review actions are added to the existing `ScopeItemCard`. The `scopeBriefId` prop is needed to pass to the server action. Key states:

```tsx
// State
const [editMode, setEditMode] = useState(false);
const [editText, setEditText] = useState(item.editedContent ?? item.content);

// Bound server action
const reviewBoundAction = async (prev: ReviewState, fd: FormData): Promise<ReviewState> => {
  const result = await updateScopeItemAction({
    scopeBriefId,
    itemId: item.id,
    reviewStatus: fd.get("reviewStatus") as string,
    editedContent: fd.get("editedContent") as string ?? undefined,
  });
  if ("error" in result) return { status: "error", message: result.error.message };
  router.refresh();
  return { status: "success" };
};
const [reviewState, reviewDispatch, isReviewing] = useActionState(reviewBoundAction, { status: "idle" });
```

Each action button submits a hidden form with `reviewStatus` as a hidden field:
```tsx
<form action={reviewDispatch}>
  <input type="hidden" name="reviewStatus" value="accepted" />
  <button type="submit" disabled={isReviewing}>Accept</button>
</form>
```

For "Edit": toggle `editMode` locally first, submit with `reviewStatus=edited` and `editedContent=editText` when user confirms.

### Technical Requirements — `ApproveScopeBriefButton` Server Action Schema

```ts
const approveScopeSchema = z.object({ scopeBriefId: z.string().min(1) });

export async function approveScopeBriefAction(formData: unknown): Promise<ActionResult<{ scopeBriefId: string }>> {
  const session = await requireRole();
  const parsed = approveScopeSchema.safeParse(formData);
  if (!parsed.success) return { error: { code: "VALIDATION_ERROR", message: "..." } };
  
  const scopeBrief = await getScopeBrief(parsed.data.scopeBriefId);
  if (!scopeBrief) return { error: { code: "NOT_FOUND", message: "Scope Brief not found." } };
  
  const opportunity = await getOpportunity(scopeBrief.opportunityId);
  if (!opportunity || opportunity.createdByUserId !== session.uid) {
    return { error: { code: "FORBIDDEN", message: "..." } };
  }
  
  const pendingCount = scopeBrief.items.filter((i) => i.reviewStatus === "pending").length;
  if (pendingCount > 0) {
    return { error: { code: "REVIEW_INCOMPLETE", message: `${pendingCount} item(s) still need review.` } };
  }
  
  await updateScopeBriefStatus(parsed.data.scopeBriefId, "approved");
  return { data: { scopeBriefId: parsed.data.scopeBriefId } };
}
```

### Architecture Compliance

- **Server Actions** for mutations (review update, approve) — not Route Handlers. [Source: architecture API & Communication Patterns]
- **`requireRole()` in Server Actions**, NOT in Client Components. [Source: Story 1.3+]
- **`router.refresh()`** after successful action to reload server-fetched scope brief data. [Source: Story 2.2 pattern]
- **Do NOT pre-implement confidence or no-promise gating** — Story 2.4 owns that. Story 2.3 only persists `reviewStatus`.
- **AC4 note**: "rejected items excluded from downstream artifacts" — this constraint is enforced IN STORY 2.4+ when generating derived artifacts. Story 2.3 only needs to SET the status correctly; downstream exclusion logic belongs in the generation pipelines.

### File Structure Requirements

**New files:**
- `src/features/scope-briefs/server/actions.ts`
- `src/features/scope-briefs/server/actions.test.ts`
- `src/features/scope-briefs/components/approve-scope-brief-button.tsx`

**Modified files:**
- `src/features/scope-briefs/server/repository.ts` — add `updateScopeItemInBrief`, `updateScopeBriefStatus`
- `src/features/scope-briefs/components/scope-item-card.tsx` — add `scopeBriefId` prop + review action buttons
- `src/features/scope-briefs/components/scope-brief-panel.tsx` — add `scopeBriefId` prop, progress bar, approve button
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` — pass `scopeBriefId` to panel

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

### UX / Product Guardrails

- **Review action bar**: "Accept, Edit, Reject, Flag" — consistent order, all visible without scrolling per item. [Source: EXPERIENCE.md Component Patterns "Review action bar — Must remain reachable without scrolling back to the top."]
- **Rejected items visual state**: `reviewStatus === "rejected"` chip shows "Rejected" — use `danger-soft` background and `danger` color. Add "Restore" button to allow AC4 restoration. [Source: DESIGN.md Colors]
- **Accepted items**: `chip-success` background. No further action needed unless user wants to change decision.
- **Edited items**: show `editedContent` in the card body (NOT `content`). Source references still show original content from context items. [Source: UX Trust and Evidence Model]
- **Progress bar accessibility**: `<progress value={reviewedCount} max={totalItems} aria-valuenow={reviewedCount} aria-valuemax={totalItems} aria-label="Review progress">`. Add visible text e.g. `"5 of 12 reviewed"`. Never color-only. [Source: EXPERIENCE.md Accessibility Floor]
- **"Approve" button microcopy**: "Approve Scope Brief" — direct, names the action. Not "Looks good" or "Submit." [Source: EXPERIENCE.md Voice and Tone]
- **Blocked approve button text**: "Approve Scope Brief" (disabled) with visible count `"N item(s) still need review."` below. Not a tooltip-only block. [Source: AC3, EXPERIENCE.md — status never hidden]

### Testing Requirements

- `actions.test.ts`: schema validation tests (not integration tests — same native runner pattern as other `.test.ts` files).
- Key test cases: valid `updateScopeItemAction` input passes, missing `scopeBriefId` fails, unknown `reviewStatus` fails, valid `approveScopeSchema` passes.
- Run `npm test && npm run lint && npm run build` before marking complete.

### Anti-Patterns To Avoid

- Do **NOT** implement confidence computation (no-promise gating) — Story 2.4.
- Do **NOT** create a Route Handler for review updates — use Server Actions.
- Do **NOT** use `replace()` on the full items array without reading first — must preserve all other fields.
- Do **NOT** delete rejected items — only change `reviewStatus`. AC4 requires restoration to be possible.
- Do **NOT** pass `Map<>` between Server and Client Components — use `Record<>`. [Story 2.2 lesson]
- Do **NOT** break `SourceReferenceDrawer` integration — Story 2.2's "View source" button must still work.
- Do **NOT** skip progress bar on small review sets — even 1-item briefs need the progress display for AC2.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.3: Review and resolve extracted scope items`
- `_bmad-output/planning-artifacts/epics.md#Epic 2: Validated Scope Review and Risk Control`
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-6: Support Validation Review actions`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Component Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#State Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Colors`
- `src/features/scope-briefs/server/repository.ts`
- `src/features/scope-briefs/schemas/scope-brief.ts`
- `src/features/scope-briefs/components/scope-item-card.tsx`
- `src/features/scope-briefs/components/scope-brief-panel.tsx`
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Target: story 2-3 (builds on Stories 2.1+2.2 review display infrastructure).
- Items stored as embedded array in Scope Brief doc — `updateScopeItemInBrief` reads full doc, modifies, writes back.
- AC4 note: rejected item exclusion is enforcement in FUTURE artifact generation stories; Story 2.3 only sets the status correctly.
- Implemented `updateScopeItemInBrief` (read-modify-write items array, VALIDATION_ERROR when edited content missing) and `updateScopeBriefStatus` in repository.
- Added Server Actions `updateScopeItemAction` and `approveScopeBriefAction` with `requireRole()` + ownership checks via `getOpportunity`. Approve returns `REVIEW_INCOMPLETE` (with count) while any item is pending (AC3).
- Review input schemas (`updateScopeItemSchema`, `approveScopeSchema`) placed in `schemas/scope-brief.ts` (not a separate file) because `"use server"` modules may only export async functions; schema tests import them directly.
- `ScopeItemCard`: added `scopeBriefId` prop and Accept/Edit/Reject/Flag actions (pending), inline edit textarea, Restore (rejected), Change (accepted/flagged), Edit again (edited). Edited items render `editedContent`; SourceReferenceDrawer "View source" untouched. Buttons disabled while `isReviewing`.
- `ScopeBriefPanel`: computes `reviewedCount`/`totalItems`, renders accessible `<progress>` with visible "N of M items reviewed", and `ApproveScopeBriefButton` at panel end. `scopeBriefId` threaded from page → panel → cards.
- Validation gate green: `npm test` (117 pass, incl. 9 new schema tests), `npm run lint` clean, `npm run build` compiled successfully.

### File List

- `src/features/scope-briefs/server/repository.ts` — added `updateScopeItemInBrief`, `updateScopeBriefStatus`
- `src/features/scope-briefs/schemas/scope-brief.ts` — added `updateScopeItemSchema`, `approveScopeSchema` + inferred types
- `src/features/scope-briefs/server/actions.ts` — new: `updateScopeItemAction`, `approveScopeBriefAction`
- `src/features/scope-briefs/server/actions.test.ts` — new: schema validation tests
- `src/features/scope-briefs/components/scope-item-card.tsx` — added `scopeBriefId` prop + review action buttons / edit mode
- `src/features/scope-briefs/components/scope-brief-panel.tsx` — added `scopeBriefId` prop, review progress, approve button
- `src/features/scope-briefs/components/approve-scope-brief-button.tsx` — new: approve button Client Component
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` — pass `scopeBriefId` to panel
- `src/app/globals.css` — styles for review actions, progress, approve, and status chips

### Change Log

- 2026-05-31: Story created from Stories 2.1+2.2 analysis, epics, and UX spec review.
- 2026-05-31: Implemented review actions (accept/edit/reject/flag/restore), approve gating, review progress; all tasks complete; tests/lint/build pass. Status → review.
- 2026-05-31: Code review (3 layers). Applied 3 patches (whitespace editedContent guard, approve button type contract, zero-item/progress guard); 4 findings deferred, 2 dismissed; tests/lint/build re-verified. Status → done.

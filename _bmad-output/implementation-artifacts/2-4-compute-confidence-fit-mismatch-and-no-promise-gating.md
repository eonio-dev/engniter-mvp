---
baseline_commit: "53c36aa98059823230c18e292a532446e7a486f3"
---

# Story 2.4: Compute confidence, fit mismatch, and no-promise gating

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want the product to surface Scope Confidence and commitment risk clearly,
so that I can see when scope is safe to advance and when further review or clarification is still required.

## Acceptance Criteria

1. **Given** a current Scope Brief and Validation Review state
   **When** the system evaluates the Opportunity
   **Then** it computes a visible Scope Confidence state of Low, Medium, or High
   **And** the displayed state follows the PRD rules for sparse input, unresolved critical issues, and completed review. (FR-7)

2. **Given** unresolved critical gaps, risks, or clarification items exist
   **When** the Opportunity overview or Scope Brief surface is shown
   **Then** the UI displays an explicit no-promise warning state
   **And** the warning explains what is still blocking external commitment (names the blockers, not a bare flag).

3. **Given** internal fit criteria were captured on the Opportunity
   **When** the current Scope Brief conflicts with those criteria
   **Then** the system surfaces a fit-mismatch warning
   **And** it points the operator to the relevant conflicting area (names the criterion and the conflicting scope item).

4. **Given** Proposal Draft or SOW Draft generation is requested while no-promise blockers remain
   **When** the user initiates the action
   **Then** generation is blocked by default
   **And** only an authorized override path can bypass the block with audit logging.

## Tasks / Subtasks

- [x] Add the derived confidence + no-promise model as a pure module. (AC: 1, 2, 4)
  - [x] Create `src/features/scope-briefs/confidence.ts` with NO side effects and NO imports of server/Firestore/React (pure, unit-testable). Export:
    - `export const CRITICAL_CATEGORIES = ["risk", "openQuestion", "constraint", "integration"] as const;`
    - `export type NoPromiseBlocker = { type: "sparse-input" | "unreviewed-critical" | "flagged-item"; message: string; itemId?: string; category?: ScopeCategory };`
    - `export function evaluateScopeConfidence(brief: Pick<ScopeBrief, "sparseInput" | "items">): ScopeConfidence`
    - `export function evaluateNoPromiseGate(brief: Pick<ScopeBrief, "sparseInput" | "items">): { blocked: boolean; blockers: NoPromiseBlocker[] }`
    - `export function canGenerateExternalArtifacts(brief: Pick<ScopeBrief, "sparseInput" | "items" | "noPromiseOverride">): { allowed: boolean; reason?: string }`
  - [x] Confidence rules (authoritative — from PRD FR-7, lines 150–152). Operate over **active items** = `items.filter(i => i.reviewStatus !== "rejected")` (rejected items are excluded per Story 2.3 AC4):
    - **Low** when `brief.sparseInput === true` OR `activeItems.length === 0` OR **no active item has been reviewed yet** (every active item is `pending` — an unreviewed brief is never Medium/High) OR there is ≥1 unresolved critical issue.
    - **High** when there are NO pending items, NO flagged items, and NO unresolved critical issues among active items (i.e., every active item has `reviewStatus ∈ {accepted, edited}`).
    - **Medium** otherwise (no unresolved criticals, but some non-critical follow-ups / pending items remain).
  - [x] Define "unresolved critical issue" = an active item where `reviewStatus === "flagged"` (any category) OR (`reviewStatus === "pending"` AND `CRITICAL_CATEGORIES.includes(category)`).
  - [x] `evaluateNoPromiseGate`: `blocked = brief.sparseInput || unresolvedCritical.length > 0`. Build `blockers`:
    - one `{ type: "sparse-input" }` blocker if `sparseInput`,
    - one `{ type: "unreviewed-critical", itemId, category }` per pending critical item,
    - one `{ type: "flagged-item", itemId }` per flagged item.
    - Each blocker `message` must be plain-language and name the cause (e.g., `"Unreviewed risk still needs a decision."`).
  - [x] `canGenerateExternalArtifacts`: `allowed = !evaluateNoPromiseGate(brief).blocked || brief.noPromiseOverride != null`. When blocked and no override, set `reason` to a short explanation.
  - [x] Create `src/features/scope-briefs/confidence.test.ts` (node:test, `.ts` relative imports) covering: sparse→Low; empty active items→Low; all-pending brief (nothing reviewed yet)→Low; some reviewed + remaining pending non-critical→Medium; all accepted/edited + no flags→High; one pending risk→Low (unresolved critical); one flagged goal→Low; rejected critical items are ignored; override flips `canGenerateExternalArtifacts` to allowed while `evaluateNoPromiseGate.blocked` stays true.

- [x] Extend the Scope Brief schema with override + fit-mismatch state. (AC: 3, 4)
  - [x] In `src/features/scope-briefs/schemas/scope-brief.ts` add to `scopeBriefSchema` (and therefore `ScopeBrief`):
    - `noPromiseOverride: z.object({ overriddenByUserId: z.string().min(1), overriddenAt: z.string(), reason: z.string().min(1) }).nullable().default(null)`
    - `fitMismatches: z.array(z.object({ criterion: z.string().min(1), conflictingItemId: z.string().nullable(), reason: z.string().min(1) })).default([])`
    - `fitCheckedAt: z.string().nullable().default(null)`
  - [x] Export `export type NoPromiseOverride = ...` and `export type FitMismatch = ...` and re-export both from `src/features/scope-briefs/types.ts`.
  - [x] Update `docToScopeBrief` in `src/features/scope-briefs/server/repository.ts` to map the new fields with safe fallbacks (`noPromiseOverride: data.noPromiseOverride ?? null`, `fitMismatches: data.fitMismatches ?? []`, `fitCheckedAt: data.fitCheckedAt ?? null`). Existing documents lack these fields — fallbacks must not throw.

- [x] Implement the no-promise override Server Action with audit logging. (AC: 4)
  - [x] Add to `src/features/scope-briefs/server/repository.ts`: `export async function setNoPromiseOverride(scopeBriefId: string, override: NoPromiseOverride | null): Promise<void>` (doc `.update({ noPromiseOverride: override })`, throw `NOT_FOUND` if missing — mirror `updateScopeBriefStatus`).
  - [x] Add to `src/features/scope-briefs/server/actions.ts`:
    - `overrideNoPromiseSchema = z.object({ scopeBriefId: z.string().min(1), reason: z.string().min(1) })` — place the schema in `scope-brief.ts` (NOT exported from the `"use server"` module — see Story 2.3 lesson) and import it.
    - `overrideNoPromiseGateAction(formData: unknown)`: `requireRole()`, validate, reuse `resolveScopeBriefAccess` for ownership, then call `setNoPromiseOverride(scopeBriefId, { overriddenByUserId: session.uid, overriddenAt: new Date().toISOString(), reason })`. Return `{ data: { scopeBriefId } }` or `{ error: { code, message } }`. **Authorization (MVP decision — see Open Decisions #3):** `requireRole()` + ownership is the authorized "editor" path for the single-user MVP (no viewer/sharing exists). Add an inline `// TODO(post-MVP collaboration): tighten to requireRole({ allowedRoles: EDITOR_ROLES }) once viewer/shared roles exist` marker at this call site so the tightening point is unambiguous. The override is the single most safety-critical action (it bypasses the no-promise gate), so it MUST always write the audit record (actor + time + reason) — never a silent bypass.
    - `clearNoPromiseOverrideAction(formData: unknown)` (input `{ scopeBriefId }`): same auth/ownership, calls `setNoPromiseOverride(scopeBriefId, null)`. Lets the operator re-engage gating after resolving issues.
  - [x] Add schema tests to `src/features/scope-briefs/server/actions.test.ts`: `overrideNoPromiseSchema` accepts valid input, rejects missing/empty `reason`, rejects missing `scopeBriefId`.
  - [x] **Audit logging**: the override record itself (actor + timestamp + reason persisted on the brief) IS the audit trail for MVP. Do NOT build a separate audit-events collection in this story — note it as the persistence mechanism in Dev Agent Record.

- [x] Implement fit-mismatch evaluation (AI-assisted, on demand). (AC: 3)
  - [x] Create `src/features/scope-briefs/server/fit-mismatch.ts` with `export async function evaluateFitMismatch(fitCriteria: string, items: ScopeItem[]): Promise<FitMismatch[]>`:
    - Reuse `getAnthropicClient()` from `src/server/ai/provider.ts` (same pattern as `analyze-context-package.ts`).
    - Prompt: given internal fit criteria and the active (non-rejected) scope items (use `editedContent ?? content`), return JSON `{ mismatches: [{ criterion, conflictingItemContent, reason }] }` listing only genuine conflicts. Output ONLY JSON.
    - Parse with a Zod schema; map `conflictingItemContent` back to a `conflictingItemId` by matching item content (fall back to `null` if no match). On any parse/transport error, return `[]` (graceful degradation — fit-mismatch must never crash the page).
  - [x] Put the pure JSON-shaping/mapping logic (`parseFitMismatchResponse`, content→id mapping) in `src/features/scope-briefs/server/fit-mismatch.helpers.ts` and unit-test it in `src/features/scope-briefs/server/fit-mismatch.helpers.test.ts`. Do NOT unit-test the live AI call (matches `analyze-context-package` testing convention).
  - [x] Add to `src/features/scope-briefs/server/repository.ts`: `export async function setFitMismatches(scopeBriefId: string, mismatches: FitMismatch[]): Promise<void>` (persists `{ fitMismatches, fitCheckedAt: new Date().toISOString() }`).
  - [x] Add `recheckFitMismatchAction(formData: unknown)` (input `{ scopeBriefId }`) to `actions.ts`: `requireRole()`, ownership via `resolveScopeBriefAccess`, load the opportunity, if `opportunity.fitCriteria` is null/empty persist `setFitMismatches(id, [])` and return early; otherwise call `evaluateFitMismatch(fitCriteria, activeItems)` and persist via `setFitMismatches`. Return `{ data: { count } }`.

- [x] Build the confidence pill + warning banner components. (AC: 1, 2, 3)
  - [x] Create `src/features/scope-briefs/components/confidence-pill.tsx` (Server Component is fine): renders `Scope Confidence · {state}` with a plain-language sublabel. Colors map Low→`chip-warning`, Medium→`chip-trust`, High→`chip-success` (reuse existing chip classes). **Never color-only** — always include the visible word Low/Medium/High and a short text reason. Uses the `{components.confidence-pill}` intent (pill radius). [Source: DESIGN.md confidence-pill; EXPERIENCE.md Accessibility Floor]
  - [x] Create `src/features/scope-briefs/components/no-promise-banner.tsx`: given `blockers: NoPromiseBlocker[]` (+ optional `override` + `scopeBriefId`), render a `warning-banner` (`role="alert"`) listing each blocker message. When `override != null`, render an "Overridden by editor" note (actor + reason + timestamp) instead of the block, plus a "Re-engage gating" control wired to `clearNoPromiseOverrideAction`. When blocked and not overridden, render an "Override (editor)" control wired to `overrideNoPromiseGateAction` that requires a reason (small inline form / textarea). [Source: EXPERIENCE.md State Patterns "Low confidence / no-promise"]
  - [x] Create `src/features/scope-briefs/components/fit-mismatch-banner.tsx`: given `fitMismatches: FitMismatch[]`, render a `warning-banner` (`role="alert"`) naming each `criterion` and its `reason`; when a `conflictingItemId` is present, render an anchor/label that points to the conflicting scope item. Render nothing when the array is empty. [Source: EXPERIENCE.md "Fit mismatch detected"]
  - [x] The override/clear/recheck controls are Client Components using `useActionState` + `router.refresh()` (same pattern as `approve-scope-brief-button.tsx`). Disable while in flight.

- [x] Wire derived state into the Scope Brief panel and Opportunity overview. (AC: 1, 2, 3)
  - [x] In `src/features/scope-briefs/components/scope-brief-panel.tsx`: replace the stored `scopeBrief.scopeConfidence` display with `evaluateScopeConfidence(scopeBrief)` via `ConfidencePill`. Add `NoPromiseBanner` (from `evaluateNoPromiseGate(scopeBrief)`) at the top of the panel, above the category sections. Keep the existing review-progress + approve button.
  - [x] In `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`: pass `opportunity` (already loaded) into the panel if needed for fit data; render `FitMismatchBanner` from `scopeBrief.fitMismatches` and a "Re-check fit" control (Client Component wired to `recheckFitMismatchAction`) near the top when `opportunity.fitCriteria` is set.
  - [x] In `src/app/opportunities/[opportunityId]/page.tsx` (Opportunity overview): load the latest Scope Brief via `getLatestScopeBriefForOpportunity(opportunityId)`. In the "Workflow status" aside (or header), render `ConfidencePill` (derived) + `NoPromiseBanner` + `FitMismatchBanner` when a brief exists. If no brief exists yet, show the existing neutral state (no pill). Render must NOT trigger any AI call — only read persisted `fitMismatches`.

- [x] Update analysis to seed confidence from the derived model (remove the count-based heuristic from display authority). (AC: 1)
  - [x] In `src/server/ai/analyze-context-package.ts`, set the persisted `scopeConfidence` using `evaluateScopeConfidence({ sparseInput, items })` instead of the count-based `computeScopeConfidence(sparseInput, items.length)`. (A freshly generated all-pending brief with any critical-category item will correctly resolve to Low.)
  - [x] Leave `computeScopeConfidence` in `analyze-context-package.helpers.ts` in place ONLY if still referenced; otherwise delete it and its tests. Update `analyze-context-package.test.ts` accordingly so the suite stays green. Do NOT break existing `isSparseInput` / `mapSourceIndices` tests.

- [x] Tests and full validation gate. (AC: 1, 2, 3, 4)
  - [x] `confidence.test.ts`, `fit-mismatch.helpers.test.ts`, and new `actions.test.ts` schema tests all added and passing.
  - [x] Run `npm test && npm run lint && npm run build` and confirm all pass.

### Review Findings

_Code review 2026-06-01 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 4 decision-needed, 3 patch, 3 deferred, 3 dismissed._

- [x] [Review][Decision→Patch] Fit re-check failures are persisted as a clean result — `evaluateFitMismatch` returns `[]` on any AI/parse/transport error and `recheckFitMismatchAction` persists it via `setFitMismatches`, updating `fitCheckedAt`. The UI then shows "✓ No fit mismatches detected" for what was actually a failed check. **Resolved (patch):** `evaluateFitMismatch` now rethrows `FIT_CHECK_FAILED` on transport/parse failure; the action's try/catch skips `setFitMismatches` so `fitCheckedAt` is not advanced and an error is surfaced. Pre-condition empties still return `[]`. [src/server/ai/fit-mismatch.ts, src/features/scope-briefs/server/actions.ts]
- [x] [Review][Decision→Patch] Empty / all-rejected scope is promisable — for a non-sparse brief where every item is `rejected` (zero active items), `evaluateNoPromiseGate` returns `blocked=false`, so `canGenerateExternalArtifacts` allows generation on an empty scope. **Resolved (patch):** added an `empty-scope` blocker for zero active items (non-sparse); empty scope now blocks promotion unless explicitly overridden. [src/features/scope-briefs/confidence.ts:64-97]
- [x] [Review][Decision→Defer] Sparse briefs show no ConfidencePill / NoPromiseBanner on the Opportunity overview (overview gates on `!sparseInput`; the scope-brief page replaces the panel with the existing thin-context warning). AC1/AC2 expect sparse → Low + sparse blocker. **Resolved (defer):** AC2 is satisfied by the scope-brief page's existing sparse-context warning; keep that path rather than duplicate the pill/banner. [src/app/opportunities/[opportunityId]/page.tsx, scope-brief/page.tsx]
- [x] [Review][Decision→Defer] `noPromiseOverride` persists indefinitely — once set, `canGenerateExternalArtifacts` bypasses ALL future blockers (including newly added critical items) until manually cleared. **Resolved (defer):** override persistence is spec-designed; `clearNoPromiseOverride` is the intended escape hatch. Auto-invalidation deferred as a future enhancement. [src/features/scope-briefs/confidence.ts:100-111]
- [x] [Review][Patch] FitMismatchBanner omits the conflicting scope-item pointer required by AC3 (renders only `criterion` + `reason`, ignores `conflictingItemId`) — **Resolved:** banner now resolves `conflictingItemId` via an items map and renders `(conflicts with: "…")`. [src/features/scope-briefs/components/fit-mismatch-banner.tsx]
- [x] [Review][Patch] Fit banner + "Re-check fit" control render even when the Opportunity has no `fitCriteria` and the array is empty/unchecked; spec says render nothing when empty — **Resolved:** banner returns `null` when no mismatches + never checked + no fit criteria; recheck gated on `hasFitCriteria`; both pages pass `items`/`hasFitCriteria` and the scope-brief page only mounts the banner when `opportunity.fitCriteria` is set. [src/features/scope-briefs/components/fit-mismatch-banner.tsx, src/app/opportunities/[opportunityId]/scope-brief/page.tsx]
- [x] [Review][Patch] ConfidencePill lacks the plain-language sublabel/reason required by the confidence-pill task and the accessibility guardrail (renders only "Scope Confidence · {level}") — **Resolved:** added a per-level plain-language reason sublabel alongside the chip. [src/features/scope-briefs/components/confidence-pill.tsx]
- [x] [Review][Defer] Approve action ignores `flagged` items and allows approving an all-rejected (empty) brief — pre-existing `approveScopeBriefAction` logic, now semantically inconsistent with the 2.4 no-promise gate [src/features/scope-briefs/server/actions.ts] — deferred, pre-existing (partially overlaps Story 2.3 deferred approve-gate TOCTOU)
- [x] [Review][Defer] `updateScopeItemInBrief` rewrites the full `items` array from a stale snapshot — concurrent reviews of different items can lose an update [src/features/scope-briefs/server/repository.ts] — deferred, pre-existing (already tracked in Story 2.3 review deferral)
- [x] [Review][Defer→Resolved] Scope Brief page and Opportunity overview page lack an ownership check (`requireRole()` only, no `createdByUserId === uid` compare) — any authenticated user could read any opportunity's Scope Brief + internal fit criteria by guessing the ID (IDOR). **HIGH security.** **Resolved 2026-06-01:** all three opportunity-scoped pages (overview, scope-brief, context-package) now `notFound()` when `opportunity.createdByUserId !== session.uid`, matching the Server Actions' ownership pattern. [src/app/opportunities/[opportunityId]/page.tsx, scope-brief/page.tsx, context-package/page.tsx]

## Dev Notes

### Story Foundation

- **Epic:** Epic 2 — Validated Scope Review and Risk Control. Story 2.4 turns the review state created in Story 2.3 into commitment-risk signals: Scope Confidence, no-promise gating, and fit-mismatch. Story 2.5 (Clarification Packet) will convert unresolved gaps into prioritized questions and will reuse the same "unresolved critical" concept defined here. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2`, lines 283–435]
- **FR coverage:** FR-7 — display Scope Confidence; Low/Medium/High rules; no-promise warning naming blockers; fit-mismatch when internal fit criteria conflict; block Proposal/SOW generation until resolved or authorized override. [Source: `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-7`, lines 144–155]

### Authoritative Confidence Rules (PRD FR-7)

> - Low when the Context Package is sparse OR any critical gap, unresolved critical risk, or unresolved critical clarification item remains.
> - Medium when all critical items are resolved but one or more non-critical gaps or assumptions still require follow-up.
> - High only when all generated items have completed Validation Review and no unresolved critical gaps remain.

[Source: prd.md lines 150–152]

**DECISION (locked) — confidence and no-promise are coupled, PRD-strict.** The confidence pill and the no-promise gate derive from the **same** criticality model: while ANY critical issue is unresolved, confidence is **Low** AND the no-promise banner shows. This was chosen for the MVP because it is honest by construction (the UI can never read more confident than the scope earns), reinforces the product's core no-promise/trust positioning, still yields a meaningful 3-step gradient (resolve all criticals → Low→Medium; finish review → High), and gives Story 2.5 a clear "resolving a critical moves Low→Medium" impact signal. It is also the literal PRD FR-7 rule, so no PRD amendment is needed.

The UX narrative in EXPERIENCE.md (lines 187–190) describes an opening state of "**Medium** confidence … with 3 critical gaps still blocking." That phrasing is treated as **illustrative imprecision** and is superseded by this decision: an unresolved-critical brief is **Low + warning**, not Medium + warning. (If that narrative line is ever reconciled, it should read "Low.") A single source of truth also makes the incoherent state "High + no-promise warning" impossible.

### Criticality model (DECISION — locked — no `critical`/`priority` field exists yet)

`ScopeItem` (`schemas/scope-brief.ts` lines 23–31) has `category`, `reviewStatus`, `inferred`, `editedContent` — but **no explicit criticality/priority field**. Story 2.4 **derives** criticality deterministically rather than adding a new field. This was chosen for the MVP (see Open Decisions #2 for full rationale): an explicit per-item criticality field would force AI-assigned criticality (unreliable; Story 2.1's prompt doesn't produce it) or per-item reviewer input (extra review burden + UI), and would ripple into Story 2.1's AI schema and Story 2.3's review model plus a data migration. Derivation needs zero schema change, zero AI change, zero migration, is deterministic + testable, and reuses signals already captured.

- **Critical categories:** `risk`, `openQuestion`, `constraint`, `integration` (`CRITICAL_CATEGORIES`). Kept deliberately **broad/cautious** because the product's entire value is no-promise discipline: an unreviewed risk, open question, constraint, or integration is exactly the kind of thing that causes overcommitment in pre-sales, so it should block external commitment until a human reviews it.
- **`flagged` is the human escalation lever:** any item the operator marks `flagged` (any category) is treated as an unresolved critical issue. This gives a per-item criticality signal **without** a new field — anything the category heuristic misses, the reviewer escalates by flagging.
- **Unresolved critical issue:** an active (non-rejected) item that is `flagged` OR (`pending` AND `CRITICAL_CATEGORIES.includes(category)`). Edited/accepted items are "resolved"; rejected items are excluded everywhere (consistent with Story 2.3 AC4: rejected items leave trusted scope).
- **All-pending guard:** a brief where no active item has been reviewed yet is **Low** regardless of category mix — an unreviewed brief must never read Medium/High. (Belt-and-suspenders: typical briefs already hit Low via a pending critical, but this guard removes the edge case of an all-pending brief that happens to contain no critical-category items.)

The model is pure and centralized in `confidence.ts` so the definition can be tuned in one place (and is reused by Story 2.5's "rank clarifications by impact on confidence"). **Post-MVP escape hatch:** if real usage shows category-based derivation is too coarse, introduce an explicit per-item criticality field then — the centralized model keeps that a localized change.

### Current Repository State (what exists / what this story changes)

- **`scopeBriefSchema` / `ScopeBrief`** (`src/features/scope-briefs/schemas/scope-brief.ts`): `status: "draft" | "approved"`, `scopeConfidence: "Low"|"Medium"|"High"` (currently a **stored** value), `sparseInput`, `items: ScopeItem[]`. Story 2.4 ADDS `noPromiseOverride`, `fitMismatches`, `fitCheckedAt`. The displayed confidence becomes **derived** (`evaluateScopeConfidence`) rather than the stored `scopeConfidence`; the stored field remains as a seed/fallback. [Source: schemas/scope-brief.ts]
- **`docToScopeBrief`** (`src/features/scope-briefs/server/repository.ts` lines 9–22): maps Firestore docs with `?? ` fallbacks. MUST be extended with fallbacks for the three new fields so pre-existing briefs (which lack them) still parse. [Source: repository.ts]
- **`getLatestScopeBriefForOpportunity(opportunityId)`** and **`getScopeBrief(id)`** already exist and are reused. [Source: repository.ts lines 34–54]
- **Server Actions** (`src/features/scope-briefs/server/actions.ts`): file is `"use server"` and exports `updateScopeItemAction`, `approveScopeBriefAction`, plus a private `resolveScopeBriefAccess(scopeBriefId, uid)` helper that already does `getScopeBrief` + `getOpportunity` + `createdByUserId === uid`. **Reuse `resolveScopeBriefAccess`** for the new actions. [Source: actions.ts]
- **`"use server"` constraint (Story 2.3 lesson):** modules with `"use server"` may export **only async functions**. All Zod schemas (`overrideNoPromiseSchema`, etc.) MUST live in `schemas/scope-brief.ts` (which only imports `zod`) and be imported into `actions.ts`. The schema test file imports them via relative `../schemas/scope-brief.ts`. [Source: Story 2.3 Completion Notes; actions.ts/scope-brief.ts]
- **`analyze-context-package.ts`** sets `scopeConfidence` via `computeScopeConfidence(sparseInput, items.length)` (count-based: <5 Low, <15 Medium, else High). Story 2.4 replaces this seeding with `evaluateScopeConfidence`. [Source: src/server/ai/analyze-context-package.ts lines 99–113, analyze-context-package.helpers.ts lines 22–29]
- **AI provider:** `getAnthropicClient()` in `src/server/ai/provider.ts`, model `claude-sonnet-4-5`, JSON-only prompt + Zod parse + try/catch→coded error is the established shape. `evaluateFitMismatch` MUST mirror this (and return `[]` on failure rather than throwing, since it feeds an on-demand UI action, not a job). [Source: analyze-context-package.ts lines 70–114]
- **Opportunity** has `fitCriteria: string | null` (`src/features/opportunities/schemas/opportunity.ts` line 11). The overview already renders it (`page.tsx` lines 68–73). Fit-mismatch compares this text against scope items. [Source: opportunity.ts, page.tsx]

### Files being modified — read before changing (UPDATE files)

- `src/features/scope-briefs/components/scope-brief-panel.tsx` — **current:** Server Component; renders confidence chip from `scopeBrief.scopeConfidence`, review progress `<progress>`, category sections, and `ApproveScopeBriefButton`. **This story changes:** confidence chip → `ConfidencePill` with derived value; adds `NoPromiseBanner` above sections. **Preserve:** review progress, `scopeBriefId` threading to `ScopeItemCard`, approve button.
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` — **current:** loads opportunity, latest brief, job status, context items record; renders `JobStatusPanel`, sparse/failed banners, `ScopeBriefPanel`, retry. **This story changes:** add `FitMismatchBanner` + "Re-check fit" control. **Preserve:** job/sparse/failed flows, `ScopeBriefPanel` props (`scopeBriefId`, `contextItemsRecord`).
- `src/app/opportunities/[opportunityId]/page.tsx` — **current:** overview with metadata edit form + workflow-status aside (context item count only). **This story changes:** load latest brief; add `ConfidencePill` + `NoPromiseBanner` + `FitMismatchBanner` to the aside/header when a brief exists. **Preserve:** metadata edit form (`handleUpdate` Server Action), nav tabs, fit-criteria panel.
- `src/features/scope-briefs/server/repository.ts` — add `setNoPromiseOverride`, `setFitMismatches`, extend `docToScopeBrief`. **Preserve** existing exports/mapping.
- `src/features/scope-briefs/server/actions.ts` — add override/clear/recheck actions. **Preserve** existing actions + `resolveScopeBriefAccess`.
- `src/features/scope-briefs/schemas/scope-brief.ts` — add fields + schemas. **Preserve** existing exports (Story 2.3 added `updateScopeItemSchema`/`approveScopeSchema` here).
- `src/server/ai/analyze-context-package.ts` (+ `.helpers.ts`, `.test.ts`) — swap confidence seeding.

A correct implementation must leave the existing scope-brief, analysis, and review flows working end-to-end — not only satisfy the four ACs.

### AC4 scope boundary (avoid building Epic 3)

Proposal Draft and SOW Draft **generation surfaces are Epic 3** (Stories 3.2/3.3) and do **not** exist yet. Story 2.4 delivers the **gating primitive + audited override**, which Epic 3 will consume:

- `canGenerateExternalArtifacts(brief)` is the single decision function Epic 3 generation actions will call.
- `noPromiseOverride` persisted on the brief (actor + timestamp + reason) is the audit record and the bypass mechanism; `overrideNoPromiseGateAction` is the authorized override path (`requireRole()` = editor permission for MVP single-role).
- **Do NOT** build Proposal/SOW generation, a separate audit-events collection, or multi-role permissions in this story. Note the boundary in Dev Agent Record. The AC4 test surface here is: gate decision function + override action + schema validation + persistence.

### Architecture Compliance

- **Server Actions** for all mutations (override, clear, recheck) — not Route Handlers. `requireRole()` in Server Actions, never in Client Components. Ownership verified via `resolveScopeBriefAccess` (existing). [Source: architecture.md API & Communication Patterns; Stories 1.3+, 2.3]
- **`router.refresh()`** after a successful action to reload server-fetched data. [Source: Story 2.2/2.3 pattern]
- **Pure vs server split:** confidence/no-promise/gating logic is pure (`confidence.ts`) and unit-tested with `node:test`; the AI fit call lives in a server module and is NOT unit-tested (only its pure parsing helper is). [Source: `analyze-context-package.helpers.ts` + `.test.ts` convention]
- **Server→Client data:** pass plain objects/arrays/`Record<>`, never `Map<>`. [Story 2.2 lesson]
- **No AI on render:** the overview and scope-brief pages must read persisted `fitMismatches`; AI fit evaluation only runs inside the explicit `recheckFitMismatchAction`. [Performance NFR, prd.md line 158]

### Library / Framework Requirements

- Next.js 15 App Router (Server + Client Components), React 19 `useActionState`, Zod for all input/parse schemas, `firebase-admin/firestore` for persistence, `@anthropic-ai/sdk` via `getAnthropicClient()` (model `claude-sonnet-4-5`). No NEW dependencies are required — if any are proposed, HALT for approval. [Source: package.json; analyze-context-package.ts]
- Test runner: `node --experimental-strip-types --test "src/**/*.test.ts"` — only `*.test.ts` files run; relative imports in test/helper files must include the `.ts` extension; no browser APIs in tests. [Source: package.json scripts; Stories 2.1–2.3]

### File Structure Requirements

**New files:**
- `src/features/scope-briefs/confidence.ts`
- `src/features/scope-briefs/confidence.test.ts`
- `src/features/scope-briefs/server/fit-mismatch.ts`
- `src/features/scope-briefs/server/fit-mismatch.helpers.ts`
- `src/features/scope-briefs/server/fit-mismatch.helpers.test.ts`
- `src/features/scope-briefs/components/confidence-pill.tsx`
- `src/features/scope-briefs/components/no-promise-banner.tsx`
- `src/features/scope-briefs/components/fit-mismatch-banner.tsx`

**Modified files:**
- `src/features/scope-briefs/schemas/scope-brief.ts`
- `src/features/scope-briefs/types.ts`
- `src/features/scope-briefs/server/repository.ts`
- `src/features/scope-briefs/server/actions.ts`
- `src/features/scope-briefs/server/actions.test.ts`
- `src/features/scope-briefs/components/scope-brief-panel.tsx`
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`
- `src/server/ai/analyze-context-package.ts` (+ `.helpers.ts`, `.test.ts`)
- `src/app/globals.css` (confidence-pill / warning-banner styling only if needed — `warning-banner` and chip classes already exist)

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

### UX / Product Guardrails

- **Confidence pill:** plain-language label; Low reads cautionary (not catastrophic), High reads trustworthy (not celebratory). Pill radius `{rounded.full}`. Never color-only — always show the word + reason text. [Source: DESIGN.md lines 87–89, 201; EXPERIENCE.md line 78, 139]
- **Warning banner (no-promise):** `warning-banner` style, `role="alert"`; appears on overview header AND Validation Review when criticals block forward motion; must **explain cause, not only state** — list the specific blockers. [Source: DESIGN.md line 90–94, 202; EXPERIENCE.md lines 79, 105, 169]
- **Fit mismatch banner:** names which internal fit criterion no longer matches and points to the relevant section/item. [Source: EXPERIENCE.md line 96]
- **Climax behavior:** when the last unresolved critical item is reviewed, the no-promise banner clears and confidence moves toward High — this falls out naturally from deriving both from the same model on each `router.refresh()`. [Source: EXPERIENCE.md lines 187–192]
- **Override is an editor action with audit:** overriding a no-promise block must capture actor + reason + time and remain visible (the banner shows the override state, not a silent bypass). [Source: EXPERIENCE.md line 203]

### Previous Story Intelligence (Story 2.3)

- `"use server"` modules may export only async functions → keep Zod schemas in `schemas/scope-brief.ts`. (Caused a refactor mid-2.3.) [Source: 2-3 story Completion Notes]
- `resolveScopeBriefAccess(scopeBriefId, uid)` already centralizes ownership checks — reuse it. [Source: actions.ts]
- Code-review of 2.3 deferred a **lost-update race** in `updateScopeItemInBrief` (non-transactional read-modify-write) as acceptable for the MVP single-user pilot. The new `setNoPromiseOverride`/`setFitMismatches` writers update **distinct top-level fields** (not the `items` array), so they do not worsen that race; keep them as simple `.update({ field })` writes. [Source: 2-3 Review Findings; deferred-work.md]
- Chip classes (`chip-success`, `chip-warning`, `chip-trust`, `chip-muted`, `chip-danger`) and `warning-banner` already exist in `globals.css` (added/used across 2.1–2.3). Reuse; add new CSS only if a pill/banner needs a variant. [Source: src/app/globals.css; Story 2.3]
- Derived display + `router.refresh()` is the established freshness pattern. [Source: Stories 2.2, 2.3]

### Testing Requirements

- **`confidence.test.ts`** (pure, exhaustive): the Low/Medium/High matrix, the critical-category set, flagged-forces-Low, rejected-items-ignored, empty/sparse boundaries, and the override→`canGenerateExternalArtifacts` flip. This is the heart of AC1/AC2/AC4 and must be thorough.
- **`fit-mismatch.helpers.test.ts`**: valid JSON parses to `FitMismatch[]`; malformed JSON yields `[]`; content→id mapping matches on exact content and falls back to `null`.
- **`actions.test.ts`** (extend): schema validation for `overrideNoPromiseSchema` (and any new input schemas) — valid passes, missing/empty `reason` and missing `scopeBriefId` fail.
- Run `npm test && npm run lint && npm run build` before marking complete. Expect the existing 117-test baseline to grow and stay green.

### Anti-Patterns To Avoid

- Do **NOT** build Proposal/SOW generation, export, or a Clarification Packet — those are Epic 2.5 / Epic 3. Only the gating **primitive** + override here.
- Do **NOT** run an AI call during page render — fit evaluation is action-triggered and persisted.
- Do **NOT** compute confidence from the stored `scopeConfidence` value for display — derive it from current review state so it updates live.
- Do **NOT** include rejected items in confidence/no-promise/fit computations.
- Do **NOT** export Zod schemas from a `"use server"` module. (Story 2.3 lesson.)
- Do **NOT** make `evaluateFitMismatch` throw on AI/parse failure — return `[]`.
- Do **NOT** pass `Map<>` between Server and Client Components — use arrays/`Record<>`.
- Do **NOT** introduce a transaction-heavy rewrite of `updateScopeItemInBrief` here (deferred item — out of scope for 2.4).

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.4: Compute confidence, fit mismatch, and no-promise gating` (lines 377–405)
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-7` (lines 144–158)
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Components` (confidence-pill, warning-banner; lines 83–94, 201–202)
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Component Patterns / State Patterns` (lines 74–106, 187–203)
- `src/features/scope-briefs/schemas/scope-brief.ts`
- `src/features/scope-briefs/server/repository.ts`
- `src/features/scope-briefs/server/actions.ts`
- `src/features/scope-briefs/components/scope-brief-panel.tsx`
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`
- `src/server/ai/analyze-context-package.ts`
- `src/server/ai/provider.ts`
- `src/features/opportunities/schemas/opportunity.ts`

### Project Structure Notes

- New code stays within the established `src/features/scope-briefs/{components,server,schemas}` + top-level pure module convention and `src/server/ai` for AI helpers. No new top-level directories.
- Naming follows existing conventions (`*-banner.tsx`, `*-pill.tsx` components; `*.helpers.ts` + `*.test.ts` for pure logic).

### Open Decisions (resolved — recorded for traceability; do not block implementation)

All three FR-7 ambiguities have been resolved into locked decisions:

1. **Confidence vs no-promise coupling** → see the locked DECISION under "Authoritative Confidence Rules": PRD-strict, coupled, single source of truth.

2. **Criticality definition → DECISION: derived (no new field), broad/cautious category set.** Criticality is derived from `category` + `reviewStatus`, not stored as a per-item field. `CRITICAL_CATEGORIES = {risk, openQuestion, constraint, integration}`, plus any `flagged` item (the reviewer's explicit escalation lever), counts as an unresolved critical issue while pending/flagged. Chosen for the MVP because: (a) an explicit criticality field would force unreliable AI assignment (Story 2.1's prompt doesn't emit it) or extra per-item reviewer input + UI, rippling into Stories 2.1/2.3 plus a data migration; (b) derivation needs zero schema/AI/migration change, is deterministic and unit-testable, and reuses already-captured signals; (c) the broad category set keeps the cautious no-promise posture (an unreviewed risk/open-question/constraint/integration should block external commitment until a human reviews it), while `flagged` lets the operator escalate anything the heuristic misses. An all-pending brief is forced to **Low** by a guard so an unreviewed brief never reads Medium/High. Post-MVP, if category derivation proves too coarse, add an explicit per-item criticality field — the centralized `confidence.ts` model keeps that a localized change. (Full rationale in "Criticality model".)

3. **Override authorization → DECISION: ownership + `requireRole()` is sufficient for the MVP; mark the tightening point.** The MVP is single-user with no viewer/sharing, so the opportunity owner (enforced via `resolveScopeBriefAccess`) IS the authorized editor that PRD line 155 ("edit-permission user") and EXPERIENCE.md line 203 ("overridden by an editor") require. Gating to a specific role now is premature: no action in the codebase currently restricts roles and the role taxonomy (operator/founder/seller/viewer) is not yet stabilized for edit-vs-view. Therefore keep `requireRole()` + ownership, but (a) the override action MUST always write the audit record (actor + time + reason) — never a silent bypass — and (b) add an inline `// TODO(post-MVP collaboration): tighten to requireRole({ allowedRoles: EDITOR_ROLES })` marker at the call site so the exact hardening point is unambiguous when viewer/shared roles land (alongside Epic 3 generation enforcement). This keeps the override consistent with every existing action while honoring the FR-7 "authorized override" intent for the actual MVP threat model (where there are no viewers to guard against).

## Dev Agent Record

### Agent Model Used

claude-opus-4.8

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Target: story 2-4 (builds on Story 2.3 review state; defines the "unresolved critical" model reused by Story 2.5).
- Confidence/no-promise/gating centralized as a pure module (`confidence.ts`) for testability and single-point tuning of the criticality definition.
- AC4 scoped to the gating primitive + audited override; Proposal/SOW generation blocking is enforced later in Epic 3.
- Fit-mismatch is AI-assisted but action-triggered and persisted (no AI on render); returns `[]` on failure.
- **Implementation deviations from spec (intentional):**
  - Fit-mismatch AI module placed at `src/server/ai/fit-mismatch.ts` + `fit-mismatch.helpers.ts` (next to `analyze-context-package.ts`) instead of under `features/scope-briefs/server/`, to keep all live Anthropic calls co-located in `src/server/ai`. The repository writer (`setFitMismatches`) and the action (`recheckFitMismatchAction`) remain in the feature folder as specified.
  - Conflicting-item mapping uses a numeric 1-based index (`conflictingItemIndex` → item id) instead of content-string matching — more robust than matching on free-text content. Helpers (`parseFitMismatchResponse`, `mapFitMismatches`) are pure and unit-tested; the live AI call is not unit-tested (matches `analyze-context-package` convention).
  - No-promise override / clear / re-check controls are split into dedicated Client Components (`no-promise-override-control.tsx`, `recheck-fit-button.tsx`) consumed by the Server-Component banners, following the `approve-scope-brief-button.tsx` `useActionState` + `router.refresh()` pattern.
- **Authorization (MVP):** override + clear use `requireRole()` + ownership (`resolveScopeBriefAccess`). Inline `// TODO(post-MVP collaboration)` markers flag the tightening point once viewer/editor roles exist.
- **Audit trail:** the override record persisted on the brief (`noPromiseOverride = { overriddenByUserId, overriddenAt, reason }`) IS the audit mechanism for MVP — no separate collection.
- `evaluateScopeConfidence` now seeds persisted `scopeConfidence` at analysis time; a freshly generated all-pending brief correctly resolves to Low (PRD-strict coupling). `computeScopeConfidence` and its tests removed.
- Validation gate: `npm test` (148 pass, up from 117), `npm run lint` (clean), `npm run build` (exit 0; only the pre-existing benign "Cannot serialize key parse" ESLint warning).

### File List

- Added: `src/features/scope-briefs/confidence.ts`
- Added: `src/features/scope-briefs/confidence.test.ts`
- Added: `src/features/scope-briefs/components/confidence-pill.tsx`
- Added: `src/features/scope-briefs/components/no-promise-banner.tsx`
- Added: `src/features/scope-briefs/components/no-promise-override-control.tsx`
- Added: `src/features/scope-briefs/components/fit-mismatch-banner.tsx`
- Added: `src/features/scope-briefs/components/recheck-fit-button.tsx`
- Added: `src/server/ai/fit-mismatch.ts`
- Added: `src/server/ai/fit-mismatch.helpers.ts`
- Added: `src/server/ai/fit-mismatch.helpers.test.ts`
- Modified: `src/features/scope-briefs/schemas/scope-brief.ts`
- Modified: `src/features/scope-briefs/types.ts`
- Modified: `src/features/scope-briefs/server/repository.ts`
- Modified: `src/features/scope-briefs/server/actions.ts`
- Modified: `src/features/scope-briefs/server/actions.test.ts`
- Modified: `src/features/scope-briefs/components/scope-brief-panel.tsx`
- Modified: `src/app/opportunities/[opportunityId]/page.tsx`
- Modified: `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`
- Modified: `src/app/opportunities/[opportunityId]/context-package/page.tsx`
- Modified: `src/app/api/opportunities/[opportunityId]/analysis/route.ts`
- Modified: `src/server/ai/analyze-context-package.ts`
- Modified: `src/server/ai/analyze-context-package.helpers.ts`
- Modified: `src/server/ai/analyze-context-package.test.ts`
- Modified: `src/app/globals.css`

### Change Log

- 2026-05-31: Story created from epics (Story 2.4), PRD FR-7, UX confidence/no-promise/fit-mismatch patterns, and analysis of the Story 2.1–2.3 scope-brief implementation.
- 2026-05-31: Implemented Story 2.4 — derived confidence/no-promise pure model, override Server Action with audit, AI-assisted fit-mismatch (action-triggered + persisted), confidence pill + no-promise + fit-mismatch banners wired into the Scope Brief panel and Opportunity overview, and analysis seeding switched to the derived model. All tests/lint/build green (148 tests).
- 2026-06-01: Code-review fixes — (D1) `evaluateFitMismatch` rethrows `FIT_CHECK_FAILED` instead of persisting a failed check as clean; (D2) added `empty-scope` no-promise blocker for non-sparse zero-active-item briefs; (P1) FitMismatchBanner renders the conflicting scope-item pointer (AC3); (P2) banner/recheck render nothing without fit criteria and pages pass `items`/`hasFitCriteria`; (P3) ConfidencePill gained a plain-language reason sublabel. Decisions D3/D4 deferred. 149 tests/lint/build green.
- 2026-06-01: Security hardening — resolved deferred HIGH IDOR. All three opportunity-scoped Server Component pages (overview, scope-brief, context-package) now `notFound()` when `opportunity.createdByUserId !== session.uid`, closing cross-user read access to scope briefs and internal fit criteria. 149 tests/lint/build green.

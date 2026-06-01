---
baseline_commit: 47e297c78fc81b3f35ba811b36720fd13c5630e7
---

# Story 2.5: Generate and manage the Clarification Packet

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want unresolved scope gaps converted into a prioritized Clarification Packet linked back to their triggering scope issues,
so that the team can advance discovery before making external commitments.

## Acceptance Criteria

1. **Generate prioritized, linked questions (FR-8, FR-9).** Given a current Scope Brief contains unresolved gaps, risks, or missing evidence, when the user generates the Clarification Packet, then the system creates clarification questions where each question is linked to the triggering scope issue and includes a category, a priority (Critical / High / Medium / Low), a plain-language cause, and a status. Critical/High priority is assigned when the unresolved issue could materially change scope commitment, integration feasibility, security/compliance posture, delivery feasibility, or commercial viability.

2. **Priority-ordered, explained surface.** Given clarification questions exist, when the Clarification Packet UI loads, then Critical and High questions are surfaced first, and each question shows why it matters to scope safety or delivery feasibility (its cause) plus a link back to the originating Scope Brief item / unresolved risk / missing Source Reference.

3. **Status syncs with Scope Brief review (FR-9).** Given a clarification question is linked to a Scope Brief item, when that item is resolved through Validation Review (accepted, edited, or rejected), then the question's status reflects "resolved" and it no longer appears as an unresolved blocker — without a separate manual write.

4. **Explicit cleared and sparse states.** Given no unresolved clarification blockers remain (no questions, or every question resolved), when the user opens the Clarification Packet, then the surface shows an explicit "discovery blockers cleared" state rather than a blank list. Given the Scope Brief is sparse-input, the surface routes the user back to the Context Package instead of presenting untrustworthy prioritization.

## Tasks / Subtasks

- [x] **Task 1 — Clarification schema + types (AC: 1, 2)**
  - [x] In `src/features/clarifications/schemas/clarification.ts` (NEW; imports only `zod`), define `CLARIFICATION_CATEGORIES = ["business", "scope", "integration", "nonFunctional", "timeline", "responsibility"]`, `CLARIFICATION_PRIORITIES = ["Critical", "High", "Medium", "Low"]`, `clarificationQuestionSchema` (`id`, `question`, `category`, `priority`, `cause`, `linkedItemId: string | null`), and `clarificationPacketSchema` (`id`, `opportunityId`, `scopeBriefId`, `scopeBriefVersion`, `generatedAt`, `questions: ClarificationQuestion[]`). Export inferred types.
  - [x] Add the input schema `generateClarificationPacketSchema` (`{ scopeBriefId }`) here too (so it can be imported into the `"use server"` action — see Dev Notes "`use server` constraint").
  - [x] Add `src/features/clarifications/types.ts` re-exporting the types.
- [x] **Task 2 — Pure status-derivation model (AC: 3, 4)**
  - [x] In `src/features/clarifications/status.ts` (NEW, pure — no server/zod imports needed beyond the types), implement `deriveQuestionStatus(question, brief): "open" | "resolved"`: `resolved` when `linkedItemId` is non-null AND the current brief contains that item with `reviewStatus ∈ {accepted, edited, rejected}`; otherwise `open` (pending/flagged, missing link, or item no longer present). Implement `summarizeClarificationPacket(packet, brief)` returning `{ questions: (ClarificationQuestion & { status })[], openCount, isCleared }` with questions sorted Critical→High→Medium→Low then preserving generation order, and `isCleared = questions.length === 0 || openCount === 0`.
  - [x] `src/features/clarifications/status.test.ts` (NEW): cover each reviewStatus → status mapping, missing/removed linked item, null link, priority sort order, and `isCleared` (empty + all-resolved + has-open).
- [x] **Task 3 — AI generation module (AC: 1)**
  - [x] `src/server/ai/generate-clarification-packet.ts` (NEW) mirroring `fit-mismatch.ts`: `getAnthropicClient()`, model `claude-sonnet-4-5`, JSON-only system prompt, build a user prompt from the brief's **unresolved** items (see Dev Notes "Which items seed questions"), parse + map via helpers, **throw** a coded `CLARIFICATION_FAILED` error on network/parse failure (NOT return `[]` — generation is an explicit user action with a retry path).
  - [x] `src/server/ai/generate-clarification-packet.helpers.ts` (NEW): Zod response schema `{ questions: [{ question, category, priority, cause, linkedItemIndex: number | null }] }`, `parseClarificationResponse(rawText)` (→ null on failure), and `mapClarificationQuestions(response, items)` mapping `linkedItemIndex` (1-based) → `linkedItemId` (`items[idx-1]?.id ?? null`) and assigning `crypto.randomUUID()` ids.
  - [x] `src/server/ai/generate-clarification-packet.helpers.test.ts` (NEW): valid JSON parses; malformed → null; index→id mapping incl. out-of-range → null.
- [x] **Task 4 — Repository (AC: 1, 2, 3)**
  - [x] `src/features/clarifications/server/repository.ts` (NEW), collection `clarificationPackets`: `createClarificationPacket(input)` (auto-id, `generatedAt: serverTimestamp()`), `getLatestClarificationPacketForBrief(scopeBriefId)` (where `scopeBriefId ==`, orderBy `generatedAt desc`, limit 1), and a `docToClarificationPacket` mapper with `??` fallbacks (mirror `scope-briefs/server/repository.ts`).
- [x] **Task 5 — Server Action (AC: 1)**
  - [x] `src/features/clarifications/server/actions.ts` (NEW, `"use server"`): `generateClarificationPacketAction(formData)` → `requireRole()`, parse with `generateClarificationPacketSchema`, ownership via the scope-brief access pattern (load brief + opportunity, `opportunity.createdByUserId !== session.uid` → FORBIDDEN), reject sparse-input briefs (`VALIDATION_ERROR`), call the AI module on the brief's unresolved items, persist the packet, return `{ data: { packetId } }`; catch and return `{ error: { code, message } }`. Return type uses the same `ActionResult<T>` envelope shape as `scope-briefs/server/actions.ts`.
  - [x] `src/features/clarifications/server/actions.test.ts` (NEW): schema validation (valid passes; missing `scopeBriefId` fails).
- [x] **Task 6 — UI surface (AC: 2, 4)**
  - [x] `src/features/clarifications/components/clarification-row.tsx` (NEW, Server Component): renders priority chip, category, cause, derived status, and a Source link to the linked Scope Brief item.
  - [x] `src/features/clarifications/components/clarification-packet-panel.tsx` (NEW, Server Component): takes `summarizeClarificationPacket` output; renders Critical/High first; renders explicit cleared empty state when `isCleared`.
  - [x] `src/features/clarifications/components/generate-clarification-packet-button.tsx` (NEW, Client Component): `useActionState` + `router.refresh()` mirroring `recheck-fit-button.tsx`; shows error state + "Generating…" pending label.
  - [x] `src/app/opportunities/[opportunityId]/clarifications/page.tsx` (NEW, Server Component): `requireRole()` + ownership guard (`opportunity.createdByUserId !== session.uid` → `notFound()`); load latest brief + latest packet; if `brief.sparseInput` show the sparse routing banner (link back to context-package) and no generate; else derive statuses and render the panel + generate button.
  - [x] `src/app/opportunities/[opportunityId]/clarifications/loading.tsx` (NEW): mirror existing route `loading.tsx`.
- [x] **Task 7 — Navigation wiring (AC: 2)**
  - [x] Add a "Clarifications" `nav-tab` link to the overview nav (`src/app/opportunities/[opportunityId]/page.tsx`, the `workspace-nav-tabs` block) and a matching breadcrumb/link from the scope-brief page header. **Preserve** existing tabs and behavior.
- [x] **Task 8 — Styling (only if needed)**
  - [x] Add `.clarification-row` and priority chip variants to `src/app/globals.css` **only if** existing `chip-*` / `warning-banner` / `info-banner` classes don't cover it. Reuse first.
- [x] **Task 9 — Validate**
  - [x] Run `npm test` (expect the 156-test baseline to grow and stay green), `npm run lint` (clean), `npm run build` (exit 0). Fix anything red before marking ready for review.

## Dev Notes

### Story Foundation

- **Epic 2 — Opportunity-to-Scope-Brief Workflow.** This is the final story of Epic 2. It consumes the Story 2.4 "unresolved critical" model and the Story 2.1–2.3 scope-brief/review machinery. [Source: epics.md#Story 2.5 (lines 407–435); epics.md#Epic 2 (line 152)]
- **FR-8 (generate prioritized questions)** and **FR-9 (link questions to scope gaps + status sync).** [Source: prd.md#4.3 Clarification Packet, FR-8/FR-9 (lines 160–180)]
- Business value: this is a primary product differentiator — it operationalizes uncertainty reduction so the team advances discovery instead of merely drafting documents. [Source: prd.md line 161; SM-3 line 292: ≥70% of pilot Opportunities surface a meaningful clarification question.]

### Authoritative requirements (PRD — testable consequences)

- Each question is tagged to a category such as **business, scope, integration, non-functional, timeline, or responsibility**. [prd.md:170]
- Questions rank with exactly four priorities: **Critical, High, Medium, Low**. [prd.md:171]
- **Critical/High** is assigned when the unresolved issue could materially change scope commitment, integration feasibility, security/compliance posture, delivery feasibility, or commercial viability. [prd.md:172]
- Each question includes a **pointer to the relevant Scope Brief item, unresolved risk, or missing Source Reference**. [prd.md:179]
- When a user resolves a clarification question in the Scope Brief, the system **updates the Clarification Packet status accordingly**. [prd.md:180]

### DECISION — locked — data model: separate `clarificationPackets` collection + derived status

1. **Storage = a separate `clarificationPackets` Firestore collection**, one packet document per generation (query the latest by `scopeBriefId` + `generatedAt desc`, mirroring `getLatestScopeBriefForOpportunity`). Rationale: (a) architecture explicitly names the lowercase-plural collection `clarificationPackets` [architecture.md:257]; (b) the Clarification Packet is an **exportable derived artifact** — the PRD groups its export with Mini PRD / SOW / Proposal Draft under FR-14 [prd.md:231, epics.md:47], unlike inline review metadata (`reviewStatus`, `fitMismatches`) which is embedded on the brief; (c) it keeps the scope-brief document from growing unbounded with question text. Do NOT embed questions on the scope-brief doc.
2. **Question status is DERIVED at read time, never stored as a mutable field.** A question is `resolved` iff its `linkedItemId` resolves to a current brief item whose `reviewStatus ∈ {accepted, edited, rejected}`; otherwise `open`. This satisfies AC3 (FR-9 status sync) **for free** — exactly the derive-on-read pattern Story 2.4 used for confidence/no-promise (display derived from current review state on each `router.refresh()`), so no extra write path and no stale status. Persist the question's `linkedItemId` and immutable content (`question`, `category`, `priority`, `cause`); derive only `status`.

   This mirrors the established codebase pragmatism: validation decisions are stored as `reviewStatus` on the scope item (not a `validationReviews` collection) and the no-promise audit as `noPromiseOverride` on the brief (not an `auditEvents` collection). Here the artifact itself warrants a collection, but its **status** stays derived rather than a second source of truth.

### DECISION — locked — which items seed questions

Seed the AI generation from the brief's **unresolved / under-evidenced** active items (exclude `rejected`):

- All `pending` or `flagged` items in the critical categories (`risk`, `openQuestion`, `constraint`, `integration`) — reuse `CRITICAL_CATEGORIES` from `src/features/scope-briefs/confidence.ts`.
- All `openQuestion` items regardless of review state that remain unanswered.
- Any active item with an **empty `sourceContextItemIds`** array (missing Source Reference → FR-9 "missing evidence" trigger).

Pass these candidate items (with a stable 1-based index) to the model; the model returns category, priority, cause, and `linkedItemIndex` per question, which the helper maps back to `linkedItemId`. If there are no candidate items, **skip the AI call** and persist an empty-questions packet (→ AC4 cleared state). [Source: prd.md:179; confidence.ts:7 `CRITICAL_CATEGORIES`]

### DECISION — locked — generation is synchronous, action-triggered (no background job)

The packet derives from an already-loaded Scope Brief, so generation is a synchronous Server Action AI call (like `recheckFitMismatchAction` → `evaluateFitMismatch`), NOT a queued `jobs` record like context-package analysis. **Difference from fit-mismatch:** on AI/parse failure the module **throws** a coded error (`CLARIFICATION_FAILED`) and the action returns an error envelope so the UI can show a retry path (NFR-3 reliability: a failed generation must not destroy prior state) — whereas `evaluateFitMismatch` returns `[]`. The UX "Critical/High load first, lower-priority stream in" [EXPERIENCE.md:106] is satisfied for MVP by priority-sorted rendering; do NOT build streaming.

### Current Repository State (what exists / reuse — do NOT reinvent)

- **Scope-brief domain** lives in `src/features/scope-briefs/`. `ScopeItem` = `{ id, category, content, inferred, reviewStatus, sourceContextItemIds, editedContent }`; `REVIEW_STATUSES = pending|accepted|rejected|edited|flagged`; `SCOPE_CATEGORIES` includes `risk, openQuestion, constraint, integration`. [scope-brief.ts:3–33]
- **AI pattern to mirror exactly:** `src/server/ai/fit-mismatch.ts` (+ `fit-mismatch.helpers.ts` + `.helpers.test.ts`) — `getAnthropicClient()`, `claude-sonnet-4-5`, JSON-only system prompt, indexed item blocks, `parse*Response` → `map*` helpers, coded error via `Object.assign(new Error(msg), { code })`. [fit-mismatch.ts; fit-mismatch.helpers.ts]
- **Repository pattern to mirror:** `src/features/scope-briefs/server/repository.ts` — `docToScopeBrief` with `?? ` fallbacks, `FieldValue.serverTimestamp()`, `getAdminFirestore()`, `getLatest…ForOpportunity` query (where + orderBy createdAt desc + limit 1). [repository.ts:33–56]
- **Server Action + ownership pattern to mirror:** `src/features/scope-briefs/server/actions.ts` — `"use server"`, `ActionResult<T>` envelope, `requireRole()`, and `resolveScopeBriefAccess(scopeBriefId, uid)` which does `getScopeBrief` + `getOpportunity` + `createdByUserId === uid` → FORBIDDEN. Reuse this exact ownership logic (you may import `getScopeBrief`/`getOpportunity` and replicate the guard, or extract a shared helper — keep it simple). [actions.ts:25–40]
- **Client action component to mirror:** `src/features/scope-briefs/components/recheck-fit-button.tsx` — `"use client"`, `useActionState`, `router.refresh()` on success, error/pending states. [recheck-fit-button.tsx]
- **Page + nav pattern to mirror:** `src/app/opportunities/[opportunityId]/page.tsx` (nav tabs at lines 64–77; ownership guard at 39–42) and `.../scope-brief/page.tsx` (sparse banner 83–90; ownership guard 26–28). [page.tsx; scope-brief/page.tsx]
- **`"use server"` constraint (Story 2.3 lesson):** modules with `"use server"` may export **only async functions**. All Zod schemas (incl. `generateClarificationPacketSchema`) MUST live in a plain module (`clarifications/schemas/clarification.ts`, importing only `zod`) and be imported into the action. Schema tests import via relative `../schemas/clarification.ts` with the `.ts` extension. [Source: 2-4 Dev Notes line 164; 2-3 Completion Notes]

### Files being modified — read before changing (UPDATE files)

- `src/app/opportunities/[opportunityId]/page.tsx` — **add** a "Clarifications" `nav-tab` to `workspace-nav-tabs`. **Preserve** existing tabs, ownership guard, metadata form, workflow-status aside.
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` — **add** a link to the Clarifications surface in the header breadcrumb area. **Preserve** job/sparse/failed flows and `ScopeBriefPanel`/`FitMismatchBanner` wiring.
- `src/app/globals.css` — add `.clarification-row` / priority chip variants **only if** existing classes are insufficient. **Preserve** existing styles.

A correct implementation must leave the existing scope-brief, analysis, review, and gating flows working end-to-end — not only satisfy the four ACs.

### Scope boundary (avoid building Epic 3)

- **Export to PDF/DOCX (FR-14)** of the Clarification Packet is **Epic 3** — do NOT build export here. [prd.md:231; epics.md:47]
- The full **Artifact studio** with tabs/stale-markers/version diff (UX-DR12) is **Epic 3** — for this story the Clarification Packet gets its own route + a generate action, not the multi-artifact studio. [epics.md:108]
- Do NOT add a `clarifications` field to `scopeBriefSchema`, and do NOT create `validationReviews`/`auditEvents` collections.

### Architecture Compliance

- **Server Actions** for the mutation (generate) — not Route Handlers. `requireRole()` in the action, never in a Client Component. Ownership verified through brief→opportunity `createdByUserId`. [architecture.md API patterns; Stories 1.3+, 2.3, 2.4]
- **No AI on render:** the clarifications page reads the persisted packet; the AI call runs only inside `generateClarificationPacketAction`. Status is derived (pure) on render, which is cheap. [Performance NFR; prd.md:158; 2-4 Anti-Patterns]
- **`router.refresh()`** after a successful generate to reload server-fetched data. [Stories 2.2–2.4]
- **Pure vs server split:** status derivation + sort + cleared-state logic are pure (`status.ts`) and unit-tested with `node:test`; the AI call lives in `src/server/ai` and is NOT unit-tested (only its pure parse/map helpers are). [analyze-context-package.helpers convention; 2-4 line 193]
- **Server→Client data:** pass plain objects/arrays/`Record<>`, never `Map<>`. [Story 2.2 lesson]
- **Firestore conventions:** lowercase-plural collection `clarificationPackets`, camelCase fields (`scopeBriefId`, `generatedAt`). [architecture.md:257–258]
- **Reliability (NFR-3):** a failed generation must preserve the previous packet/brief state — only persist a new packet on success. [prd.md:308]

### Library / Framework Requirements

- Next.js 15 App Router (Server + Client Components), React 19 `useActionState`, Zod for all input/parse schemas, `firebase-admin/firestore` for persistence, `@anthropic-ai/sdk` via `getAnthropicClient()` (model `claude-sonnet-4-5`). **No NEW dependencies** — if any are proposed, HALT for approval. [package.json; fit-mismatch.ts]
- Test runner: `node --experimental-strip-types --test "src/**/*.test.ts"` — only `*.test.ts` files run; relative imports in test/helper files must include the `.ts` extension; `@/` alias is NOT resolved at runtime (type-only imports of aliased paths are fine, value imports in test-reachable code must be relative or the module must avoid runtime `@/` value imports). No browser APIs in tests. [package.json scripts; Stories 2.1–2.4]

### File Structure Requirements

**New files (new `clarifications` feature folder + AI module + route):**
- `src/features/clarifications/schemas/clarification.ts`
- `src/features/clarifications/schemas/clarification.test.ts`
- `src/features/clarifications/types.ts`
- `src/features/clarifications/status.ts`
- `src/features/clarifications/status.test.ts`
- `src/features/clarifications/server/repository.ts`
- `src/features/clarifications/server/actions.ts`
- `src/features/clarifications/server/actions.test.ts`
- `src/features/clarifications/components/clarification-packet-panel.tsx`
- `src/features/clarifications/components/clarification-row.tsx`
- `src/features/clarifications/components/generate-clarification-packet-button.tsx`
- `src/server/ai/generate-clarification-packet.ts`
- `src/server/ai/generate-clarification-packet.helpers.ts`
- `src/server/ai/generate-clarification-packet.helpers.test.ts`
- `src/app/opportunities/[opportunityId]/clarifications/page.tsx`
- `src/app/opportunities/[opportunityId]/clarifications/loading.tsx`

**Modified files:**
- `src/app/opportunities/[opportunityId]/page.tsx` (nav tab)
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` (link)
- `src/app/globals.css` (only if needed)

[Source: architecture.md#Naming conventions (lines 257–272); existing `src/features/scope-briefs` structure]

### UX / Product Guardrails

- **Clarification row** uses the `clarification-row` component: each row foregrounds **priority and cause before answer drafting** — it reads as a discovery tool, not a loose question list. Show priority, category, triggering gap (Source link), and status. [DESIGN.md:206; EXPERIENCE.md:83, 177]
- **Priority ordering:** Critical and High rows first. [EXPERIENCE.md:106; prd.md:171–172]
- **Cleared empty state:** when no unresolved blockers remain, explicitly state that discovery blockers are cleared — never render a blank list. [EXPERIENCE.md:107; epics.md:432–435]
- **Sparse-input routing:** when prioritization can't be trusted (sparse brief), route back to missing Context Package evidence instead of pretending the result is trustworthy. [EXPERIENCE.md:108, 192]
- **Source link / drawer:** a Source link opens evidence context for the linked item; reuse the existing source-link/drawer affordance used in Validation Review. Foreground status text, never color alone. [EXPERIENCE.md:81–83]
- **Status never color-only:** show the status word (`Open` / `Resolved`), consistent with confidence-pill/no-promise conventions. [DESIGN.md:143; EXPERIENCE.md:78]

### Previous Story Intelligence (Story 2.4)

- Story 2.4 introduced the **pure model + derive-on-read** approach (`confidence.ts`): display values are computed from current review state each render, not stored. Apply the same approach to clarification status (`status.ts`). [2-4 Completion Notes; confidence.ts]
- Story 2.4 placed the AI call in `src/server/ai/fit-mismatch.ts` (not under the feature `server/` folder) to co-locate all live Anthropic calls — follow this: put `generate-clarification-packet.ts` in `src/server/ai`. [2-4 Completion Notes line 309]
- Reuse `CRITICAL_CATEGORIES` and the `getActiveItems` notion (filter out `rejected`) from `confidence.ts` rather than re-deriving "criticality". [confidence.ts:7, 32–34]
- `resolveScopeBriefAccess` centralizes ownership (brief→opportunity→`createdByUserId`); replicate this guard for the new action and the new page. The **IDOR class of bug** (Story 2.4 review) was caused by a page/list that skipped the owner check — every new opportunity-scoped page/action MUST enforce `createdByUserId === session.uid`. [2-4 Completion Notes line 316; actions.ts:25–40]
- Chip/banner classes (`chip-success`, `chip-warning`, `chip-trust`, `chip-muted`, `chip-danger`, `warning-banner`, `info-banner`) already exist in `globals.css`. Reuse; add a CSS variant only if necessary. [2-4 line 241]
- **Deferred (out of scope):** the pre-existing `updateScopeItemInBrief` lost-update race remains tracked in `deferred-work.md`. The new clarification writers create distinct documents in a new collection and do not touch the `items` array, so they don't interact with that race — keep them simple `.set()`/`.update()` writes. [2-4 line 240; deferred-work.md]

### Git Intelligence (recent commits)

- `47e297c` fix: complete Story 2.4 review findings (list-page IDOR + approve gate)
- `f9a7be7` fix(security): enforce opportunity ownership on Server Component pages (IDOR)
- `c0b3cb3` feat: Epic 2 — Scope Brief generation, review & gating (Stories 2.1–2.4)

Pattern signal: the two most recent commits are **ownership-enforcement (IDOR) fixes**. Do not regress — the new clarifications page and action MUST guard ownership from the start. [git log]

### Testing Requirements

- **`status.test.ts`** (pure, the heart of AC3/AC4): reviewStatus→status matrix (accepted/edited/rejected → resolved; pending/flagged → open), null link → open, removed/missing linked item → open, priority sort (Critical→High→Medium→Low), `isCleared` for empty / all-resolved / has-open.
- **`generate-clarification-packet.helpers.test.ts`**: valid JSON → typed questions; malformed JSON → null; `linkedItemIndex` 1-based → id mapping incl. out-of-range/null → null.
- **`clarification.test.ts`** (schema) + **`actions.test.ts`** (input validation): valid `{ scopeBriefId }` passes; missing/empty fails.
- Do NOT unit-test the live AI call (matches `analyze-context-package`/`fit-mismatch` convention).
- Run `npm test && npm run lint && npm run build` before marking complete. Baseline = **156 tests pass, lint clean, build exit 0** at `47e297c`; expect it to grow and stay green.

### Anti-Patterns To Avoid

- Do **NOT** embed questions on `scopeBriefSchema` — use the `clarificationPackets` collection.
- Do **NOT** persist a mutable per-question `status` field — derive it from the linked item's current `reviewStatus`.
- Do **NOT** run an AI call during page render — generation is action-triggered and persisted.
- Do **NOT** include `rejected` items when selecting candidate items for question generation.
- Do **NOT** export Zod schemas from a `"use server"` module (keep them in `schemas/clarification.ts`).
- Do **NOT** make `generateClarificationPacketAction` succeed silently on AI failure — throw a coded error in the module and surface an error envelope + retry in the UI (NFR-3: preserve prior state).
- Do **NOT** build export, the Artifact studio, streaming, or multi-role permissions — those are Epic 3 / post-MVP.
- Do **NOT** pass `Map<>` between Server and Client Components — use arrays/`Record<>`.
- Do **NOT** add a new opportunity-scoped page/action without the `createdByUserId === session.uid` guard (IDOR regression).

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.5: Generate and manage the Clarification Packet` (lines 407–435)
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#4.3 Clarification Packet, FR-8/FR-9` (lines 160–180); confidence coupling (line 150); NFR-3 (line 308); SM-3 (line 292)
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/DESIGN.md#Components` (clarification-row: lines 119–122, 206)
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Component & State Patterns` (lines 81–84, 106–108, 177, 189–201)
- `_bmad-output/planning-artifacts/architecture.md#Naming conventions` (collection `clarificationPackets`: lines 257–272; data model: 142–156)
- `src/features/scope-briefs/server/repository.ts`, `.../server/actions.ts`, `.../confidence.ts`, `.../schemas/scope-brief.ts`
- `src/features/scope-briefs/components/recheck-fit-button.tsx`, `.../components/fit-mismatch-banner.tsx`
- `src/server/ai/fit-mismatch.ts`, `.../fit-mismatch.helpers.ts`, `.../provider.ts`, `.../analyze-context-package.ts`
- `src/app/opportunities/[opportunityId]/page.tsx`, `.../scope-brief/page.tsx`
- `_bmad-output/implementation-artifacts/2-4-compute-confidence-fit-mismatch-and-no-promise-gating.md` (previous story)

### Project Structure Notes

- New code introduces a `src/features/clarifications/{schemas,server,components}` feature folder plus a top-level pure module (`status.ts`) — same shape as `scope-briefs`. AI helper goes in `src/server/ai`. No other new top-level directories.
- Naming follows existing conventions: `*-row.tsx` / `*-panel.tsx` / `*-button.tsx` components; `*.helpers.ts` + `*.test.ts` for pure logic; `*.ts` pure model + co-located `*.test.ts`.

### Open Decisions (resolved — recorded for traceability; do not block implementation)

1. **Storage model** → DECISION: separate `clarificationPackets` collection (architecture-named, artifact lifecycle), with question **status derived** at read time. See "DECISION — data model".
2. **Candidate item selection for generation** → DECISION: unresolved active items in critical categories + all unanswered open questions + active items missing Source References. See "DECISION — which items seed questions".
3. **Sync vs async generation** → DECISION: synchronous action-triggered AI (no `jobs` record), throwing a coded error on failure so the UI offers retry. See "DECISION — generation is synchronous".

## Dev Agent Record

### Agent Model Used

claude-opus-4.8

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Target: story 2-5 (final Epic 2 story; consumes the Story 2.4 unresolved-critical model and 2.1–2.3 scope-brief/review machinery).
- Data model locked to a separate `clarificationPackets` collection with derived (not stored) question status, reusing Story 2.4's derive-on-read pattern to satisfy FR-9 status sync without extra writes.
- AI generation mirrors `fit-mismatch.ts` (pure parse/map helpers unit-tested; live call not), but throws a coded error on failure so the UI can offer retry (NFR-3).
- Export, Artifact studio, streaming, and multi-role permissions explicitly deferred to Epic 3 / post-MVP.
- IDOR-regression guardrails called out explicitly given the two most recent commits were ownership fixes.

**Implementation (Amelia, dev-story):**
- TDD throughout: schema (13 tests), status model (11 tests), AI helpers incl. `selectCandidateItems` (20 tests), action schema validation (3 tests). Suite grew 156 → 203 tests, all green.
- `generate-clarification-packet.helpers.ts` restates the category/priority enum tuples locally (type-only `@/` import) because the `node --experimental-strip-types` test runner does not resolve the `@/` alias for value imports.
- IDOR guard enforced on both the new action and the new page: `opportunity.createdByUserId !== session.uid` → FORBIDDEN / `notFound()`, loaded via brief → opportunity.
- Sparse-input briefs are rejected in the action (`VALIDATION_ERROR`) and routed back from the page to the Scope Brief instead of showing untrustworthy prioritization (AC 4).
- Question status is derived on read via `summarizeClarificationPacket`; never persisted (AC 3).
- Validation: `npm test` 203 pass, `npm run lint` clean, `npm run build` exit 0 (clarifications route built). The `ESLint: Cannot serialize key "parse"` line in `next build` is a pre-existing next-eslint worker serialization warning (standalone `npm run lint` passes) and is non-blocking.

### File List

**New — feature (clarifications):**
- `src/features/clarifications/schemas/clarification.ts`
- `src/features/clarifications/schemas/clarification.test.ts`
- `src/features/clarifications/types.ts`
- `src/features/clarifications/status.ts`
- `src/features/clarifications/status.test.ts`
- `src/features/clarifications/server/repository.ts`
- `src/features/clarifications/server/actions.ts`
- `src/features/clarifications/server/actions.test.ts`
- `src/features/clarifications/components/clarification-row.tsx`
- `src/features/clarifications/components/clarification-packet-panel.tsx`
- `src/features/clarifications/components/generate-clarification-packet-button.tsx`

**New — AI module:**
- `src/server/ai/generate-clarification-packet.ts`
- `src/server/ai/generate-clarification-packet.helpers.ts`
- `src/server/ai/generate-clarification-packet.helpers.test.ts`

**New — route:**
- `src/app/opportunities/[opportunityId]/clarifications/page.tsx`
- `src/app/opportunities/[opportunityId]/clarifications/loading.tsx`

**Modified:**
- `src/app/opportunities/[opportunityId]/page.tsx` — added Clarifications nav tab
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` — added link to Clarification Packet
- `src/app/globals.css` — added `.clarification-*` styles
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status → review

### Change Log

| Date       | Version | Description                                                        | Author |
| ---------- | ------- | ------------------------------------------------------------------ | ------ |
| 2026-05-30 | 0.1     | Story drafted (ready-for-dev).                                     | Bryan  |
| 2026-05-30 | 1.0     | Implemented Story 2.5 (all 9 tasks); 203 tests green; status review. | Amelia |
| 2026-06-01 | 1.1     | Code review: 5 patches applied (AC4 sparse routing, Firestore index, AC2 deep-link, error masking, whitespace validation), 1 decision resolved, 2 deferred; 203 tests green; status done. | Amelia |

### Review Findings

Adversarial code review (Blind Hunter + Edge Case Hunter + Acceptance Auditor), 2026-06-01.

- [x] [Review][Decision] `openQuestion` candidate selection narrower than locked decision — RESOLVED: kept the stricter behavior (seed only unresolved open questions). Seeding accepted/edited open questions would generate clarifications that immediately read as "resolved" via derive-on-read, contradicting AC3's design and adding noise. Behavior documented here as the authoritative refinement of the locked decision. [src/server/ai/generate-clarification-packet.helpers.ts:88]
- [x] [Review][Patch] Sparse-input surface routes to Scope Brief, not Context Package (AC4) — fixed: sparse brief now routes to Context Package; no-brief case routes to Scope Brief [src/app/opportunities/[opportunityId]/clarifications/page.tsx]
- [x] [Review][Patch] Missing Firestore composite index for `clarificationPackets` where+orderBy query — fixed: added `(scopeBriefId ASC, generatedAt DESC)` index [firestore.indexes.json]
- [x] [Review][Patch] Source link targets the Scope Brief generically, not the originating item (AC2) — fixed: deep-links to `#scope-item-<id>`; added matching anchor id on the scope item card [clarification-row.tsx; scope-item-card.tsx]
- [x] [Review][Patch] Server action returns raw exception text to the client — fixed: returns generic messages, no provider/DB text [src/features/clarifications/server/actions.ts]
- [x] [Review][Patch] AI `question`/`cause` accept whitespace-only strings — fixed: `.trim().min(1)` in both stored and AI-response schemas [clarification.ts; generate-clarification-packet.helpers.ts]
- [x] [Review][Defer] Prompt injection via raw scope-item text in AI user prompt — deferred, pre-existing (systemic across all `src/server/ai` modules; mitigated by strict JSON parse + downstream Zod validation) [src/server/ai/generate-clarification-packet.ts]
- [x] [Review][Defer] Concurrent regenerations can surface the older request as "latest" by `generatedAt` — deferred, pre-existing (low-probability race; MVP single-user flow) [src/features/clarifications/server/actions.ts; repository.ts:42-47]

Dismissed as noise (3): draft (non-sparse) brief allowed to generate (spec never requires an approved brief; clarifying pre-approval is intended); malformed persisted `questions` crash (data written only via Zod-validated action path); missing `sourceContextItemIds` crash (validated write path; mirrors existing unguarded usage in scope-item-card.tsx).


## Deferred from: code review of 2-4-compute-confidence-fit-mismatch-and-no-promise-gating (2026-06-01)

- **HIGH security (IDOR):** ~~`scope-brief/page.tsx` and the Opportunity overview `page.tsx` call `requireRole()` but never check `opportunity.createdByUserId === session.uid`.~~ **RESOLVED 2026-06-01:** all three opportunity-scoped Server Component pages (`page.tsx` overview, `scope-brief/page.tsx`, `context-package/page.tsx`) now deny with `notFound()` when `opportunity.createdByUserId !== session.uid`, mirroring the Server Actions' `resolveScopeBriefAccess` ownership check. `notFound()` (rather than 403) avoids disclosing resource existence. Firestore-rule hardening (see entry below) still recommended as defense-in-depth.
- Approve action (`approveScopeBriefAction`) only blocks on `pending` items; it ignores `flagged` items and allows approving a brief whose active items are all rejected (empty scope). Story 2.4 made `flagged` a no-promise blocker, so the approve gate is now inconsistent with `evaluateNoPromiseGate`. Align approve with the gate (or document the divergence) in a future story. Partially overlaps the Story 2.3 deferred approve-gate TOCTOU.
- Lost-update race in `updateScopeItemInBrief` (full `items` array rewrite from a stale snapshot) re-discovered during this review; already tracked in the Story 2.3 review deferral. No new action.

## Deferred from: code review of 2-1-generate-a-draft-scope-brief-from-the-context-package (2026-05-31)

- Race condition: two concurrent POST requests to `/api/opportunities/[id]/analysis` can both pass the `getActiveJobForOpportunity` check and both create jobs. Low probability with single user; address when concurrent usage becomes a concern (Firestore transaction or unique constraint on opportunityId+status).
- Race condition: two concurrent analysis jobs can both read the same `version` from `getLatestScopeBriefForOpportunity` and create briefs with the same version number. Acceptable for MVP single-user; use Firestore transactions for version atomicity when concurrency is needed.
- Orphaned Scope Brief: if `createScopeBrief` succeeds but `updateJobStatus("succeeded")` fails, the brief exists in Firestore but the job shows "failed". Brief is not cleaned up. Non-transactional write limitation; address with Firestore batch writes in a future story.
- `unstable_after` no timeout: if the Next.js process terminates (deploy, restart) while `runAnalysis` is running, the job stays "queued" or "running" indefinitely. Implement a job watchdog or use proper Cloud Functions when reliability SLO requires it.
- `useState` ignores prop updates in `JobStatusPanel`: if `initialStatus` prop changes after mount (e.g., server-side data updated before client re-renders), the panel shows stale status for up to 3s. Acceptable for MVP polling cadence.

## Deferred from: code review of 1-4-review-opportunity-workspace-and-context-package-history (2026-05-31)

- `createdAt` empty string fallback in `docToContextItem` (`repository.ts:29`) — pre-existing from Story 1.3, carried into 1.4. If a Firestore document has a null/missing `createdAt`, it silently becomes `""` which passes schema validation but sorts incorrectly. Address in a future hardening pass alongside the Story 1.3 deferred items.
- Overview page (`[opportunityId]/page.tsx:39`) calls `listContextItemsChronological` only to get `items.length` for the workflow summary. A Firestore aggregation count query (`db.collection(...).count().get()`) would be more efficient. Optimize when query costs become relevant at scale.

## Deferred from: code review of 1-3-add-context-package-items-with-source-metadata (2026-05-30)

- Firestore `allow update: if request.auth != null` on opportunities collection is overly permissive — any authenticated user can update any Opportunity. Introduced in Story 1.2, not fixed there. Should add `&& resource.data.createdByUserId == request.auth.uid` in a future hardening pass.
- `listContextItems` has no query limit — could load thousands of items into memory. Add `.limit(N)` and pagination when Context Package surfaces scale beyond pilot size.
- `deleteContextItem` performs hard delete with no audit tombstone — NFR2 requires 90-day audit retention for pilot environments. Add soft-delete or audit event write before deletion in a future story.
- `opportunityId` stored both as subcollection path component AND as a field inside each `contextItems` document (denormalized) — minor data smell. Acceptable for MVP query flexibility.
- `resolveOpportunityAccess` in Server Actions fetches the Opportunity document for ownership check, then `addContextItem` causes another Firestore call on the same path — doubles reads per action. Consolidate with a single fetch when performance warrants it.

## Deferred from: code review of 1-2-create-and-edit-opportunity-metadata (2026-05-30)

- Race condition: `getOpportunity` + `updateOpportunity` in `updateOpportunityAction` are not atomic (TOCTOU). Between the fetch and the write, the document could be deleted or modified by another process. Acceptable for MVP single-tenant use; address when concurrent editing or multi-user write scenarios are introduced.

## Deferred from: code review of 1-1-set-up-initial-project-from-starter-template (2026-05-30T14:59:17.681+02:00)

- Harden email-domain parsing against malformed addresses with multiple `@` characters so allowlist checks cannot be confused by invalid input. Deferred as pre-existing and outside this final review-fix pass.
- Reject backslash-based redirect targets like `/\evil.com` in `getSafeRedirectPath` to close a possible redirect sanitation gap. Deferred as pre-existing and outside this final review-fix pass.

## Deferred from: code review of 2-3-review-and-resolve-extracted-scope-items (2026-05-31)

- Lost-update race in `updateScopeItemInBrief` (`repository.ts`): non-transactional read-modify-write of the embedded `items` array. Two near-simultaneous reviews on different items (or double-click / two tabs) can clobber each other (last write wins on the whole array). Spec explicitly accepts this for the MVP single-user pilot; wrap in a Firestore `runTransaction` when multi-user review is introduced.
- TOCTOU between approve gate and item updates (`actions.ts`): `pendingCount` is read in `resolveScopeBriefAccess`, then `updateScopeBriefStatus("approved")` is written separately. An interleaving "Change"/"Restore" (sets `pending`) can leave an approved brief with pending items. Same single-user MVP assumption; resolve atomically with a transaction alongside the race fix above.
- `getLatestScopeBriefForOpportunity` `orderBy("createdAt")` can omit a just-created brief whose `serverTimestamp` is still unresolved (`repository.ts`). Pre-existing from Story 2.1, not caused by Story 2.3.
- Items remain editable after a brief is `approved` (no locking transition): `ScopeItemCard` never receives `scopeBrief.status` and `updateScopeItemAction` has no status guard. Deferred as a product decision — AC4 implies post-approval restore of rejected items is expected, so silently locking would conflict; revisit if approval should freeze scope.

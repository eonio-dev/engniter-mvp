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

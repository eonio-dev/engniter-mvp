stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\planning-artifacts\prds\prd-engniter-mvp-2026-05-30\prd.md
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\docs\engniter-mvp.md
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\brainstorming\brainstorming-session-2026-05-30-10-32-51.md
workflowType: 'architecture'
project_name: 'engniter-mvp'
user_name: 'Eonio'
date: '2026-05-30'
lastStep: 8
status: 'complete'
completedAt: '2026-05-30'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Engniter Studio's MVP centers on one dominant internal workflow: create an Opportunity, ingest a Context Package, generate a draft Scope Brief, complete Validation Review, derive a Clarification Packet plus Mini PRD / SOW Draft / Proposal Draft, then export or share for internal review. Architecturally, that implies a canonical domain model for Opportunity, Context Package, Scope Brief, review decisions, clarification items, artifact outputs, and artifact versions. The product also requires explicit gating logic so downstream artifact generation and export are blocked when no-promise conditions remain unresolved.

**Non-Functional Requirements:**
The architecture will be strongly shaped by authenticated access control at the Opportunity level, audit history retention, reliable preservation of approved Scope Brief state, performance targets for analysis and artifact generation, and lifecycle controls for confidential customer material. UX adds hard requirements around keyboard completion of the main workflow, visible stale-state handling, drawer-based evidence inspection, and support for responsive desktop-first layouts.

**Scale & Complexity:**
This is a high-complexity MVP despite narrow scope because the workflow combines document ingestion, AI-assisted extraction, human review, versioned derived artifacts, and internal sharing under trust-sensitive conditions.

- Primary domain: full-stack web application
- Complexity level: high
- Estimated architectural components: 8-10

### Technical Constraints & Dependencies

The current product definition intentionally constrains external integrations, deep collaboration, pricing automation, and customer-facing portals. Manual Context Package ingestion is acceptable in v1. The architecture therefore needs to optimize for internal workflow correctness over integration breadth. Known dependencies include secure document storage, an AI analysis pipeline capable of asynchronous processing, export generation for PDF / DOCX, and permission-aware internal review surfaces.

### Cross-Cutting Concerns Identified

- Confidential document storage and retrieval
- AI job orchestration and failure recovery
- Review-state and approval-state consistency
- Source Reference lineage and evidence traceability
- Artifact versioning and stale-output detection
- Audit logging for review, generation, export, and deletion events
- Permission separation between editors and reviewers
- Performance under pilot-sized document sets

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Next.js web application on Firebase. The product needs a server-rendered internal web app, authenticated reviewer flows, document-centric UI, and server-side orchestration for AI-backed analysis and artifact generation. Firebase App Hosting plus Firebase-managed backend services fits that shape better than a Vercel-first or database-centric starter.

### Starter Options Considered

**1. Official `create-next-app`**
- Strongest general-purpose Next.js starting point
- Current official docs are on Next.js 16.2.6
- Best choice when optimizing for latest Next.js defaults and maximum ecosystem alignment
- Risk for this project: Firebase App Hosting's documented active support line currently trails the newest major, so using `@latest` may move the project onto a preview support path sooner than desired

**2. Firebase App Hosting Next.js basic starter**
- Maintained in Firebase's App Hosting adapters repository
- Explicitly shaped for Firebase App Hosting deployment flow
- Includes `apphosting.yaml`, npm lockfile, standard `next build`, TypeScript, ESLint, and `src/app` App Router structure
- Lower-risk choice for a Firebase-native deployment target because it starts from Firebase's own hosting assumptions rather than requiring us to adapt them after the fact

**3. `create-t3-app`**
- Excellent for strongly opinionated full-stack TypeScript setups
- Poor fit for this project's stated Firebase Hosting + Firestore + serverless direction
- Would introduce backend assumptions we are not trying to optimize for in the MVP

### Selected Starter: Firebase App Hosting Next.js basic starter

**Rationale for Selection:**
This starter best matches the declared platform preference: Firebase hosting, Firestore, and serverless backend services. It reduces deployment ambiguity, starts from Firebase's supported App Hosting conventions, and gives us a clean Next.js + TypeScript baseline without pulling in a backend opinion that conflicts with Firestore. It is also a safer architectural choice than blindly taking the newest `create-next-app` release train while Firebase App Hosting's active support schedule is still centered on Next.js 15.2.x.

The trade-off is that it is more minimal than `create-next-app` and does not preconfigure product-specific concerns like authentication, Firestore modeling, Cloud Functions modules, test infrastructure, or a design system. That is acceptable here because those choices should remain explicit architectural decisions rather than hidden starter defaults.

**Initialization Command:**

```bash
npx giget@latest "gh:firebase/apphosting-adapters/starters/nextjs/basic#main" engniter-studio --install
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript-enabled Next.js application with strict TypeScript settings and Node.js-compatible App Hosting deployment assumptions.

**Styling Solution:**
Minimal global CSS baseline rather than an opinionated utility or component styling framework. This keeps the UX system decisions open for the architecture and implementation phases.

**Build Tooling:**
Standard Next.js build and runtime scripts (`next dev`, `next build`, `next start`) aligned with Firebase App Hosting's expected `npm run build` path. Includes `apphosting.yaml` for App Hosting runtime configuration.

**Testing Framework:**
No dedicated test runner is preconfigured. Testing strategy remains an explicit follow-on architecture and implementation decision.

**Code Organization:**
App Router structure under `src/app`, which fits the product's document-centric workflow surfaces and server/client composition needs.

**Development Experience:**
NPM-based install flow, ESLint with `next/core-web-vitals`, strict TS defaults, and a deployment path that can move either through GitHub-connected App Hosting or the Firebase CLI (`firebase init apphosting`) for local-source deployment.

**Note:** Project initialization using this command should be the first implementation story. Firebase Authentication, Firestore, Cloud Storage, and Cloud Functions setup should be added immediately after bootstrap as explicit infrastructure stories rather than assumed starter behavior.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Platform baseline:** Firebase App Hosting + Next.js App Router + TypeScript starter from Firebase's App Hosting adapters
- **Primary data architecture:** Cloud Firestore for application records and workflow state, Cloud Storage for uploaded source material and generated export files
- **Boundary validation:** Zod 4.4.3 for server-side schema validation at action, route, and integration boundaries
- **Authentication model:** Firebase Authentication with Google sign-in only for MVP
- **Authorization model:** Role-based authorization enforced in server-side application logic plus Firestore and Cloud Storage security rules
- **Application communication model:** Next.js Server Actions and Route Handlers for synchronous application flows; Cloud Functions for asynchronous or event-driven work
- **Deployment model:** Firebase App Hosting with GitHub-connected rollouts across separate dev, staging, and production environments

**Important Decisions (Shape Architecture):**
- **Frontend rendering model:** React Server Components by default, with client components only for interaction-heavy review surfaces
- **Form strategy:** React Hook Form 7.76.1 combined with Zod 4.4.3 for typed form handling and validation
- **Operational entry points:** Firebase CLI 15.19.0-compatible workflow for local-source App Hosting deploys when GitHub rollout is not the desired path
- **Storage separation:** raw confidential inputs remain distinct from structured workflow records and derived artifacts
- **Async processing boundary:** extraction, regeneration, export packaging, and event-triggered updates should run outside the request-response path when latency or retriability matters

**Deferred Decisions (Post-MVP):**
- Advanced caching strategy beyond framework defaults, because actual pilot usage patterns are not yet known
- Multi-provider authentication, because the product is internal-first and Google sign-in is sufficient for MVP
- Real-time collaboration patterns, because the current workflow is reviewer-driven rather than simultaneously collaborative
- Dedicated API developer portal or formal external API surface, because MVP is an internal application, not a platform product
- Cross-region data architecture and tenant isolation strategy, because region-specific controls and broader enterprise requirements were explicitly deferred in product planning

### Data Architecture

The system of record will be **Cloud Firestore** for Opportunities, Context Package metadata, Scope Brief revisions, Validation Review decisions, artifact manifests, export jobs, audit events, and authorization-linked workflow state. **Cloud Storage** will hold uploaded source documents, generated export binaries, and other large file assets that do not belong in Firestore documents.

**Validation approach:**
- Use **Zod 4.4.3** at application boundaries
- Validate Server Action inputs, Route Handler payloads, Firebase-triggered event payloads, and persistence contracts before writes occur
- Keep Firestore document shapes explicit and versionable so derived artifacts and validation decisions remain traceable over time

**Data modeling implications:**
- Firestore stores structured metadata and workflow state, not document blobs
- Cloud Storage stores source files and export outputs, referenced from Firestore by stable identifiers
- Artifact lineage should be modeled explicitly so the system can trace source material -> scope decisions -> generated outputs

**Migration / evolution approach:**
- Prefer additive schema evolution with versioned document fields and background backfill jobs where necessary
- Avoid relational-style migration assumptions that do not map cleanly to Firestore

### Authentication & Security

**Authentication:**
- Use **Firebase Authentication** with **Google sign-in only** for MVP
- This matches the internal-first nature of the product and reduces identity friction for pilot users

**Authorization:**
- Enforce **role-based authorization** in server-side code paths and Firebase security rules
- Roles should distinguish at least between editors / contributors and reviewers / approvers
- Sensitive operations such as export, deletion, approval override, and artifact finalization should always execute through trusted server-side paths

**Security posture:**
- Firestore and Cloud Storage rules should deny by default and permit only scoped, role-aware access
- Uploaded customer material and generated deliverables must remain access-controlled by Opportunity and role context
- No-promise overrides and approval actions must be audit logged as privileged workflow events

### API & Communication Patterns

**Primary synchronous model:**
- Use **Next.js Server Actions** for app-native mutations initiated from trusted UI flows
- Use **Route Handlers** for explicit HTTP boundaries, webhook-style integrations, file-oriented endpoints, and cases where a stable request/response surface is more appropriate

**Asynchronous model:**
- Use **Cloud Functions for Firebase** for event-driven or long-running work such as extraction jobs, regeneration, export packaging, post-write enrichment, and scheduled cleanup or backfill tasks
- Keep long-running analysis outside the UI request path so retries, status tracking, and failure handling remain explicit

**Error handling standard:**
- Surface typed domain errors to the app layer
- Preserve auditable failure states for extraction, validation, export, and authorization denials rather than masking them behind generic success-shaped fallbacks

**Rate limiting / abuse posture:**
- Internal MVP can start with authenticated access controls, role enforcement, and server-side validation as the main protective layers
- Broader request throttling can remain deferred unless pilot behavior shows abuse or unexpected cost pressure

### Frontend Architecture

**Rendering model:**
- Default to **React Server Components** for overview, list, history, and document-derived read surfaces
- Use client components only for interaction-dense flows such as review forms, drawers, diff interactions, filtering, and staged approval controls

**State management:**
- Do not introduce a global client state library at MVP start
- Prefer URL state, server-fetched state, local component state, and explicit form state before escalating to a broader client store

**Forms and validation:**
- Use **React Hook Form 7.76.1** with **Zod 4.4.3** for typed submission flows
- Keep validation rules shared where possible between form entry and server-side boundaries

**Performance posture:**
- Favor server-driven data loading for the heavy evidence and artifact surfaces
- Keep client bundles small by limiting client components to the parts of the UX that truly need interactivity

### Infrastructure & Deployment

**Hosting strategy:**
- Use **Firebase App Hosting** for the Next.js application
- Anchor on Firebase's documented App Hosting support assumptions rather than assuming the newest Next.js major is production-safe for this target
- Because current Next.js docs are on 16.2.6 while Firebase App Hosting's documented active support line is 15.0.x-15.2.x, implementation should stay aligned with Firebase's supported track unless the team explicitly accepts preview risk

**Deployment workflow:**
- Prefer **GitHub-connected rollouts** for normal promotion into hosted environments
- Support **Firebase CLI** deployment for local-source workflows when needed; current CLI line verified at **15.19.0**, above App Hosting's documented 14.4.0+ requirement

**Environment strategy:**
- Maintain separate **dev**, **staging**, and **production** Firebase environments/projects
- Keep secrets, storage buckets, authentication settings, and rollout controls isolated per environment

**Observability:**
- Use Firebase / Google Cloud logs and rollout visibility as the baseline operational layer
- Audit events for review approvals, no-promise overrides, export generation, and deletion actions should be first-class application telemetry, not ad hoc logs

### Decision Impact Analysis

**Implementation Sequence:**
1. Bootstrap the repo from the selected Firebase App Hosting Next.js starter
2. Establish Firebase project/environment layout and deployment wiring
3. Add Firebase Authentication with Google sign-in and role model foundations
4. Define Firestore collections/document contracts and Storage path conventions
5. Introduce Zod validation contracts at all server-side boundaries
6. Build the core Opportunity / Context Package / Scope Brief workflow using Server Actions and Route Handlers
7. Add Cloud Functions for extraction, regeneration, export, and background processing
8. Layer review-specific client components and typed forms onto the server-driven surfaces

**Cross-Component Dependencies:**
- Authorization rules depend on the Firestore data model and Storage path strategy
- Async Cloud Functions depend on stable document contracts and auditable status fields in Firestore
- Frontend review flows depend on typed validation contracts and explicit domain error handling
- Deployment and environment separation affect secrets, auth configuration, storage access, and all production-safe integrations

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
11 areas where AI agents could make different choices and create integration drift: Firestore naming, Storage path naming, route segment naming, shared type placement, server-only module placement, response envelopes, domain error shapes, async job event naming, loading-state persistence, audit event structure, and test placement.

### Naming Patterns

**Database Naming Conventions:**
- Use **lowercase plural collection names** in Firestore: `opportunities`, `contextPackages`, `scopeBriefs`, `validationReviews`, `clarificationPackets`, `artifacts`, `auditEvents`, `jobs`
- Use **camelCase field names** inside Firestore documents: `opportunityId`, `scopeConfidence`, `createdAt`, `sourceReferenceCount`
- Use explicit foreign-reference style fields ending in `Id`: `opportunityId`, `artifactId`, `createdByUserId`
- Use version fields as explicit integers: `version`, `schemaVersion`
- Keep document IDs opaque unless a human-readable slug is explicitly required

**API Naming Conventions:**
- Use **kebab-case route segments** in URL paths: `/api/opportunities`, `/api/context-packages`, `/api/export-jobs`
- Use **plural resource names** for collections and **singular identifiers** in path params: `/api/opportunities/{opportunityId}`
- Use **camelCase query parameters**: `includeHistory=true`, `artifactType=proposalDraft`
- Use standard HTTP headers; avoid custom header invention unless required for integration

**Code Naming Conventions:**
- Use **PascalCase** for React components and TypeScript types: `OpportunityOverview`, `ScopeBriefReviewPanel`, `ArtifactGenerationJob`
- Use **camelCase** for functions, variables, hooks, and server actions: `createOpportunity`, `generateScopeBrief`, `useValidationFilters`
- Use **kebab-case** for non-route file names and feature folders: `opportunity-overview.tsx`, `scope-brief-review`, `artifact-studio`
- Reserve Next.js special file names exactly as framework conventions require: `page.tsx`, `layout.tsx`, `route.ts`

### Structure Patterns

**Project Organization:**
- Organize domain logic **by feature first**, not by technical layer alone
- Keep App Router surfaces in `src/app`
- Keep reusable domain code in feature modules under `src/features`
- Keep shared platform adapters and cross-cutting helpers in `src/lib`
- Keep **server-only** logic separated from UI-facing modules so agents do not import privileged code into client components
- Co-locate tests with the code they verify using `*.test.ts` / `*.test.tsx`

**File Structure Patterns:**
- Firebase client/admin/bootstrap modules live under a dedicated shared location such as `src/lib/firebase`
- Validation schemas live beside the feature or server boundary they protect, with shared schemas extracted only when reused in multiple flows
- Route-specific transformation code stays close to the route or action, not in a generic dumping-ground utils file
- Static assets remain under `public`
- Environment access should be centralized behind typed config modules rather than ad hoc `process.env` usage throughout the app

### Format Patterns

**API Response Formats:**
- Route Handlers return a predictable JSON envelope: success responses use `{ data, meta? }`
- Error responses use `{ error: { code, message, details? } }`
- Do not mix direct raw objects and wrapped envelopes across different endpoints
- Use HTTP status codes semantically; do not encode success/failure only inside the body

**Data Exchange Formats:**
- Use **camelCase** JSON fields at application boundaries
- Use **ISO 8601 strings** for date/time values leaving the server or entering the client UI
- Convert Firebase `Timestamp` values at the boundary; do not leak raw SDK timestamp objects deep into client-facing contracts
- Use booleans as `true` / `false`, never numeric stand-ins
- Represent absent optional values explicitly as `null` only when the distinction from `undefined` matters to the contract

### Communication Patterns

**Event System Patterns:**
- Use **dot-separated, lowercase event names** for async workflow events: `opportunity.created`, `context-package.ingested`, `scope-brief.generated`, `artifact.export-requested`, `artifact.export-completed`
- Event payloads must include: `eventName`, `eventVersion`, `occurredAt`, `actorUserId` when applicable, and the relevant entity IDs
- Version async payloads explicitly with `eventVersion` to support evolution without ambiguous consumers
- Background job records in Firestore should use explicit statuses such as `queued`, `running`, `succeeded`, `failed`

**State Management Patterns:**
- Treat the server as the primary source of truth for persisted workflow state
- Prefer server-fetched state, URL state, local component state, and form state before introducing shared client stores
- Use immutable update patterns for local state
- Persist long-running job status in Firestore rather than hiding it in transient client memory

### Process Patterns

**Error Handling Patterns:**
- Use typed domain errors with stable machine-readable `code` values
- Separate **user-facing copy** from **diagnostic detail**
- Log structured server-side context for failures in extraction, export, permission checks, and background jobs
- Never swallow errors behind silent fallbacks for privileged or workflow-critical operations
- Auth and authorization failures should be explicit and auditable

**Loading State Patterns:**
- Use local loading indicators for narrow interactions and persisted job states for long-running operations
- Prefer skeletons/placeholders for server-rendered surfaces and inline pending states for action buttons/forms
- Long-running analysis or export actions must surface durable statuses such as `queued`, `running`, `blocked`, `failed`, `completed`
- Loading state names should reflect workflow meaning, not generic booleans alone: `isGeneratingScopeBrief`, `isSubmittingValidationReview`

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow the naming, envelope, and placement rules above instead of inventing local variations
- Keep server-only code out of client component import paths
- Use shared error and validation patterns rather than ad hoc per-feature formats
- Preserve Firestore / Storage / async job lineage explicitly for auditable workflows

**Pattern Enforcement:**
- Verify new work against the architecture document before implementation
- Treat deviations as architecture changes, not harmless local preferences
- Update the architecture document first if a pattern must change globally

### Pattern Examples

**Good Examples:**
- Firestore collection: `opportunities`
- Firestore field: `scopeConfidence`
- Route: `/api/export-jobs/{jobId}`
- Component file: `artifact-studio.tsx`
- Success response: `{ "data": { "jobId": "..." }, "meta": { "status": "queued" } }`
- Error response: `{ "error": { "code": "NO_PROMISE_BLOCKED", "message": "Resolve blocking validation issues before export." } }`
- Event name: `scope-brief.generated`

**Anti-Patterns:**
- Mixing `scope_briefs`, `scopeBriefs`, and `ScopeBriefs` for the same concept
- Returning raw Firebase SDK objects directly to UI consumers
- Putting privileged Firebase Admin logic in files imported by client components
- Using one endpoint format like `{ success: true, result: ... }` and another like `{ data: ... }`
- Tracking long-running generation only in temporary client state with no persisted job record

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
engniter-studio/
├── README.md
├── package.json
├── package-lock.json
├── next.config.mjs
├── tsconfig.json
├── eslint.config.mjs
├── apphosting.yaml
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .env.example
├── .env.local
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── validate-firebase-config.yml
├── public/
│   ├── icons/
│   └── images/
├── functions/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts
│       ├── lib/
│       │   ├── firebase-admin.ts
│       │   ├── logger.ts
│       │   ├── errors.ts
│       │   └── job-runtime.ts
│       ├── schemas/
│       │   ├── job-payloads.ts
│       │   └── audit-events.ts
│       ├── jobs/
│       │   ├── extract-context-package.ts
│       │   ├── regenerate-scope-brief.ts
│       │   ├── generate-artifact.ts
│       │   ├── build-export-package.ts
│       │   └── reconcile-stale-artifacts.ts
│       ├── triggers/
│       │   ├── on-context-package-created.ts
│       │   ├── on-validation-review-completed.ts
│       │   └── on-export-requested.ts
│       └── tests/
│           ├── extract-context-package.test.ts
│           └── build-export-package.test.ts
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   ├── unauthorized/
│   │   │   └── page.tsx
│   │   ├── opportunities/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [opportunityId]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       ├── context-package/
│   │   │       │   └── page.tsx
│   │   │       ├── validation-review/
│   │   │       │   └── page.tsx
│   │   │       ├── clarification-packet/
│   │   │       │   └── page.tsx
│   │   │       ├── artifacts/
│   │   │       │   └── page.tsx
│   │   │       └── history/
│   │   │           └── page.tsx
│   │   ├── api/
│   │   │   ├── opportunities/
│   │   │   │   ├── route.ts
│   │   │   │   └── [opportunityId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── exports/
│   │   │   │       │   └── route.ts
│   │   │   │       └── history/
│   │   │   │           └── route.ts
│   │   │   ├── context-packages/
│   │   │   │   └── [contextPackageId]/
│   │   │   │       ├── route.ts
│   │   │   │       └── source-files/
│   │   │   │           └── route.ts
│   │   │   ├── validation-reviews/
│   │   │   │   └── [validationReviewId]/route.ts
│   │   │   ├── artifacts/
│   │   │   │   └── [artifactId]/route.ts
│   │   │   └── jobs/
│   │   │       └── [jobId]/route.ts
│   │   └── (marketing)/
│   │       └── page.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── google-sign-in-button.tsx
│   │   │   ├── server/
│   │   │   │   ├── get-current-user.ts
│   │   │   │   ├── require-session.ts
│   │   │   │   └── require-role.ts
│   │   │   ├── schemas/
│   │   │   │   └── session.ts
│   │   │   └── auth.test.ts
│   │   ├── opportunities/
│   │   │   ├── components/
│   │   │   │   ├── opportunity-list.tsx
│   │   │   │   ├── opportunity-overview-header.tsx
│   │   │   │   └── opportunity-metadata-form.tsx
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── repository.ts
│   │   │   │   └── mapper.ts
│   │   │   ├── schemas/
│   │   │   │   └── opportunity.ts
│   │   │   ├── types.ts
│   │   │   └── opportunity-list.test.tsx
│   │   ├── context-packages/
│   │   │   ├── components/
│   │   │   │   ├── context-package-upload-form.tsx
│   │   │   │   ├── source-reference-drawer.tsx
│   │   │   │   └── context-package-history-table.tsx
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── repository.ts
│   │   │   │   └── storage.ts
│   │   │   ├── schemas/
│   │   │   │   └── context-package.ts
│   │   │   └── context-package-upload-form.test.tsx
│   │   ├── scope-briefs/
│   │   │   ├── components/
│   │   │   │   ├── scope-brief-panel.tsx
│   │   │   │   ├── scope-confidence-badge.tsx
│   │   │   │   └── source-reference-list.tsx
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── repository.ts
│   │   │   │   └── derive-scope-brief.ts
│   │   │   ├── schemas/
│   │   │   │   └── scope-brief.ts
│   │   │   └── scope-brief-panel.test.tsx
│   │   ├── validation-reviews/
│   │   │   ├── components/
│   │   │   │   ├── validation-review-form.tsx
│   │   │   │   ├── no-promise-alert.tsx
│   │   │   │   └── validation-issue-list.tsx
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── repository.ts
│   │   │   │   └── guardrails.ts
│   │   │   ├── schemas/
│   │   │   │   └── validation-review.ts
│   │   │   └── validation-review-form.test.tsx
│   │   ├── clarification-packets/
│   │   │   ├── components/
│   │   │   │   ├── clarification-packet-panel.tsx
│   │   │   │   └── clarification-item-list.tsx
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   └── repository.ts
│   │   │   ├── schemas/
│   │   │   │   └── clarification-packet.ts
│   │   │   └── clarification-packet-panel.test.tsx
│   │   ├── artifacts/
│   │   │   ├── components/
│   │   │   │   ├── artifact-studio-tabs.tsx
│   │   │   │   ├── artifact-version-table.tsx
│   │   │   │   └── export-actions.tsx
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   ├── repository.ts
│   │   │   │   └── export-guard.ts
│   │   │   ├── schemas/
│   │   │   │   └── artifact.ts
│   │   │   └── artifact-studio-tabs.test.tsx
│   │   ├── audit/
│   │   │   ├── server/
│   │   │   │   ├── record-audit-event.ts
│   │   │   │   └── queries.ts
│   │   │   └── schemas/
│   │   │       └── audit-event.ts
│   │   └── jobs/
│   │       ├── components/
│   │       │   └── job-status-badge.tsx
│   │       ├── server/
│   │       │   ├── queries.ts
│   │       │   └── repository.ts
│   │       └── schemas/
│   │           └── job.ts
│   ├── lib/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── firebase-project.ts
│   │   ├── firebase/
│   │   │   ├── client-app.ts
│   │   │   ├── admin-app.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   └── storage.ts
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   ├── error-codes.ts
│   │   │   └── to-error-response.ts
│   │   ├── http/
│   │   │   ├── api-response.ts
│   │   │   └── route-handler.ts
│   │   ├── telemetry/
│   │   │   ├── logger.ts
│   │   │   └── audit-context.ts
│   │   └── utils/
│   │       ├── dates.ts
│   │       ├── ids.ts
│   │       └── promises.ts
│   ├── server/
│   │   ├── ai/
│   │   │   ├── provider.ts
│   │   │   ├── analyze-context-package.ts
│   │   │   ├── generate-clarification-packet.ts
│   │   │   └── generate-artifact-draft.ts
│   │   └── exports/
│   │       ├── build-docx.ts
│   │       └── build-pdf.ts
│   ├── middleware.ts
│   └── types/
│       ├── api.ts
│       ├── auth.ts
│       └── domain.ts
└── tests/
    ├── e2e/
    │   ├── opportunity-creation.spec.ts
    │   ├── validation-review.spec.ts
    │   └── artifact-export.spec.ts
    ├── fixtures/
    │   ├── sample-context-package/
    │   └── source-documents/
    └── setup/
        ├── firebase-emulators.ts
        └── test-env.ts
```

### Architectural Boundaries

**API Boundaries:**
- `src/app/api/**` exposes explicit HTTP boundaries for integrations, file-oriented operations, and job polling
- Server Actions inside `src/features/*/server/actions.ts` handle UI-initiated mutations that do not need a public HTTP surface
- Auth checks happen before feature mutations or privileged reads
- `functions/src/**` handles background/event-driven boundaries and must not be imported into the web app runtime directly

**Component Boundaries:**
- Route segments under `src/app/**` compose pages and layout concerns
- Feature components under `src/features/**/components` own domain UI, not global app shell concerns
- Shared UI primitives should be introduced only when reused across multiple features; otherwise keep UI inside the owning feature
- Client components are limited to interaction-heavy surfaces; read-heavy surfaces stay server-rendered

**Service Boundaries:**
- `src/features/*/server/repository.ts` owns Firestore/Storage access for its feature
- `src/server/ai/**` owns provider-agnostic AI orchestration interfaces used by features and jobs
- `src/features/audit/server/**` owns audit recording/query behavior
- `functions/src/jobs/**` owns queued/retriable workload execution

**Data Boundaries:**
- Firestore stores structured workflow entities and status records
- Cloud Storage stores original uploads and generated export files
- Shared schemas in feature `schemas/` folders define allowed data shapes at each boundary
- Job status is persisted in Firestore so UI and async workers coordinate through durable records instead of hidden process state

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- **Opportunity creation and overview** -> `src/app/opportunities/**`, `src/features/opportunities/**`
- **Context Package ingestion and source history** -> `src/app/opportunities/[opportunityId]/context-package/**`, `src/features/context-packages/**`
- **Scope Brief generation and confidence display** -> `src/features/scope-briefs/**`, `src/server/ai/analyze-context-package.ts`, `functions/src/jobs/extract-context-package.ts`
- **Validation Review and no-promise gating** -> `src/app/opportunities/[opportunityId]/validation-review/**`, `src/features/validation-reviews/**`
- **Clarification Packet generation** -> `src/app/opportunities/[opportunityId]/clarification-packet/**`, `src/features/clarification-packets/**`
- **Mini PRD / SOW Draft / Proposal Draft generation and versioning** -> `src/app/opportunities/[opportunityId]/artifacts/**`, `src/features/artifacts/**`, `functions/src/jobs/generate-artifact.ts`
- **Export and internal handoff** -> `src/app/api/opportunities/[opportunityId]/exports/**`, `src/server/exports/**`, `functions/src/jobs/build-export-package.ts`
- **Audit trail and job history** -> `src/features/audit/**`, `src/features/jobs/**`

**Cross-Cutting Concerns:**
- **Authentication and authorization** -> `src/features/auth/**`, `src/lib/firebase/auth.ts`, `src/middleware.ts`, Firebase rules files at repo root
- **Validation contracts** -> `src/features/*/schemas/**`, `functions/src/schemas/**`
- **Shared error handling** -> `src/lib/errors/**`
- **Environment and Firebase project configuration** -> `src/lib/config/**`, `firebase.json`, `apphosting.yaml`
- **Observability and audit context** -> `src/lib/telemetry/**`, `src/features/audit/**`, `functions/src/lib/logger.ts`

### Integration Points

**Internal Communication:**
- Pages call feature queries/actions
- Feature server modules call repositories and shared server-only integrations
- Route Handlers wrap feature/server operations behind HTTP envelopes
- Cloud Functions consume durable job/event records and update Firestore status documents

**External Integrations:**
- Firebase Authentication for identity
- Cloud Firestore for structured workflow state
- Cloud Storage for uploads and exports
- Firebase App Hosting for the Next.js runtime
- Cloud Functions for asynchronous backend execution
- Future AI provider integration behind `src/server/ai/provider.ts`

**Data Flow:**
- User uploads source material -> metadata stored in Firestore, files stored in Cloud Storage
- UI or trigger creates async job record -> Cloud Function processes job -> Firestore updated with results/status
- Validation Review decisions update Scope Brief and artifact eligibility state
- Export request creates export job -> Cloud Function builds file -> Cloud Storage stores output -> Firestore records export artifact and status

### File Organization Patterns

**Configuration Files:**
- Root config files support web app build, Firebase deployment, and security rules
- `functions/` keeps its own package/runtime config because it has a separate deployment/runtime boundary
- Typed env access lives in `src/lib/config/env.ts`; serverless worker config lives in `functions/src/lib/job-runtime.ts`

**Source Organization:**
- `src/app` for routing and page composition
- `src/features` for feature-owned UI, server logic, tests, and schemas
- `src/lib` for shared platform utilities and cross-cutting helpers
- `src/server` for cross-feature privileged integrations that must never leak into client bundles

**Test Organization:**
- Feature and function unit tests are co-located
- End-to-end tests live in `tests/e2e`
- Shared fixtures and emulator setup live in `tests/fixtures` and `tests/setup`

**Asset Organization:**
- Public visual assets live in `public/`
- Confidential user uploads never live in the repo; they live in Cloud Storage and are referenced through Firestore metadata
- Generated exports are treated as runtime assets stored in Cloud Storage, not committed artifacts

### Development Workflow Integration

**Development Server Structure:**
- Local app development runs from the root Next.js project
- Firebase emulators and function tests run alongside the app when backend behavior needs validation
- The repo layout keeps synchronous app code and async worker code close enough for one-product development while preserving runtime boundaries

**Build Process Structure:**
- App Hosting builds the root Next.js app using the root config and lockfile
- Cloud Functions builds from the `functions/` workspace independently
- Shared contracts stay in the application repo structure, while runtime-specific code stays inside its own boundary

**Deployment Structure:**
- App Hosting deploys the web app from the repo root
- Firebase deploys rules, indexes, Storage policy, and `functions/` artifacts as separate but related deployment units
- The structure supports dev/staging/prod separation without changing code organization

## Architecture Validation

### Validation Summary

**Overall Status:** READY FOR IMPLEMENTATION

The architecture now covers the product's core workflow, technical baseline, key architectural decisions, consistency rules, and concrete project structure in enough detail to guide implementation without major cross-agent ambiguity. The document is aligned with the finalized PRD, the UX DESIGN / EXPERIENCE spines, and the selected Firebase-oriented platform direction.

### Validation Checklist Results

**Requirements Analysis:**
- [x] All functional requirements addressed
- [x] All non-functional requirements considered
- [x] Scale and complexity clearly assessed
- [x] Technical constraints documented

**Architectural Decisions:**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Guidance:**
- [x] Naming and structure patterns defined
- [x] Project structure completely mapped
- [x] Component boundaries documented
- [x] Requirements traced to structure

**Readiness Assessment:**
- [x] No critical blockers remain
- [x] Enough detail for implementation stories
- [x] Cross-agent ambiguity materially reduced
- [x] Clear implementation sequence defined

### Gap Analysis

**Critical Gaps:**
- None.

**Important Gaps:**
- None that block implementation.

**Nice-to-Have Follow-Ups:**
- Select the concrete test runner stack for the web app and end-to-end coverage when implementation begins
- Confirm the initial AI provider and model-routing policy behind `src/server/ai/provider.ts`
- Define the first required Firestore composite indexes once the exact query set is implemented
- Choose the concrete PDF / DOCX generation libraries during the export implementation story

### Alignment Check

**PRD Alignment:**
The architecture directly maps the PRD's canonical workflow around Opportunity -> Context Package -> Scope Brief -> Validation Review -> Clarification Packet / Mini PRD / SOW Draft / Proposal Draft -> Export / internal handoff. It also preserves the PRD's no-promise gating, auditability, access control, and source-traceability requirements.

**UX Alignment:**
The architecture supports the UX package's desktop-first responsive app model, evidence-near-the-work interaction style, stale-state visibility, review-focused flows, and accessibility baseline through server-first rendering, durable job tracking, drawer-compatible client components, and explicit route/feature ownership.

**Platform Alignment:**
The selected platform decisions remain coherent: Next.js + TypeScript on Firebase App Hosting, Firestore + Cloud Storage for data separation, Firebase Authentication for internal access, Cloud Functions for async jobs, and structured validation / error / audit patterns across the stack.

### Risk Review

**Primary Risks Still Present:**
- Long-running AI extraction and generation workflows may pressure UX responsiveness if job boundaries are not respected during implementation
- Firestore query/index design will need discipline as audit history and artifact lineage grow
- Export generation and confidential document handling will require careful implementation to preserve the trust model defined in product and UX work

**Mitigations Already Defined:**
- Durable job records and Cloud Functions for async work
- Explicit Firestore / Storage separation
- Typed server-side validation with Zod
- Server-enforced authorization and Firebase rules
- Audit-first handling for privileged workflow actions
- Consistent response, naming, and structure patterns to reduce accidental divergence

### Recommendation

Proceed to implementation planning and story decomposition using this architecture as the governing technical reference. Treat any later divergence in stack, structure, or pattern conventions as an architecture change rather than an implementation-local choice.

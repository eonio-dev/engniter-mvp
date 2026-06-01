---
baseline_commit: 53c36aa98059823230c18e292a532446e7a486f3
---

# Story 2.1: Generate a draft Scope Brief from the Context Package

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a technical pre-sales operator,
I want to run analysis on an Opportunity's Context Package,
so that I receive a draft Scope Brief I can review instead of starting scope definition from scratch.

## Acceptance Criteria

1. **Given** an Opportunity contains Context Package items  
   **When** an authorized user starts scope analysis  
   **Then** the system creates an analysis job and processes it asynchronously  
   **And** the user can see a durable status such as queued, running, succeeded, or failed.

2. **Given** analysis succeeds  
   **When** the draft Scope Brief is produced  
   **Then** it includes goals, functional requirements, non-functional requirements, integrations, constraints, risks, assumptions, exclusions, and open questions when evidence supports them  
   **And** the result is stored as the current draft Scope Brief for the Opportunity.

3. **Given** the Context Package is too sparse for trustworthy extraction  
   **When** analysis completes  
   **Then** the system returns a low-confidence sparse-input result instead of pretending the output is complete  
   **And** the UI routes the user back toward improving the Context Package.

4. **Given** a previous approved Scope Brief exists  
   **When** a later analysis attempt fails  
   **Then** the last approved Scope Brief remains preserved  
   **And** the failure is surfaced explicitly without wiping trusted state.

## Tasks / Subtasks

- [x] Install Anthropic SDK and add env var placeholders. (AC: 1, 2)
  - [ ] Run `npm install @anthropic-ai/sdk` — add to root `package.json` dependencies. Verify the import `import Anthropic from "@anthropic-ai/sdk"` compiles cleanly.
  - [ ] Add `ANTHROPIC_API_KEY=` to `.env.example`. This key is REQUIRED for analysis to run. If unset, the analysis route must return a clear `{ error: { code: "CONFIGURATION_ERROR", message: "ANTHROPIC_API_KEY is not configured." } }` with status 503 rather than crashing.
  - [ ] Add `ANTHROPIC_API_KEY: z.string().min(1).optional()` to `src/lib/config/env.ts` `envSchema` (optional — allows build without the key, fails gracefully at runtime).
- [x] Define job and Scope Brief Zod schemas and types. (AC: 1, 2, 4)
  - [ ] Create `src/features/jobs/schemas/job.ts` with `jobSchema` and `createJobSchema`:
    - `jobSchema` fields: `id`, `type` (`z.literal("extract-context-package")`), `opportunityId`, `status` (`z.enum(["queued","running","succeeded","failed"])`), `createdByUserId`, `createdAt`, `updatedAt`, `errorCode?: string | null`, `errorMessage?: string | null`, `resultRef?: string | null` (Firestore path to result doc).
    - `createJobSchema`: `opportunityId`, `type`.
  - [ ] Create `src/features/jobs/types.ts` re-exporting `Job`, `JobStatus`.
  - [ ] Create `src/features/scope-briefs/schemas/scope-brief.ts` with `scopeItemSchema` and `scopeBriefSchema`:
    - `SCOPE_CATEGORIES`: `z.enum(["goal","functionalRequirement","nonFunctionalRequirement","integration","constraint","risk","assumption","exclusion","openQuestion"])`.
    - `scopeItemSchema` fields: `id` (string), `category` (ScopeCategory), `content` (string min 1), `inferred` (boolean), `reviewStatus` (`z.enum(["pending","accepted","rejected","edited","flagged"])`), `sourceContextItemIds` (string array), `editedContent` (string nullable optional).
    - `scopeBriefSchema` fields: `id`, `opportunityId`, `jobId`, `version` (int ≥ 1), `status` (`z.enum(["draft","approved"])`), `scopeConfidence` (`z.enum(["Low","Medium","High"])`), `sparseInput` (boolean), `items` (scopeItemSchema array), `createdAt`, `createdByJobId`.
  - [ ] Create `src/features/scope-briefs/types.ts` re-exporting `ScopeItem`, `ScopeBrief`, `ScopeCategory`.
  - [ ] Create `src/features/jobs/schemas/job.test.ts` and `src/features/scope-briefs/schemas/scope-brief.test.ts` with schema unit tests (valid/invalid for key fields).
- [x] Implement Firestore repositories for jobs and scope briefs. (AC: 1, 2, 4)
  - [ ] Create `src/features/jobs/server/repository.ts`:
    - `createJob(input: { type, opportunityId, createdByUserId })` → writes to `jobs/{jobId}` with `status: "queued"` and server timestamps; returns jobId.
    - `getJob(jobId)` → returns `Job | null`.
    - `updateJobStatus(jobId, update: { status, errorCode?, errorMessage?, resultRef? })` → partial Firestore update.
    - `listJobsForOpportunity(opportunityId)` → returns jobs ordered by `createdAt` desc, limit 10.
  - [ ] Create `src/features/scope-briefs/server/repository.ts`:
    - `createScopeBrief(input: Omit<ScopeBrief, "id" | "createdAt">)` → writes to `scopeBriefs/{id}`, returns id.
    - `getLatestScopeBriefForOpportunity(opportunityId)` → queries `scopeBriefs` where `opportunityId == ?` orderBy `createdAt` desc limit 1.
    - `getScopeBrief(scopeBriefId)` → returns `ScopeBrief | null`.
  - [ ] Use `getAdminFirestore()` from `@/lib/firebase/firestore` (existing singleton). All server-only; never import into client components.
  - [ ] Update `firestore.rules`: add `jobs/{jobId}` (read if auth; create/update server-side only via Admin SDK — keep client rules deny); add `scopeBriefs/{scopeBriefId}` (read if auth; write only via Admin SDK — deny in rules).
- [x] Implement the AI analysis provider. (AC: 2, 3)
  - [ ] Create `src/server/ai/provider.ts` — exports `getAnthropicClient()` singleton using `new Anthropic({ apiKey: getServerEnv().ANTHROPIC_API_KEY })`. Throws `"CONFIGURATION_ERROR"` if key missing.
  - [ ] Create `src/server/ai/analyze-context-package.ts` — exports `analyzeContextPackage(items: ContextItem[]): Promise<AnalysisResult>`.
    - `AnalysisResult` type: `{ sparseInput: boolean; scopeConfidence: "Low" | "Medium" | "High"; items: ScopeItemDraft[] }` where `ScopeItemDraft = Omit<ScopeItem, "id" | "reviewStatus" | "editedContent">`.
    - **Sparse input check** (before calling Claude): if `items.length < 2` OR total character count of all `content` fields < 200, return `{ sparseInput: true, scopeConfidence: "Low", items: [] }` immediately without calling the AI.
    - **Claude call**: Use `claude-sonnet-4-5` model (balance of quality and cost). Use `client.messages.create()` with `max_tokens: 4096`. Use a structured JSON extraction prompt (see Technical Requirements section for full prompt template).
    - **Response parsing**: Parse Claude's text response as JSON. If parsing fails, throw with `code: "PARSE_ERROR"`. Validate the parsed object against a minimal Zod schema (items array, each with category, content, inferred). Add UUID `id` to each item, set `reviewStatus: "pending"`, `editedContent: null`.
    - **Scope confidence** (computed after parsing): `"Low"` if `sparseInput || items.length < 5`; `"Medium"` if `5 ≤ items.length < 15`; `"High"` if `items.length ≥ 15`. Claude's response may also flag confidence.
    - This file MUST stay in `src/server/` — never import into client components.
- [x] Implement the analysis Route Handler (start + async processing). (AC: 1, 2, 3, 4)
  - [ ] Create `src/app/api/opportunities/[opportunityId]/analysis/route.ts` as a `POST` Route Handler.
  - [ ] **Authentication**: use `getCurrentUser()` + `canAccessProtectedArea()` pattern from Story 1.3 (NOT `requireRole()`).
  - [ ] **Ownership**: verify `opportunity.createdByUserId === session.uid`.
  - [ ] **Existing job guard**: check if an active job (`status: "queued" | "running"`) already exists for this opportunity. If so, return `{ data: { jobId: existingJobId } }` with status 200 — idempotent.
  - [ ] **Create job**: call `createJob({ type: "extract-context-package", opportunityId, createdByUserId: session.uid })` → returns `jobId`. Return `{ data: { jobId } }` immediately.
  - [ ] **Schedule async work** using `unstable_after` from `next/server` — this runs AFTER the response is sent:
    ```ts
    import { unstable_after as after } from "next/server";
    after(async () => {
      await runAnalysis(jobId, opportunityId);
    });
    ```
  - [ ] Implement `runAnalysis(jobId, opportunityId)` as a module-level async function in the same file (or a helper module):
    1. `updateJobStatus(jobId, { status: "running" })`
    2. `listContextItemsChronological(opportunityId)` — read context items
    3. `analyzeContextPackage(contextItems)` — call AI
    4. `createScopeBrief({ opportunityId, jobId, version: nextVersion, status: "draft", ...analysisResult, createdByJobId: jobId })`
    5. `updateJobStatus(jobId, { status: "succeeded", resultRef: \`scopeBriefs/\${scopeBriefId}\` })`
    6. On any error: `updateJobStatus(jobId, { status: "failed", errorCode: err.code ?? "UNKNOWN", errorMessage: err.message })`
    7. **CRITICAL**: if a previous `approved` Scope Brief exists for this Opportunity and step 3-5 fails, the existing approved Scope Brief must NOT be deleted. The failure only affects the new job; old data is untouched.
  - [ ] **Note on `unstable_after`**: This is a Next.js 15 feature. It runs work after the response is sent. In production (Firebase App Hosting / Cloud Run), the process stays alive long enough for `after()` to complete. For local dev, works in `next dev`. Requires Node.js runtime (not Edge). The `unstable_` prefix indicates this API may change in future Next.js versions; accepted risk for MVP.
- [x] Implement the job status Route Handler. (AC: 1)
  - [ ] Create `src/app/api/jobs/[jobId]/route.ts` as a `GET` Route Handler.
  - [ ] Authentication: `getCurrentUser()` + `canAccessProtectedArea()`.
  - [ ] Return `{ data: { job } }` where `job` contains `{ id, status, errorCode, errorMessage, resultRef }`. No Opportunity ownership check needed for reading job status (job ID is opaque).
  - [ ] Return 404 with `{ error: { code: "NOT_FOUND", ... } }` if job doesn't exist.
- [x] Build the analysis status and Scope Brief display pages. (AC: 1, 2, 3, 4)
  - [ ] Update `src/app/opportunities/[opportunityId]/context-package/page.tsx`: add a "Run analysis" primary button that POSTs to `/api/opportunities/[opportunityId]/analysis` and on success redirects to `/opportunities/[opportunityId]/scope-brief?jobId=[jobId]`. This is a Client Component interaction — add a `RunAnalysisButton` client component.
  - [ ] Create `src/features/scope-briefs/components/run-analysis-button.tsx` (Client Component):
    - Shows "Run analysis" primary button when idle.
    - On click: POST to analysis endpoint (fetch), on success navigates to scope-brief page with jobId.
    - On error: shows inline error message.
    - Disable button while request is in flight.
  - [ ] Create `src/app/opportunities/[opportunityId]/scope-brief/page.tsx` (Server Component):
    - Calls `requireRole()`. Reads `searchParams.jobId` to show active job status.
    - Fetches latest Scope Brief via `getLatestScopeBriefForOpportunity(opportunityId)`.
    - If `searchParams.jobId` set: render `<JobStatusPanel jobId={jobId} />` (Client Component) that polls `/api/jobs/[jobId]` every 3 seconds using `setInterval` + `router.refresh()` until `succeeded` or `failed`.
    - If job `succeeded` and Scope Brief exists: render `<ScopeBriefPanel scopeBrief={scopeBrief} />` showing items grouped by category. Each item shows content, an `inferred` badge if `inferred: true`, and `reviewStatus: "pending"` badge.
    - If job `failed`: show error message and "Back to Context Package" link.
    - If `sparseInput: true`: show warning banner "Context Package is too thin for trustworthy extraction. Please add more source material." with "Back to Context Package" link.
    - If no Scope Brief and no active job: show "No analysis run yet" with "Run analysis" button.
  - [ ] Create `src/features/scope-briefs/components/job-status-panel.tsx` (Client Component) — polls for job status, shows spinner+status text, stops polling on terminal status.
  - [ ] Create `src/features/scope-briefs/components/scope-brief-panel.tsx` (Server Component for initial render, read-only) — groups items by category, renders each as a card. Items marked `inferred: true` get a visible "Inferred" chip. All items have `reviewStatus: "pending"` badge. No editing in this story (editing is Story 2.3).
  - [ ] Create `src/app/opportunities/[opportunityId]/scope-brief/loading.tsx` with skeleton.
  - [ ] Update `src/app/opportunities/[opportunityId]/page.tsx` navigation tab to add "Scope Brief" link alongside "Context Package".
- [x] Write tests and run full validation gate. (AC: 1, 2, 3)
  - [x] Schema tests, AI helper tests, full `npm test && npm run lint && npm run build` — 103 pass, 0 errors.

### Review Findings

- [x] [Review][Patch] No ownership check on `GET /api/jobs/[jobId]` — any auth user can read any job's details including opportunityId. Add `if (job.createdByUserId !== session.uid) return 403` [src/app/api/jobs/[jobId]/route.ts:19]
- [x] [Review][Patch] `scope-brief/page.tsx` uses `searchParams.jobId` with no ownership check — validate `activeJob.opportunityId === opportunityId` [src/app/opportunities/[opportunityId]/scope-brief/page.tsx:32]
- [x] [Review][Patch] Missing Firestore composite index for `(opportunityId, status)` query in `getActiveJobForOpportunity` — add to `firestore.indexes.json` [src/features/jobs/server/repository.ts:74]
- [x] [Review][Patch] AC3 violation: existing sparse-input brief hides `RunAnalysisButton` — user can't retry after improving Context Package. Show button even when a sparseInput brief exists [src/app/opportunities/[opportunityId]/scope-brief/page.tsx:75]
- [x] [Review][Patch] Pre-flight `ANTHROPIC_API_KEY` check missing — currently creates job then fails async; spec requires returning 503 before creating job when key is absent [src/app/api/opportunities/[opportunityId]/analysis/route.ts:80]
- [x] [Review][Patch] Item IDs use `Date.now()` — use `crypto.randomUUID()` for uniqueness [src/server/ai/analyze-context-package.ts:100]
- [x] [Review][Patch] Dead code: `sparseInput` warning inside `ScopeBriefPanel` is unreachable — page guards prevent rendering panel when sparseInput=true [src/features/scope-briefs/components/scope-brief-panel.tsx:42]
- [x] [Review][Defer] Race conditions: two concurrent POST requests both create jobs; two concurrent analysis runs both compute version=1 — MVP single-user acceptable — deferred, pre-existing pattern
- [x] [Review][Defer] Firestore write fails after brief created — brief orphaned, job stays failed — non-transactional limitation — deferred, acceptable for MVP
- [x] [Review][Defer] `unstable_after` no timeout: process termination leaves job stuck — documented MVP constraint — deferred, pre-existing
- [x] [Review][Defer] `useState` ignores prop updates in `JobStatusPanel` — up to 3s stale window acceptable — deferred, acceptable UX

## Dev Notes

### Story Foundation

- **Epic:** Epic 2 — Validated Scope Review and Risk Control. This is the first story in Epic 2 and introduces the AI analysis pipeline. Stories 2.2–2.5 build on top of the Scope Brief created here. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 2`]
- **FR coverage:** FR4 — Generate draft Scope Brief with job tracking, categories, sparse-input detection. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.1`]
- **Follow-on dependency:** Story 2.2 needs `scopeItems` from this story to show Source References. Story 2.3 needs `reviewStatus` field to implement accept/reject/edit. Do NOT pre-implement review logic now.

### Current Repository State (from Epic 1)

- **Context items available**: `listContextItemsChronological(opportunityId)` and `listContextItems(opportunityId)` in `src/features/context-packages/server/repository.ts`. Use the chronological (asc) version for building the analysis prompt — it gives oldest-first context. [Source: Story 1.4]
- **Auth pattern**: `getCurrentUser()` + `canAccessProtectedArea()` in Route Handlers. `requireRole()` in Server Components/Actions. [Source: Stories 1.3–1.4]
- **Firestore singleton**: `getAdminFirestore()` from `@/lib/firebase/firestore`. [Source: Story 1.2]
- **Import convention**: `@/` alias paths in Next.js; `.ts` extension in test files. [Source: Stories 1.2–1.4]
- **Navigation**: `<Link>` not `<a>`. [Source: Story 1.2]
- **Response envelope**: `{ data: { ... } }` success, `{ error: { code, message } }` failure with semantic HTTP status. [Source: Architecture]
- **Test runner**: Native Node `--experimental-strip-types`. Tests must not use browser APIs. Component tests with hooks need pure-function extraction. [Source: Story 1.4]
- **Env access**: `getServerEnv()` from `@/lib/config/env`. New `ANTHROPIC_API_KEY` must be added to `envSchema` and `.env.example`. [Source: `src/lib/config/env.ts`]

### Technical Requirements — Claude Prompt Template

The analysis prompt must be deterministic and output strict JSON. Use this structure:

```ts
const SYSTEM_PROMPT = `You are a technical scope extraction engine for pre-sales software consulting. 
Extract structured scope items from the provided client context material. 
Output ONLY valid JSON matching the schema. No explanation, no preamble, no markdown fences.`;

const USER_PROMPT = `Analyze the following Context Package items and extract a draft Scope Brief.

CONTEXT ITEMS:
${items.map((item, i) => `[${i + 1}] ${item.sourceType.toUpperCase()}: ${item.title}\n${item.content ?? "(file — no inline content)"}`).join("\n\n")}

Extract scope items in the following categories: goal, functionalRequirement, nonFunctionalRequirement, integration, constraint, risk, assumption, exclusion, openQuestion.

Rules:
- Only include items supported by the context above.
- Mark "inferred: true" for items that are reasonable inferences but have no direct evidence in the text.
- "sourceContextItemIds" should reference the [N] indices above (as strings like "1", "2").
- If the context is too sparse or vague for reliable extraction, set "sparseInput": true.
- Provide "scopeConfidence": "Low" | "Medium" | "High" based on context quality.

Output JSON schema:
{
  "sparseInput": boolean,
  "scopeConfidence": "Low" | "Medium" | "High",
  "items": [
    {
      "category": "goal" | "functionalRequirement" | "nonFunctionalRequirement" | "integration" | "constraint" | "risk" | "assumption" | "exclusion" | "openQuestion",
      "content": "string",
      "inferred": boolean,
      "sourceContextItemIds": ["1", "2"]
    }
  ]
}`;
```

Call parameters:
```ts
const response = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: USER_PROMPT }],
});
const raw = response.content[0].type === "text" ? response.content[0].text : "";
```

### Technical Requirements — `unstable_after` Pattern

Next.js 15 `unstable_after` runs a callback after the HTTP response is committed. This gives us async-like semantics without Cloud Functions:

```ts
import { unstable_after as after } from "next/server";

export async function POST(request, { params }) {
  // ... auth, validation, create job ...
  const jobId = await createJob({ ... });

  after(async () => {
    await runAnalysis(jobId, opportunityId);
  });

  return Response.json({ data: { jobId } });  // Returns immediately
}
```

Requirements:
- Must be in a Route Handler (not Server Action) for `after()` to work with long tasks
- Node.js runtime only — add `export const runtime = "nodejs"` to the route file
- Works in `next dev` (local) and Firebase App Hosting (Cloud Run stays alive post-response)
- **HALT if `unstable_after` is not available in build** — if import fails, check Next.js version

### Technical Requirements — Scope Confidence Computation

Extract as a pure function for testability:

```ts
export function computeScopeConfidence(
  sparseInput: boolean,
  itemCount: number,
): "Low" | "Medium" | "High" {
  if (sparseInput || itemCount < 5) return "Low";
  if (itemCount < 15) return "Medium";
  return "High";
}
```

Place in `src/server/ai/analyze-context-package.ts` and export. Test in `analyze-context-package.test.ts`.

### Technical Requirements — Scope Brief Version

When creating a new Scope Brief for an Opportunity, compute `version` as:
```ts
const existing = await getLatestScopeBriefForOpportunity(opportunityId);
const version = existing ? existing.version + 1 : 1;
```

The old Scope Brief is NOT deleted. Stored separately. AC4 is satisfied because the old approved Scope Brief survives even if the new job fails — the new job's failure only writes to the `jobs` document, not to any existing `scopeBriefs` document.

### Technical Requirements — Client-Side Job Polling

`JobStatusPanel` is a Client Component that polls until the job reaches a terminal status:

```ts
useEffect(() => {
  if (isTerminal(status)) return;
  const id = setInterval(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    const json = await res.json();
    setStatus(json.data?.job?.status);
    if (isTerminal(json.data?.job?.status)) {
      clearInterval(id);
      router.refresh(); // Re-render Server Component to pick up new Scope Brief
    }
  }, 3000);
  return () => clearInterval(id);
}, [jobId, status, router]);
```

Terminal statuses: `"succeeded"` and `"failed"`. Poll every 3 seconds. Stop on terminal. Call `router.refresh()` on success to trigger Server Component re-render.

### Architecture Compliance

- **`src/server/ai/`**: AI provider code lives here — server-only, never imported by client components. [Source: architecture Architectural Boundaries]
- **No Cloud Functions this story**: `unstable_after` is the MVP async pattern. Cloud Functions migration is deferred to when reliability requirements warrant it. Document this decision. [Source: Architecture Deferred Decisions note]
- **`functions/` workspace**: NOT created in this story — deferred. `unstable_after` achieves the same user-visible semantics.
- **Firestore naming**: `jobs` (lowercase plural), `scopeBriefs` (camelCase — note the architecture lists this exact name). [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]
- **Response envelope**: `{ data: { jobId } }` on success, `{ error: { code, message } }` on failure with HTTP status code. [Source: architecture Format Patterns]
- **Auth in Route Handlers**: `getCurrentUser()` not `requireRole()`. [Source: Story 1.3]

### File Structure Requirements

**New files:**
- `src/features/jobs/schemas/job.ts`
- `src/features/jobs/schemas/job.test.ts`
- `src/features/jobs/types.ts`
- `src/features/jobs/server/repository.ts`
- `src/features/scope-briefs/schemas/scope-brief.ts`
- `src/features/scope-briefs/schemas/scope-brief.test.ts`
- `src/features/scope-briefs/types.ts`
- `src/features/scope-briefs/server/repository.ts`
- `src/features/scope-briefs/components/run-analysis-button.tsx`
- `src/features/scope-briefs/components/job-status-panel.tsx`
- `src/features/scope-briefs/components/scope-brief-panel.tsx`
- `src/server/ai/provider.ts`
- `src/server/ai/analyze-context-package.ts`
- `src/server/ai/analyze-context-package.test.ts`
- `src/app/api/opportunities/[opportunityId]/analysis/route.ts`
- `src/app/api/jobs/[jobId]/route.ts`
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`
- `src/app/opportunities/[opportunityId]/scope-brief/loading.tsx`

**Modified files:**
- `src/lib/config/env.ts` — add `ANTHROPIC_API_KEY`
- `.env.example` — add `ANTHROPIC_API_KEY=`
- `firestore.rules` — add `jobs` and `scopeBriefs` collection rules
- `src/app/opportunities/[opportunityId]/context-package/page.tsx` — add RunAnalysisButton
- `src/app/opportunities/[opportunityId]/page.tsx` — add "Scope Brief" nav tab

**Install:**
- `npm install @anthropic-ai/sdk` — Anthropic Claude SDK

[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

### Firestore Rules

Add to `firestore.rules`:
```
match /jobs/{jobId} {
  allow read: if request.auth != null;
  allow write: if false;  // Only Admin SDK writes (server-side)
}
match /scopeBriefs/{scopeBriefId} {
  allow read: if request.auth != null;
  allow write: if false;  // Only Admin SDK writes (server-side)
}
```

### UX / Product Guardrails

- **"Run analysis" button placement**: primary button on context-package page — "Run analysis" is the forward motion action for the Opportunity. One primary action per surface. [Source: DESIGN.md Components primary-button]
- **Job status display**: show status text, not just a spinner. "Analysis queued.", "Analysing context…", "Analysis complete.", "Analysis failed." — short, explicit. [Source: EXPERIENCE.md Voice and Tone]
- **Sparse input warning**: warning banner with `warning-soft` background, links back to Context Package. Text: "Context Package is too thin for trustworthy extraction. Add more source material before running analysis." [Source: EXPERIENCE.md State Patterns — "Sparse Context Package"]
- **Inferred items**: show "Inferred" chip on scope items where `inferred: true`. This signals lower confidence. Use `warning-soft` background for the chip — not `trust-soft`. [Source: EXPERIENCE.md Trust and Evidence Model]
- **No hover-only status**: status chips must have visible text. Never color-only. [Source: EXPERIENCE.md Interaction Primitives — Banned]
- **No blank screen**: `loading.tsx` on scope-brief route, error state if fetch fails. [Source: AC4]

### HALT Conditions

- **`ANTHROPIC_API_KEY` not set**: The Route Handler must return 503 with `{ error: { code: "CONFIGURATION_ERROR", ... } }` rather than crash. Dev agent: do NOT try to fake an API key or implement a mock.
- **`unstable_after` not importable**: If `import { unstable_after } from "next/server"` fails at build, **HALT** and report. Do not implement a fallback pattern without user guidance.
- **`npm install @anthropic-ai/sdk` rejected by user**: **HALT** — this story requires the Anthropic SDK. No workaround.

### Testing Requirements

- Schema tests: `job.test.ts` — valid job passes, `status: "invalid"` fails. `scope-brief.test.ts` — valid ScopeBrief passes, unknown `category` fails, empty content fails.
- AI helper test: `analyze-context-package.test.ts` — `computeScopeConfidence(false, 0)` → `"Low"`, `computeScopeConfidence(false, 5)` → `"Medium"`, `computeScopeConfidence(false, 15)` → `"High"`, `computeScopeConfidence(true, 20)` → `"Low"`. Also test sparse input detection: `analyzeContextPackage([])` → `{ sparseInput: true, scopeConfidence: "Low", items: [] }` (no Claude call made when 0 items).
- All tests: native Node runner, `.ts` imports, no browser APIs.
- Run `npm test && npm run lint && npm run build` before marking complete.

### Anti-Patterns To Avoid

- Do **NOT** call Anthropic SDK from client components — AI calls are server-only.
- Do **NOT** delete existing Scope Briefs when creating a new version — only add. [AC4]
- Do **NOT** use `requireRole()` in Route Handlers — use `getCurrentUser()`. [Story 1.3]
- Do **NOT** implement Validation Review actions (accept/reject/edit) — that's Story 2.3.
- Do **NOT** create the `functions/` workspace — `unstable_after` is the MVP async pattern.
- Do **NOT** use `process.env.ANTHROPIC_API_KEY` directly — use `getServerEnv().ANTHROPIC_API_KEY`.
- Do **NOT** add `edge` runtime to the analysis Route Handler — `unstable_after` requires Node.js runtime.
- Do **NOT** show raw Claude output to the user — always parse and structure before display.
- Do **NOT** allow concurrent analysis jobs — check for existing queued/running job before creating a new one.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 2.1: Generate a draft Scope Brief from the Context Package`
- `_bmad-output/planning-artifacts/epics.md#Epic 2: Validated Scope Review and Risk Control`
- `_bmad-output/planning-artifacts/prds/prd-engniter-mvp-2026-05-30/prd.md#FR-4: Generate a draft Scope Brief`
- `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Data Architecture`
- `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#State Patterns`
- `_bmad-output/planning-artifacts/ux-designs/ux-engniter-mvp-2026-05-30/EXPERIENCE.md#Trust and Evidence Model`
- `src/features/context-packages/server/repository.ts`
- `src/features/auth/server/get-current-user.ts`
- `src/features/auth/server/access.ts`
- `src/lib/config/env.ts`
- `src/lib/firebase/firestore.ts`
- `src/app/api/context-packages/[opportunityId]/items/route.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm test && npm run lint && npm run build` — 103 pass, 0 lint errors, build OK
- Pure helpers extracted to `.helpers.ts` (same pattern as Stories 1.3, 1.4) — Node test runner can't handle `.tsx` or `@/` alias resolution in non-type imports
- `unstable_after` from `next/server` — works in Next.js 15.0.5, requires `export const runtime = "nodejs"` on route

### Completion Notes List

- `@anthropic-ai/sdk` installed; `ANTHROPIC_API_KEY` added to `envSchema` (optional) and `.env.example`.
- Job schema: `queued|running|succeeded|failed` statuses; `jobs` Firestore collection; Admin-only writes.
- Scope Brief schema: 9 categories, `scopeItems` array, `sparseInput` flag, `scopeConfidence: Low|Medium|High`, versioned (accumulated, never deleted — AC4).
- `isSparseInput` + `computeScopeConfidence` extracted to `analyze-context-package.helpers.ts` — testable without mocking Claude.
- `analyzeContextPackage()`: short-circuits on sparse input (< 2 items or < 200 chars total); calls `claude-sonnet-4-5`; parses JSON response with Zod; sets `reviewStatus: "pending"` on all items.
- Analysis Route Handler: `POST /api/opportunities/[opportunityId]/analysis` — creates job, uses `unstable_after` to run analysis after response sent; idempotent (returns existing active jobId).
- Job Route Handler: `GET /api/jobs/[jobId]` — returns job status for client polling.
- Scope Brief page: Server Component polls via `JobStatusPanel` (3s interval, `router.refresh()` on terminal); shows `ScopeBriefPanel` when succeeded; warning banner on `sparseInput`; error state on failure.
- Context Package page: added `RunAnalysisButton` when items exist; added "Scope Brief" nav tab to overview.
- Firestore rules: `jobs` and `scopeBriefs` collections — read allowed for auth users; write blocked (Admin SDK only).
- 103 tests, 0 regressions.

### File List

- `_bmad-output/implementation-artifacts/2-1-generate-a-draft-scope-brief-from-the-context-package.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `.env.example`
- `firestore.rules`
- `package.json`
- `package-lock.json`
- `src/lib/config/env.ts`
- `src/features/jobs/schemas/job.ts`
- `src/features/jobs/schemas/job.test.ts`
- `src/features/jobs/types.ts`
- `src/features/jobs/server/repository.ts`
- `src/features/scope-briefs/schemas/scope-brief.ts`
- `src/features/scope-briefs/schemas/scope-brief.test.ts`
- `src/features/scope-briefs/types.ts`
- `src/features/scope-briefs/server/repository.ts`
- `src/features/scope-briefs/components/run-analysis-button.tsx`
- `src/features/scope-briefs/components/job-status-panel.tsx`
- `src/features/scope-briefs/components/scope-brief-panel.tsx`
- `src/server/ai/provider.ts`
- `src/server/ai/analyze-context-package.helpers.ts`
- `src/server/ai/analyze-context-package.ts`
- `src/server/ai/analyze-context-package.test.ts`
- `src/app/api/opportunities/[opportunityId]/analysis/route.ts`
- `src/app/api/jobs/[jobId]/route.ts`
- `src/app/opportunities/[opportunityId]/scope-brief/page.tsx`
- `src/app/opportunities/[opportunityId]/scope-brief/loading.tsx`
- `src/app/opportunities/[opportunityId]/context-package/page.tsx`
- `src/app/opportunities/[opportunityId]/page.tsx`

### Change Log

- 2026-05-31: Story created from comprehensive analysis of epics, PRD, architecture, UX specs, and Epic 1 implementation state.
- 2026-05-31: Implemented Anthropic SDK integration, job/scope-brief Firestore schemas and repositories, AI analysis pipeline with `unstable_after` async pattern, job status polling UI, Scope Brief display with category grouping, sparse-input warning, and analysis trigger from Context Package page.

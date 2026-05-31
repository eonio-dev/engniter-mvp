---
baseline_commit: NO_VCS
---

# Story 1.1: Set up initial project from starter template

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a product team,
I want the project initialized from the approved Firebase App Hosting starter template,
so that MVP development begins on the validated technical foundation required for the Opportunity workspace.

## Acceptance Criteria

1. **Given** the approved architecture specifies the Firebase App Hosting Next.js TypeScript starter  
   **When** the project is initialized  
   **Then** the codebase is created from that starter template with dependencies installed  
   **And** the baseline configuration files required by the starter are present in the repository.
2. **Given** the starter-based project has been created  
   **When** the foundation for MVP development is wired in  
   **Then** Firebase Authentication, environment configuration, and protected route scaffolding are added  
   **And** the baseline app shell and global styling are ready for Epic 1 feature work.
3. **Given** a user is not authenticated  
   **When** they open a protected Opportunity route in the initialized app  
   **Then** they are routed to a sign-in experience that offers Google sign-in for the MVP  
   **And** protected routes remain inaccessible until authentication succeeds.
4. **Given** a signed-in user lacks the required role or access context  
   **When** they attempt to access a protected area  
   **Then** trusted server-side checks and Firebase rules deny access  
   **And** the UI shows an explicit unauthorized state rather than a silent failure.

## Tasks / Subtasks

- [x] Bootstrap the repository root from the approved Firebase App Hosting Next.js starter without creating a nested app folder. (AC: 1)
  - [x] Generate the starter in a temporary location, then merge the application files into the current repository root so the app lives at the root alongside the existing `.agents`, `_bmad`, `_bmad-output`, `docs`, and `openspec` directories.
  - [x] Bring over the expected root starter baseline: `package.json`, lockfile, `next.config.*`, `tsconfig.json`, `eslint.config.*`, `apphosting.yaml`, `src/app/**`, `public/**`, and any required starter metadata files.
  - [x] Keep the repository as a single root Next.js app; do **not** commit an `engniter-studio/` subdirectory containing the app.
- [x] Establish the root Firebase and environment foundation required by the architecture. (AC: 1, 2, 4)
  - [x] Add Firebase config/rules placeholders at the repo root: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, and `.env.example`.
  - [x] Add typed environment access under `src/lib/config/**` and Firebase bootstrap modules under `src/lib/firebase/**`.
  - [x] Start with secure default rules and configuration; unauthenticated or unscoped access must be denied by default.
- [x] Implement the authentication baseline for MVP using Firebase Authentication and Google sign-in only. (AC: 2, 3, 4)
  - [x] Create the sign-in route and Google sign-in UI under the auth feature path defined by the architecture.
  - [x] Add server-side session and role helpers such as current-user lookup, session requirement, and role requirement under `src/features/auth/server/**`.
  - [x] Add middleware and route protection so Opportunity surfaces are protected and unauthorized users are routed correctly.
- [x] Create the baseline app shell and protected Opportunity route scaffolding needed by Epic 1 follow-on stories. (AC: 2, 3, 4)
  - [x] Add `src/app/layout.tsx`, `src/app/globals.css`, `src/app/sign-in/page.tsx`, `src/app/unauthorized/page.tsx`, and a protected `src/app/opportunities/page.tsx`.
  - [x] Make the app shell desktop-first, with stable navigation and explicit loading/unauthorized treatments aligned to UX guidance.
  - [x] Ensure the protected Opportunity route is inaccessible before auth succeeds and renders an explicit unauthorized state when role checks fail.
- [x] Validate the foundation without inventing architecture-local patterns. (AC: 1, 2, 3, 4)
  - [x] Run the starter's existing lint/build commands after bootstrap and integration.
  - [x] Keep any new validation or helper code aligned to the architecture envelope, naming, and placement rules.
  - [x] If implementation adds any tests in this story, place them using the architecture's co-location rules rather than inventing a separate structure.

### Review Findings

- [x] [Review][Patch] Enforce successful server-session deletion before completing logout flow [src/features/auth/components/sign-out-button.tsx:25]
- [x] [Review][Patch] Surface session verification failures explicitly instead of silently treating them as anonymous access [src/features/auth/server/get-current-user.ts:14]
- [x] [Review][Patch] Add regression coverage for the real auth/session flow, including session route, logout, middleware gating, and protected-route access [src\lib\config\firebase-project.test.ts:1]
- [x] [Review][Patch] Fail closed when `AUTH_ALLOWED_EMAIL_DOMAINS` is not configured [src/lib/config/firebase-project.ts:19]
- [x] [Review][Patch] Prevent invalid session cookies from crashing the public home route [src/app/page.tsx:8]
- [x] [Review][Patch] Catch only the real `SessionVerificationError` type on the public home route [src/app/home-session.ts:7]
- [x] [Review][Defer] Harden email-domain parsing against malformed addresses with multiple `@` characters [src/lib/config/firebase-project.ts:23] — deferred, pre-existing
- [x] [Review][Defer] Reject backslash-based redirect targets like `/\\evil.com` in `getSafeRedirectPath` [src/lib/config/firebase-project.ts:28] — deferred, pre-existing

## Dev Notes

### Story Foundation

- **Epic:** Epic 1 - Secure Opportunity Intake Workspace. This story establishes the technical baseline for all later Opportunity, Context Package, and workspace history work. [Source: `_bmad-output\planning-artifacts\epics.md#Epic 1: Secure Opportunity Intake Workspace`]
- **FR coverage:** Supports FR1, FR2, and FR3 indirectly by creating the authenticated Opportunity workspace foundation required before metadata, context ingestion, and history can exist. [Source: `_bmad-output\planning-artifacts\epics.md#Story 1.1: Set up initial project from starter template`]
- **Follow-on dependency:** Stories 1.2-1.4 expect the route structure, app shell, auth baseline, and secure workspace scaffolding from this story to already exist. Do not treat this as a generic starter import; it is the foundation story for Epic 1 delivery. [Source: `_bmad-output\planning-artifacts\epics.md#Story 1.2: Create and edit Opportunity metadata`, `_bmad-output\planning-artifacts\epics.md#Story 1.3: Add Context Package items with source metadata`, `_bmad-output\planning-artifacts\epics.md#Story 1.4: Review Opportunity workspace and Context Package history`]

### Current Repository State

- The repository is **not bootstrapped yet**. There is no root `package.json` and no existing application source tree, so this story is primarily net-new application creation. [Source: repository root listing; `package.json` not present]
- The repository already contains planning and BMAD workflow assets. Preserve `.agents`, `_bmad`, `_bmad-output`, `docs`, `openspec`, `.github`, and `.git` while adding the app. Do not overwrite or relocate those directories during starter import. [Source: repository root listing]
- There is no prior story file in `implementation-artifacts` for Epic 1 and there is no git commit history yet. Do not assume previous implementation conventions beyond the planning artifacts. [Source: `_bmad-output\implementation-artifacts\sprint-status.yaml`, `git log --oneline -5`]

### Technical Requirements

- Use the **Firebase App Hosting Next.js basic starter** as the bootstrap source. This is the selected starter and the first implementation story is explicitly expected to initialize from it. [Source: `_bmad-output\planning-artifacts\architecture.md#Selected Starter: Firebase App Hosting Next.js basic starter`]
- Keep the app at the **repository root**. The architecture's canonical structure places the Next.js app at the root and a future `functions/` workspace beside it; it does not place the app in a nested subfolder. [Source: `_bmad-output\planning-artifacts\architecture.md#Project Structure & Boundaries`]
- Add **Firebase Authentication with Google sign-in only** for MVP. Do not introduce email/password, magic links, multi-provider auth, or custom auth abstractions in this story. [Source: `_bmad-output\planning-artifacts\architecture.md#Authentication & Security`, `_bmad-output\planning-artifacts\prds\prd-engniter-mvp-2026-05-30\prd.md#8. Cross-Cutting NFRs`]
- Add **environment configuration** through typed config modules rather than scattering `process.env` access. [Source: `_bmad-output\planning-artifacts\architecture.md#Structure Patterns`, `_bmad-output\planning-artifacts\architecture.md#File Organization Patterns`]
- Implement **protected route scaffolding** for Opportunity surfaces and route unauthenticated users to sign-in, while sending authenticated-but-unauthorized users to an explicit unauthorized state. [Source: `_bmad-output\planning-artifacts\epics.md#Story 1.1: Set up initial project from starter template`, `_bmad-output\planning-artifacts\architecture.md#Authentication & Security`]
- Start Firebase rules from a **deny-by-default** posture. Because the Opportunity data model is not fully implemented yet, safe defaults are preferable to permissive placeholders. [Source: `_bmad-output\planning-artifacts\architecture.md#Authentication & Security`]

### Architecture Compliance

- **Platform baseline:** Next.js App Router + TypeScript on Firebase App Hosting. Use the starter's baseline rather than improvising another framework or deployment path. [Source: `_bmad-output\planning-artifacts\architecture.md#Core Architectural Decisions`]
- **Communication model:** This story only needs scaffolding; do not prematurely add broad API surfaces or async job infrastructure beyond what is needed for auth and route protection. Server Actions and Route Handlers remain the default sync patterns for later stories. [Source: `_bmad-output\planning-artifacts\architecture.md#API & Communication Patterns`]
- **Rendering model:** Default to React Server Components for the initial app shell and protected routes. Only use client components where the interaction actually requires it, such as a Google sign-in button. [Source: `_bmad-output\planning-artifacts\architecture.md#Frontend Architecture`]
- **Authorization:** Role-based checks must exist in trusted server-side paths plus Firebase rules. Do not rely on client-only guards. [Source: `_bmad-output\planning-artifacts\architecture.md#Authentication & Security`]
- **Error handling:** Auth and authorization failures must be explicit and auditable. Unauthorized users should see a concrete unauthorized UI, not a blank screen or silent redirect loop. [Source: `_bmad-output\planning-artifacts\architecture.md#Process Patterns`, `_bmad-output\planning-artifacts\epics.md#Story 1.1: Set up initial project from starter template`]

### Library / Framework Requirements

- **Next.js:** Follow the App Router model and reserve framework file names exactly (`page.tsx`, `layout.tsx`, `route.ts`). Avoid Pages Router setup. [Source: `_bmad-output\planning-artifacts\architecture.md#Naming Patterns`, `https://nextjs.org/docs`]
- **Firebase App Hosting:** Prefer the starter and deployment conventions that align with App Hosting's GitHub-integrated, Cloud Build / Cloud Run / Cloud CDN flow. Do not optimize this bootstrap around Vercel-specific assumptions. [Source: `_bmad-output\planning-artifacts\architecture.md#Selected Starter: Firebase App Hosting Next.js basic starter`, `https://firebase.google.com/docs/app-hosting`]
- **Version discipline:** The architecture explicitly warns against jumping to the newest Next.js major ahead of Firebase App Hosting support. Use the starter-pinned dependency set or the Firebase-supported track; do not manually upgrade to `next@latest` in this story. [Source: `_bmad-output\planning-artifacts\architecture.md#Selected Starter: Firebase App Hosting Next.js basic starter`, `_bmad-output\planning-artifacts\architecture.md#Infrastructure & Deployment`]
- **Zod:** When adding environment or session validation, use Zod and keep TypeScript strict mode enabled. [Source: `_bmad-output\planning-artifacts\architecture.md#Core Architectural Decisions`, `https://zod.dev`]
- **React Hook Form:** It is the architecture-approved form stack for later typed workflows, but this story should not add broad form abstractions unless a specific screen requires them. If used, keep it localized and aligned with `useForm` / minimal rerender patterns. [Source: `_bmad-output\planning-artifacts\architecture.md#Frontend Architecture`, `https://react-hook-form.com/docs`]
- **Styling:** Keep the starter's minimal global CSS baseline and evolve it toward the UX token system. Do **not** introduce Tailwind, a UI kit, or another styling framework as an unplanned architecture change in this story. [Source: `_bmad-output\planning-artifacts\architecture.md#Selected Starter: Firebase App Hosting Next.js basic starter`, `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md#Brand & Style`]

### File Structure Requirements

- Create or update root app files consistent with the architecture map:
  - `package.json`, lockfile, `next.config.*`, `tsconfig.json`, `eslint.config.*`, `apphosting.yaml`
  - `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `.env.example`
  - `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  - `src/app/sign-in/page.tsx`
  - `src/app/unauthorized/page.tsx`
  - `src/app/opportunities/page.tsx`
  - `src/features/auth/components/google-sign-in-button.tsx`
  - `src/features/auth/server/get-current-user.ts`
  - `src/features/auth/server/require-session.ts`
  - `src/features/auth/server/require-role.ts`
  - `src/features/auth/schemas/session.ts`
  - `src/lib/config/env.ts`, `src/lib/config/firebase-project.ts`
  - `src/lib/firebase/client-app.ts`, plus adjacent auth/admin/firestore/storage bootstrap files as needed
  - `src/middleware.ts`
  [Source: `_bmad-output\planning-artifacts\architecture.md#Complete Project Directory Structure`, `_bmad-output\planning-artifacts\architecture.md#Requirements to Structure Mapping`]
- Use **feature-first placement**. Do not create generic `utils/auth.ts`, `services/auth.ts`, or a top-level `components/` dumping ground for auth-specific UI. [Source: `_bmad-output\planning-artifacts\architecture.md#Structure Patterns`]
- Keep privileged Firebase Admin and server-only auth logic outside client import paths. [Source: `_bmad-output\planning-artifacts\architecture.md#Architectural Boundaries`, `_bmad-output\planning-artifacts\architecture.md#Pattern Examples`]
- Do not create the future `functions/` workspace unless it is required for this story. Story 1.1 is about foundation bootstrap, auth baseline, and protected route scaffolding, not background job execution. [Source: `_bmad-output\planning-artifacts\architecture.md#Decision Impact Analysis`, `_bmad-output\planning-artifacts\architecture.md#Project Structure & Boundaries`]

### UX / Product Guardrails

- The app shell must feel like a **stable internal review workspace**, not a marketing surface. Keep copy sober and explicit. [Source: `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md#Brand & Style`, `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md#Voice and Tone`]
- Use a **desktop-first** baseline with stable navigation. Even this initial shell should align to the three-zone workspace direction on large screens. [Source: `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md#Layout & Spacing`, `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md#Responsive & Platform`]
- Unauthorized and unavailable states must be explicit, never blank. This matters for both auth failures and future permission changes. [Source: `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md#State Patterns`]
- Maintain visible text for state; never rely on color alone. Preserve focus visibility and keyboard usability even in the initial shell and sign-in flow. [Source: `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md#Accessibility Floor`, `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md#Colors`]
- Seed global styles from the design tokens already defined in `DESIGN.md` instead of inventing a second token vocabulary. [Source: `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md`]

### Current State / What This Story Changes / What Must Be Preserved

- **Current state:** There is no application code yet; the repository contains planning, docs, and BMAD workflow assets only.
- **What this story changes:** It creates the root Next.js/Firebase application baseline, auth scaffolding, protected route scaffolding, typed env access, and minimal app shell styling.
- **What must be preserved:** Existing planning and BMAD directories, repository root git metadata, the single-repo root-app architecture, strict TypeScript posture, feature-first folder conventions, and deny-by-default security assumptions.

### Testing Requirements

- The starter does **not** come with a dedicated test runner preconfigured. Do not invent a large custom test stack casually in this story. [Source: `_bmad-output\planning-artifacts\architecture.md#Selected Starter: Firebase App Hosting Next.js basic starter`]
- Minimum validation for this story should include the starter's existing lint/build commands after the bootstrap lands. [Source: `_bmad-output\planning-artifacts\architecture.md#Selected Starter: Firebase App Hosting Next.js basic starter`]
- If any tests are introduced now, place them according to architecture rules:
  - unit tests co-located with the code they verify using `*.test.ts` / `*.test.tsx`
  - end-to-end tests only under `tests/e2e`
  [Source: `_bmad-output\planning-artifacts\architecture.md#Implementation Patterns & Consistency Rules`, `_bmad-output\planning-artifacts\architecture.md#Test Organization`]
- Route protection behavior is important enough that implementation should at least manually prove:
  - unauthenticated access to protected Opportunity routes redirects to sign-in
  - authenticated users without role/access see unauthorized state
  - public routes remain reachable

### Anti-Patterns To Avoid

- Do **not** bootstrap into `engniter-studio/` and leave the real app nested one level below the repo root.
- Do **not** replace the Firebase App Hosting starter with `create-next-app`, `create-t3-app`, or a hand-rolled setup.
- Do **not** upgrade Next.js to the newest major just because the public docs are ahead of the App Hosting support line.
- Do **not** introduce Tailwind, a component library, Zustand, or a custom auth framework as an unreviewed architecture deviation.
- Do **not** depend on client-only route guards for authorization.
- Do **not** create permissive placeholder Firebase rules.
- Do **not** add generic utility buckets that bypass the documented `src/features`, `src/lib`, and `src/server` boundaries.

### Latest Technical Information

- **Next.js docs** currently position App Router as the standard path for full-stack applications and explicitly distinguish it from Pages Router. That matches the architecture and means new bootstrap work should stay in `src/app/**`. [Source: `https://nextjs.org/docs`]
- **Firebase App Hosting docs** emphasize GitHub-connected deployments and the managed Cloud Build -> Cloud Run -> Cloud CDN rollout chain. The bootstrap should stay compatible with those assumptions rather than introducing deployment-specific hacks. [Source: `https://firebase.google.com/docs/app-hosting`]
- **React Hook Form docs** continue to center `useForm`, `useFormContext`, `useWatch`, and `useFormState` around minimal rerenders. Use that guidance later for dense entry flows, but do not overengineer Story 1.1 around future forms. [Source: `https://react-hook-form.com/docs`]
- **Zod docs** continue to require TypeScript strict mode as a best practice. Preserve strict TypeScript config when merging the starter into the repo and use Zod for typed env/session boundaries rather than ad hoc parsing. [Source: `https://zod.dev`]

### Project Structure Notes

- The architecture's canonical future structure is larger than what this story needs. Implement only the foundation subset needed for auth, route protection, app shell, and Firebase bootstrap.
- Future stories will extend `src/app/opportunities/**`, `src/features/opportunities/**`, and `src/features/context-packages/**`; this story should prepare those paths, not pre-implement their full business logic.
- There is no existing app code to update, so the highest regression risk is **structural**: misplacing files, overcommitting to the wrong libraries, or importing server-only modules into client code.

### References

- `_bmad-output\planning-artifacts\epics.md#Story 1.1: Set up initial project from starter template`
- `_bmad-output\planning-artifacts\epics.md#Epic 1: Secure Opportunity Intake Workspace`
- `_bmad-output\planning-artifacts\architecture.md#Selected Starter: Firebase App Hosting Next.js basic starter`
- `_bmad-output\planning-artifacts\architecture.md#Core Architectural Decisions`
- `_bmad-output\planning-artifacts\architecture.md#Authentication & Security`
- `_bmad-output\planning-artifacts\architecture.md#Implementation Patterns & Consistency Rules`
- `_bmad-output\planning-artifacts\architecture.md#Complete Project Directory Structure`
- `_bmad-output\planning-artifacts\architecture.md#Requirements to Structure Mapping`
- `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md#Brand & Style`
- `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md#Layout & Spacing`
- `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md#Voice and Tone`
- `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md#State Patterns`
- `_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md#Accessibility Floor`
- `_bmad-output\planning-artifacts\prds\prd-engniter-mvp-2026-05-30\prd.md#4.1 Opportunity Workspace and Context Package`
- `_bmad-output\planning-artifacts\prds\prd-engniter-mvp-2026-05-30\prd.md#8. Cross-Cutting NFRs`
- `https://nextjs.org/docs`
- `https://firebase.google.com/docs/app-hosting`
- `https://react-hook-form.com/docs`
- `https://zod.dev`

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- No prior story implementation logs exist yet.
- Repository has no commit history yet.
- `npx giget@latest "gh:firebase/apphosting-adapters/starters/nextjs/basic#main" %TEMP%\engniter-starter --install`
- `npm install firebase firebase-admin zod`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm test && npm run lint && npm run build`
- `npm test`
- `npm run lint && npm run build`
- `npm test && npm run lint && npm run build`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Target story auto-selected from sprint status as the first backlog story.
- Epic 1 should move to `in-progress` when this story is created.
- Story 1.1 should move to `ready-for-dev` in sprint tracking.
- Bootstrapped the repository root from the approved Firebase App Hosting Next.js starter and preserved the BMAD/planning directories at the repo root.
- Added root Firebase configuration, deny-by-default Firestore and Storage rules, typed environment parsing, and Firebase client/admin bootstrap modules.
- Implemented Google sign-in, secure session creation, server-side session and access helpers, middleware-based route protection, explicit unauthorized UI, and the protected `/opportunities` shell.
- Added co-located native TypeScript tests for auth/session and config helpers, and confirmed `npm test`, `npm run lint`, and `npm run build` all pass.
- Resolved the logout review finding by requiring a successful server-session DELETE before client sign-out redirect completion, with explicit user-facing error feedback on failure.
- Resolved the session verification review finding by surfacing invalid session verification through a dedicated server-side error path and explicit sign-in messaging.
- Resolved the regression-coverage review finding by adding guardrail tests for logout session deletion, protected-route gating, session cookie responses, session verification, and access checks.
- Resolved the fail-closed review finding by denying access when `AUTH_ALLOWED_EMAIL_DOMAINS` is unset or empty, preserving the deny-by-default auth posture.
- Resolved the public-home review finding by isolating session-verification errors on the public home route and safely degrading to anonymous rendering instead of crashing.
- Resolved the final public-home review finding by matching the real `SessionVerificationError` type and adding a `.js` shim so the helper stays compatible with both Next.js build rules and the native TypeScript test runner.

### File List

- `_bmad-output\implementation-artifacts\1-1-set-up-initial-project-from-starter-template.md`
- `_bmad-output\implementation-artifacts\sprint-status.yaml`
- `.env.example`
- `.gitignore`
- `.prettierrc`
- `README.md`
- `apphosting.yaml`
- `eslint.config.mjs`
- `firebase.json`
- `firestore.indexes.json`
- `firestore.rules`
- `next-env.d.ts`
- `next.config.mjs`
- `package-lock.json`
- `package.json`
- `public\between-cards.svg`
- `public\between-links.svg`
- `src\app\globals.css`
- `src\app\layout.tsx`
- `src\app\home-session.test.ts`
- `src\app\home-session.ts`
- `src\app\page.tsx`
- `src\app\api\auth\session\route.ts`
- `src\app\opportunities\page.tsx`
- `src\app\sign-in\page.tsx`
- `src\app\unauthorized\page.tsx`
- `src\features\auth\components\google-sign-in-button.tsx`
- `src\features\auth\components\sign-out-button.tsx`
- `src\features\auth\client\delete-session.test.ts`
- `src\features\auth\client\delete-session.ts`
- `src\features\auth\schemas\session.test.ts`
- `src\features\auth\schemas\session.ts`
- `src\features\auth\schemas\session.js`
- `src\features\auth\server\access.test.ts`
- `src\features\auth\server\access.ts`
- `src\features\auth\server\get-current-user.ts`
- `src\features\auth\server\protected-route.test.ts`
- `src\features\auth\server\protected-route.ts`
- `src\features\auth\server\require-role.ts`
- `src\features\auth\server\require-session.ts`
- `src\features\auth\server\session-verification.js`
- `src\features\auth\server\session-response.test.ts`
- `src\features\auth\server\session-response.ts`
- `src\features\auth\server\session-verification.test.ts`
- `src\features\auth\server\session-verification.ts`
- `src\lib\config\env.ts`
- `src\lib\config\firebase-project.test.ts`
- `src\lib\config\firebase-project.js`
- `src\lib\config\firebase-project.ts`
- `src\lib\firebase\admin.ts`
- `src\lib\firebase\client-app.ts`
- `src\middleware.ts`
- `storage.rules`
- `tsconfig.json`
- `src\app\components\Arrow.tsx` (deleted)
- `src\app\components\ArrowBox.tsx` (deleted)
- `src\app\components\Firebase.tsx` (deleted)
- `src\app\components\Header.tsx` (deleted)
- `src\app\components\Loading.tsx` (deleted)
- `src\app\components\Timeout.tsx` (deleted)
- `src\app\components\index.tsx` (deleted)
- `src\app\isr\demand\RegenerateButton.tsx` (deleted)
- `src\app\isr\demand\page.tsx` (deleted)
- `src\app\isr\demand\revalidate\route.ts` (deleted)
- `src\app\isr\page.tsx` (deleted)
- `src\app\isr\time\page.tsx` (deleted)
- `src\app\not-found.tsx` (deleted)
- `src\app\ssg\page.tsx` (deleted)
- `src\app\ssr\page.tsx` (deleted)
- `src\app\ssr\streaming\page.tsx` (deleted)
- `src\app\utils.ts` (deleted)

### Change Log

- 2026-05-30: Bootstrapped the Firebase App Hosting Next.js starter at the repo root, added secure auth/session scaffolding, protected Opportunity workspace routing, deny-by-default Firebase config, and native TypeScript guardrail tests.
- 2026-05-30: Addressed Story 1.1 code-review follow-ups by hardening logout/session verification behavior and adding regression coverage for secure session, protected-route, and access-control paths.
- 2026-05-30: Closed the remaining review findings by making allowed-email-domain checks fail closed and shielding the public home route from invalid-session cookie crashes.
- 2026-05-30: Closed the final Story 1.1 review finding by requiring a real `SessionVerificationError` instance on the public home route and keeping that import compatible with both test and build environments.

---
stepsCompleted: [1, 2, 3, 4]
status: complete
inputDocuments:
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\planning-artifacts\prds\prd-engniter-mvp-2026-05-30\prd.md
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\planning-artifacts\architecture.md
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\DESIGN.md
  - C:\Users\eonio\Documents\Workspace\engniter-mvp\_bmad-output\planning-artifacts\ux-designs\ux-engniter-mvp-2026-05-30\EXPERIENCE.md
---

# Engniter Studio - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Engniter Studio, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create and edit an Opportunity with required title and technical owner, plus optional client metadata and internal fit criteria, without losing existing context data.

FR2: Users can build a Context Package for an Opportunity using file uploads, pasted text, and structured notes, with each item recording source type, uploader, and timestamp.

FR3: Users can view the full Context Package history in time order and distinguish original inputs from later additions across analysis runs.

FR4: Users can trigger AI analysis of the Context Package and receive a draft Scope Brief containing goals, functional requirements, non-functional requirements, integrations, constraints, risks, assumptions, exclusions, and open questions when supported by evidence, while the system detects sparse-input cases.

FR5: Users can inspect Source References for extracted items and the system marks inferred items that lack direct evidence so they can be reviewed explicitly.

FR6: Users can complete Validation Review by accepting, editing, rejecting, or flagging generated items, with every item requiring review before completion and rejected items excluded from derived artifacts unless restored later.

FR7: The system computes Scope Confidence and no-promise warning states, highlights fit-criteria mismatches, and blocks Proposal Draft and SOW Draft generation until blocking issues are resolved or explicitly overridden by an authorized editor.

FR8: Users can generate a Clarification Packet with prioritized unanswered questions grouped by impact area and ranked Critical, High, Medium, or Low.

FR9: Users can trace each clarification question back to its originating Scope Brief gap, unresolved risk, or missing evidence, and clarification status updates when the underlying issue is resolved.

FR10: Users can generate an editable Mini PRD from the approved Scope Brief that includes context, jobs to be done, functional requirements, non-functional requirements, assumptions, exclusions, dependencies, and an acceptance-criteria section even when some details remain pending.

FR11: Users can generate an editable SOW Draft from the approved Scope Brief that includes scope summary, workstreams or phases, responsibilities, assumptions, exclusions, and dependency notes.

FR12: Users can generate an editable Proposal Draft from the approved Scope Brief that includes scope, deliverables, assumptions, exclusions, timeline framing, and next steps while preserving unresolved assumptions and exclusions visibly.

FR13: Users can regenerate Mini PRD, SOW Draft, and Proposal Draft outputs after Scope Brief updates, with stale-state visibility and distinct timestamps or version markers to prevent silent drift.

FR14: Users can export Mini PRD, SOW Draft, Proposal Draft, and Clarification Packet artifacts in PDF and DOCX while preserving headings, assumptions, and exclusions.

FR15: Users can share an internal reviewable version of the Opportunity so reviewers can inspect the approved Scope Brief, artifact outputs, and Source References without editing the original Context Package unless they have edit permission.

FR16: Users can identify the current approved artifact output and at least one prior generated version for each artifact type.

### NonFunctional Requirements

NFR1: Context Package files and derived artifacts must be access-controlled at the Opportunity level and visible only to authenticated users with appropriate Opportunity access.

NFR2: Validation Review state changes and derived artifact generations must be timestamped, attributable to a user, and retained in an audit history for at least 90 days in pilot environments.

NFR3: Approved Scope Brief content and artifact history must survive analysis or generation failures, with retry or refresh preserving the last approved state.

NFR4: The Validation Review experience must clearly distinguish evidence-backed, inferred, and unresolved items and allow opening Source References directly from the item being reviewed.

NFR5: For pilot-sized Opportunities of up to 25 Context Package items, 95% of Scope Brief generations should complete within 10 minutes and 95% of artifact generations within 2 minutes.

NFR6: Workspace administrators must be able to delete an Opportunity and its derived artifacts on request, and the product must expose the active retention policy to pilot customers.

### Additional Requirements

- Initialize the implementation from the Firebase App Hosting Next.js basic starter using the documented `giget` bootstrap command.
- Use a Next.js App Router + TypeScript web application baseline aligned to Firebase App Hosting support expectations rather than assuming the newest Next.js major by default.
- Structure the solution as a single repository with the Next.js app at the root and a separate `functions/` workspace for asynchronous and event-driven Firebase logic.
- Use Cloud Firestore as the system of record for Opportunities, workflow state, Validation Review data, jobs, audit events, and artifact metadata.
- Use Cloud Storage for uploaded source documents and generated export binaries, keeping file assets separate from Firestore documents.
- Validate Server Action inputs, Route Handler payloads, persistence contracts, and job payloads with Zod at application boundaries.
- Implement Firebase Authentication with Google sign-in only for the MVP and enforce role-based authorization in trusted server-side paths plus Firestore and Storage rules.
- Use Next.js Server Actions and Route Handlers for synchronous application flows, and Cloud Functions for long-running extraction, regeneration, export, cleanup, and event-driven processing.
- Persist background job records with explicit statuses such as `queued`, `running`, `succeeded`, and `failed`, and model async workflow events with explicit versioned payloads.
- Standardize Route Handler responses to `{ data, meta? }` for success and `{ error: { code, message, details? } }` for errors.
- Organize implementation feature-first under `src/app`, `src/features`, `src/lib`, and `src/server`, keeping privileged server-only code out of client imports.
- Maintain separate dev, staging, and production Firebase environments with GitHub-connected App Hosting rollouts as the default deployment path.
- Treat audit logging as a first-class requirement for approval actions, no-promise overrides, export generation, and deletion events.
- Co-locate unit tests with features and functions, and keep end-to-end coverage in `tests/e2e` with shared fixtures and emulator setup.

### UX Design Requirements

UX-DR1: Implement a desktop-first responsive application layout that supports a three-zone workspace on large screens and collapses navigation or evidence rails into drawers at smaller breakpoints.

UX-DR2: Provide a stable app shell navigation that preserves orientation across Opportunities, artifacts, exports, and settings without hiding workflow-critical warnings inside collapsed navigation.

UX-DR3: Build an Opportunity list surface with visible status, owner, and deadline metadata plus explicit cold-open, empty, and unavailable states.

UX-DR4: Build an Opportunity overview that loads header metadata and workflow summary independently and surfaces fit-mismatch warnings with direct links back to the relevant scope area.

UX-DR5: Implement a Context Package surface that supports upload, paste, and structured notes, shows upload progress and failure inline, and preserves a visible distinction between original and later-added items.

UX-DR6: Implement Validation Review as reviewable scope section cards that show review state, source availability, and clarification links for each extracted item.

UX-DR7: Provide a persistent or sticky review action bar for accept, edit, reject, and flag actions so reviewers do not need to scroll back to the top to continue review.

UX-DR8: Implement a Source Reference drawer that opens near the current task, supports side-by-side evidence inspection on larger screens, and returns focus to the originating control when closed.

UX-DR9: Display Scope Confidence as an explicit Low, Medium, or High state with visible text and accessible semantics rather than color-only signaling.

UX-DR10: Show warning banners for sparse input, no-promise blockers, unresolved critical gaps, and fit mismatches, with messaging that explains cause and routes users to the blocking surface.

UX-DR11: Build a Clarification Packet surface with priority, category, cause, and status per item, with Critical and High items surfaced first and an explicit “no blockers remain” empty state.

UX-DR12: Build an Artifact studio with tabs for Scope Brief, Clarification Packet, Mini PRD, SOW Draft, and Proposal Draft, including stale markers and prior-version comparison or diff support.

UX-DR13: Build an Export and share panel that shows export formats, latest generation timestamp, reviewer visibility, blocked reasons, and retry behavior that preserves current selections after failure.

UX-DR14: Support a permission-limited reviewer mode where reviewers can inspect artifacts and evidence but edit controls are removed rather than decoratively disabled.

UX-DR15: Ensure keyboard-only users can complete the main workflow, including navigation between review items, opening the Source Reference drawer, and triggering review actions.

UX-DR16: Meet WCAG 2.2 AA expectations for contrast, focus visibility, assistive announcements, heading structure, and non-color-only status communication.

UX-DR17: Implement the trust-first microcopy posture: short, explicit, risk-aware language with no hype, faux certainty, or cheerful AI-writing tone.

UX-DR18: Implement the design-token system defined in DESIGN.md, including the documented color roles, typography scale, spacing scale, radii, and semantic component tokens.

UX-DR19: Implement the reusable component set called out by UX: app shell nav, primary button, opportunity row, context item, scope section card, confidence pill, warning banner, evidence chip, source link, Source Reference drawer, clarification row, review action bar, artifact tab, and export panel.

UX-DR20: Enforce the interaction bans and constraints from the UX spec, including no hover-only status disclosure, no hidden stale state, no automatic artifact overwrite, no infinite scroll in dense review surfaces, and no nested modal stacks deeper than one layer.

### FR Coverage Map

FR1: Epic 1 - Opportunity creation and editing
FR2: Epic 1 - Context Package ingestion
FR3: Epic 1 - Context history and chronology
FR4: Epic 2 - Draft Scope Brief generation
FR5: Epic 2 - Source References and inferred-item visibility
FR6: Epic 2 - Validation Review workflow
FR7: Epic 2 - Scope Confidence, fit mismatch, and no-promise gating
FR8: Epic 2 - Clarification Packet generation
FR9: Epic 2 - Clarification traceability and status updates
FR10: Epic 3 - Mini PRD generation
FR11: Epic 3 - SOW Draft generation
FR12: Epic 3 - Proposal Draft generation
FR13: Epic 3 - Artifact synchronization and stale-state handling
FR14: Epic 3 - Artifact export
FR15: Epic 3 - Internal review sharing
FR16: Epic 3 - Artifact version history

## Epic List

### Epic 1: Secure Opportunity Intake Workspace
Users can securely create an Opportunity, capture client context, and maintain a trustworthy intake workspace that preserves source history for later analysis.
**FRs covered:** FR1, FR2, FR3

### Epic 2: Validated Scope Review and Risk Control
Users can transform raw context into a reviewable Scope Brief, inspect evidence, complete Validation Review, understand confidence and no-promise risk, and generate a Clarification Packet that drives discovery forward.
**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9

### Epic 3: Artifact Handoff, Review, and Export
Users can derive delivery and commercial artifacts from the approved Scope Brief, keep them synchronized, share them internally, inspect prior versions, and export them safely.
**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR16

## Epic 1: Secure Opportunity Intake Workspace

Users can securely create an Opportunity, capture client context, and maintain a trustworthy intake workspace that preserves source history for later analysis.

### Story 1.1: Set up initial project from starter template

**FR Coverage:** Supports FR1, FR2, FR3

As a product team,
I want the project initialized from the approved Firebase App Hosting starter template,
So that MVP development begins on the validated technical foundation required for the Opportunity workspace.

**Acceptance Criteria:**

**Given** the approved architecture specifies the Firebase App Hosting Next.js TypeScript starter
**When** the project is initialized
**Then** the codebase is created from that starter template with dependencies installed
**And** the baseline configuration files required by the starter are present in the repository.

**Given** the starter-based project has been created
**When** the foundation for MVP development is wired in
**Then** Firebase Authentication, environment configuration, and protected route scaffolding are added
**And** the baseline app shell and global styling are ready for Epic 1 feature work.

**Given** a user is not authenticated
**When** they open a protected Opportunity route in the initialized app
**Then** they are routed to a sign-in experience that offers Google sign-in for the MVP
**And** protected routes remain inaccessible until authentication succeeds.

**Given** a signed-in user lacks the required role or access context
**When** they attempt to access a protected area
**Then** trusted server-side checks and Firebase rules deny access
**And** the UI shows an explicit unauthorized state rather than a silent failure.

### Story 1.2: Create and edit Opportunity metadata

**FR Coverage:** FR1

As a technical pre-sales operator,
I want to create and update an Opportunity with its key metadata,
So that I can establish the scoped work object before adding client context and analysis inputs.

**Acceptance Criteria:**

**Given** an authenticated user with edit permission
**When** they create a new Opportunity
**Then** the system requires a title and technical owner before saving
**And** it stores optional fields such as client name, project type, estimated value, proposal deadline, and internal fit criteria when provided.

**Given** an existing Opportunity
**When** an authorized user edits its metadata
**Then** the system saves the changes without deleting existing Context Package items or workflow history
**And** the updated overview reflects the latest metadata.

**Given** an Opportunity contains internal fit criteria
**When** the user views or edits the Opportunity overview
**Then** those criteria are visible in the workspace
**And** they remain available for later fit-mismatch checks in the validation workflow.

**Given** the Opportunity list or overview is loading, empty, or unavailable
**When** the UI renders those states
**Then** the user sees explicit skeleton, empty, or recovery treatments consistent with the UX specification
**And** the user is not left on a blank screen.

### Story 1.3: Add Context Package items with source metadata

**FR Coverage:** FR2

As a technical pre-sales operator,
I want to add files, pasted text, and structured notes to an Opportunity,
So that the system has a traceable body of source material for later scope analysis.

**Acceptance Criteria:**

**Given** an authenticated user with edit permission on an Opportunity
**When** they add a Context Package item by file upload, pasted text, or structured note entry
**Then** the item is attached to the Opportunity
**And** the system records its source type, uploader, and creation timestamp.

**Given** a file upload is in progress
**When** the Context Package view updates
**Then** the in-progress item remains visible in the ordered list with progress feedback
**And** the list does not jump unexpectedly.

**Given** a Context Package upload fails
**When** the failure is returned to the UI
**Then** the failed item remains visible in place with retry and remove actions
**And** the rest of the Context Package remains intact.

**Given** source files and structured entries are stored for an Opportunity
**When** persistence is implemented
**Then** structured metadata is stored in Firestore and file assets in Cloud Storage
**And** boundary validation is applied before the write completes.

### Story 1.4: Review Opportunity workspace and Context Package history

**FR Coverage:** FR3

As a technical pre-sales operator,
I want to review an Opportunity overview and its full Context Package history,
So that I can understand what was provided originally, what was added later, and whether the workspace is ready for analysis.

**Acceptance Criteria:**

**Given** an Opportunity contains multiple Context Package items over time
**When** the user opens the Opportunity workspace
**Then** the Context Package is shown as a time-ordered history
**And** original items are distinguishable from later additions without losing chronology.

**Given** the user selects a Context Package item
**When** the detail view opens
**Then** they can inspect the source content in a side pane or drawer
**And** raw source material is not edited inline.

**Given** the Opportunity overview is rendered on large or medium screens
**When** layout behavior is applied
**Then** the workspace follows the UX layout model with stable navigation and contextual detail or evidence regions
**And** the interaction remains usable when rails collapse on narrower screens.

**Given** an Opportunity or its history becomes unavailable because of deletion or access changes
**When** the user attempts to open it
**Then** the UI shows a clear unavailable state with recovery navigation
**And** no silent failure or blank screen occurs.

## Epic 2: Validated Scope Review and Risk Control

Users can transform raw context into a reviewable Scope Brief, inspect evidence, complete Validation Review, understand confidence and no-promise risk, and generate a Clarification Packet that drives discovery forward.

### Story 2.1: Generate a draft Scope Brief from the Context Package

**FR Coverage:** FR4

As a technical pre-sales operator,
I want to run analysis on an Opportunity's Context Package,
So that I receive a draft Scope Brief I can review instead of starting scope definition from scratch.

**Acceptance Criteria:**

**Given** an Opportunity contains Context Package items
**When** an authorized user starts scope analysis
**Then** the system creates an analysis job and processes it asynchronously
**And** the user can see a durable status such as queued, running, succeeded, or failed.

**Given** analysis succeeds
**When** the draft Scope Brief is produced
**Then** it includes goals, functional requirements, non-functional requirements, integrations, constraints, risks, assumptions, exclusions, and open questions when evidence supports them
**And** the result is stored as the current draft Scope Brief for the Opportunity.

**Given** the Context Package is too sparse for trustworthy extraction
**When** analysis completes
**Then** the system returns a low-confidence sparse-input result instead of pretending the output is complete
**And** the UI routes the user back toward improving the Context Package.

**Given** a previous approved Scope Brief exists
**When** a later analysis attempt fails
**Then** the last approved Scope Brief remains preserved
**And** the failure is surfaced explicitly without wiping trusted state.

### Story 2.2: Inspect Source References and inferred items

**FR Coverage:** FR5

As a technical pre-sales operator,
I want to inspect the evidence behind extracted scope items,
So that I can judge whether each generated requirement, assumption, or risk is actually supportable.

**Acceptance Criteria:**

**Given** a generated Scope Brief item has supporting evidence
**When** the user opens its Source Reference
**Then** the system shows the supporting source material in a drawer or side-by-side evidence view
**And** the user remains anchored to the current review context.

**Given** a generated item lacks direct evidence
**When** it is shown in the review UI
**Then** the item is explicitly marked as inferred
**And** the lower-trust state is visible without relying on color alone.

**Given** the Source Reference drawer is opened from a review item
**When** the user closes it
**Then** focus returns to the control that opened it
**And** keyboard-only review remains uninterrupted.

**Given** a source reference is unavailable because of deletion or changed access
**When** the user tries to inspect it
**Then** the system explains why the evidence is unavailable
**And** the originating review context remains intact.

### Story 2.3: Review and resolve extracted scope items

**FR Coverage:** FR6

As a technical pre-sales operator,
I want to accept, edit, reject, or flag extracted scope items,
So that the Scope Brief becomes a trusted internal artifact instead of raw generated output.

**Acceptance Criteria:**

**Given** a draft Scope Brief contains generated items
**When** the user reviews them
**Then** each item can be accepted, edited, rejected, or flagged
**And** the chosen decision is persisted with audit context.

**Given** the user is actively reviewing items
**When** the Validation Review UI is rendered
**Then** the current item remains anchored in view with progress shown against the total review set
**And** review actions remain reachable through a persistent action bar.

**Given** one or more generated items remain unreviewed
**When** the user attempts to complete Validation Review
**Then** the system blocks completion
**And** it identifies that review is still incomplete.

**Given** an item has been rejected
**When** downstream artifacts are later generated
**Then** the rejected item is excluded by default
**And** it only re-enters the trusted scope if the user explicitly restores it later.

### Story 2.4: Compute confidence, fit mismatch, and no-promise gating

**FR Coverage:** FR7

As a technical pre-sales operator,
I want the product to surface confidence and commitment risk clearly,
So that I can see when scope is safe to advance and when further review or clarification is still required.

**Acceptance Criteria:**

**Given** a current Scope Brief and Validation Review state
**When** the system evaluates the Opportunity
**Then** it computes a visible Scope Confidence state of Low, Medium, or High
**And** the displayed state follows the PRD rules for sparse input, unresolved critical issues, and completed review.

**Given** unresolved critical gaps, risks, or clarification items exist
**When** the Opportunity overview or Artifact surfaces are shown
**Then** the UI displays an explicit no-promise warning state
**And** the warning explains what is still blocking external commitment.

**Given** internal fit criteria were captured on the Opportunity
**When** the current Scope Brief conflicts with those criteria
**Then** the system surfaces a fit-mismatch warning
**And** it points the operator to the relevant conflicting area.

**Given** Proposal Draft or SOW Draft generation is requested while no-promise blockers remain
**When** the user initiates the action
**Then** generation is blocked by default
**And** only an authorized override path can bypass the block with audit logging.

### Story 2.5: Generate and manage the Clarification Packet

**FR Coverage:** FR8, FR9

As a technical pre-sales operator,
I want unresolved scope gaps converted into a prioritized Clarification Packet,
So that the team can advance discovery before making external commitments.

**Acceptance Criteria:**

**Given** a current Scope Brief contains unresolved gaps, risks, or missing evidence
**When** the user generates the Clarification Packet
**Then** the system creates clarification questions linked to the triggering scope issue
**And** each question includes category, priority, cause, and status.

**Given** clarification questions are displayed
**When** the Clarification Packet UI loads
**Then** Critical and High questions are surfaced first
**And** the user can see why each question matters to scope safety or delivery feasibility.

**Given** a clarification issue is resolved through Scope Brief review
**When** the linked scope item is updated
**Then** the Clarification Packet status updates accordingly
**And** resolved questions no longer appear as unresolved blockers.

**Given** no unresolved clarification blockers remain
**When** the user opens the Clarification Packet
**Then** the surface shows an explicit cleared state rather than a blank list
**And** the UI communicates that discovery blockers are no longer preventing progress.

## Epic 3: Artifact Handoff, Review, and Export

Users can derive delivery and commercial artifacts from the approved Scope Brief, keep them synchronized, share them internally, inspect prior versions, and export them safely.

### Story 3.1: Generate an editable Mini PRD from the approved Scope Brief

**FR Coverage:** FR10

As a technical pre-sales operator,
I want to generate a Mini PRD from an approved Scope Brief,
So that product and delivery stakeholders can review a structured internal requirements artifact quickly.

**Acceptance Criteria:**

**Given** an Opportunity has an approved or review-complete Scope Brief
**When** the user generates a Mini PRD
**Then** the system creates a new Mini PRD artifact version derived from the current trusted Scope Brief
**And** the artifact is available in the Artifact studio for editing and review.

**Given** a Mini PRD is generated
**When** its content is assembled
**Then** it includes context, jobs to be done, functional requirements, non-functional requirements, assumptions, exclusions, dependencies, and an acceptance-criteria section
**And** any still-pending detail is marked explicitly instead of omitted silently.

**Given** Mini PRD generation fails
**When** the failure is recorded
**Then** the prior approved artifact state remains intact
**And** the failure is shown explicitly with a retry path.

**Given** the generated Mini PRD is opened in the Artifact studio
**When** the user views it
**Then** the UI reflects artifact status, generation timestamp, and editable content state
**And** it does not disguise draft content as final approval.

### Story 3.2: Generate an editable SOW Draft from the approved Scope Brief

**FR Coverage:** FR11

As a technical pre-sales operator,
I want to generate a SOW Draft from an approved Scope Brief,
So that the team can review a formal scope framing artifact before customer-facing commitment.

**Acceptance Criteria:**

**Given** an Opportunity has a review-complete Scope Brief and no active no-promise block for SOW generation
**When** the user generates a SOW Draft
**Then** the system creates a new SOW Draft artifact version from the current trusted Scope Brief
**And** the draft is available in the Artifact studio for review and editing.

**Given** a SOW Draft is generated
**When** its content is assembled
**Then** it includes a scope summary, workstreams or phases, responsibilities, assumptions, exclusions, and dependency notes
**And** unresolved assumptions or exclusions remain visible rather than being smoothed over.

**Given** a no-promise blocker remains unresolved
**When** SOW generation is requested
**Then** the system blocks the action by default
**And** only an authorized override path can proceed with audit logging.

**Given** a prior SOW Draft version already exists
**When** a new version is generated
**Then** the system preserves the previous version in history
**And** the current artifact view distinguishes the newest draft from prior outputs.

### Story 3.3: Generate an editable Proposal Draft from the approved Scope Brief

**FR Coverage:** FR12

As a technical pre-sales operator,
I want to generate a Proposal Draft from an approved Scope Brief,
So that the team can prepare a commercial-facing draft without retyping trusted scope decisions.

**Acceptance Criteria:**

**Given** an Opportunity has a review-complete Scope Brief and no active no-promise block for proposal generation
**When** the user generates a Proposal Draft
**Then** the system creates a new Proposal Draft artifact version from the current trusted Scope Brief
**And** the draft is available in the Artifact studio for review and editing.

**Given** a Proposal Draft is generated
**When** its content is assembled
**Then** it includes scope, deliverables, assumptions, exclusions, timeline framing, and next steps
**And** unresolved assumptions and exclusions remain visible rather than being hidden in polished copy.

**Given** a no-promise blocker remains unresolved
**When** Proposal Draft generation is requested
**Then** the system blocks the action by default
**And** only an authorized override path can proceed with audit logging.

**Given** a prior Proposal Draft version already exists
**When** a new version is generated
**Then** the system preserves the earlier version in history
**And** the current artifact view clearly identifies the newest draft.

### Story 3.4: Manage artifact synchronization, stale state, and version history

**FR Coverage:** FR13, FR16

As a technical pre-sales operator,
I want artifact outputs to stay visibly synchronized with the Scope Brief,
So that I know which drafts are current, which are stale, and what changed over time.

**Acceptance Criteria:**

**Given** a Scope Brief changes after one or more artifacts were previously generated
**When** the user opens the Artifact studio
**Then** artifacts derived from older scope state are marked as stale
**And** the stale state is visible without relying on hover or color alone.

**Given** multiple versions of an artifact type exist
**When** the user views the artifact history
**Then** the system shows the current approved or latest version plus at least one prior generated version
**And** the user can distinguish timestamps or version labels clearly.

**Given** the user regenerates an artifact from a newer Scope Brief state
**When** the new version is created
**Then** the prior version is retained in history
**And** the new version becomes the current draft without overwriting history silently.

**Given** the Artifact studio UI is rendered
**When** tabs and version state are shown
**Then** the interface presents artifact type, status, staleness, and last-generated metadata clearly
**And** it does not imply that stale artifacts are safe to use unchanged.

### Story 3.5: Share a permission-limited internal review workspace

**FR Coverage:** FR15

As a technical pre-sales operator,
I want to share an Opportunity internally for review,
So that reviewers can inspect trusted scope outputs and evidence without editing the working source material.

**Acceptance Criteria:**

**Given** an Opportunity is ready for internal review
**When** an authorized user shares it with a reviewer
**Then** the reviewer can access the approved Scope Brief, generated artifacts, and Source References
**And** access is limited by authenticated role and Opportunity permissions.

**Given** a reviewer opens the shared workspace without edit permission
**When** the UI renders
**Then** editing controls for Context Package and artifact authoring are removed rather than decoratively disabled
**And** the reviewer can still inspect evidence and read artifact content.

**Given** reviewer access is revoked or changed
**When** the reviewer attempts to revisit the Opportunity
**Then** the system denies access explicitly
**And** previously shared confidential material is no longer available to that reviewer.

**Given** a share or permission change occurs
**When** the action completes
**Then** the event is recorded in audit history
**And** the access state remains consistent across app routes and protected resources.

### Story 3.6: Export approved artifacts to PDF and DOCX

**FR Coverage:** FR14

As a technical pre-sales operator,
I want to export approved artifacts to standard document formats,
So that internal teams can hand off or reuse them outside the application without losing important structure.

**Acceptance Criteria:**

**Given** an exportable Mini PRD, SOW Draft, Proposal Draft, or Clarification Packet is available in the Artifact studio
**When** an authorized user requests export in PDF or DOCX
**Then** the system creates an export job and processes it asynchronously
**And** the user can see durable export status including queued, running, failed, or completed.

**Given** export generation succeeds
**When** the file is produced
**Then** headings, assumptions, exclusions, and major document structure are preserved in the output
**And** the exported file is stored and linked back to the originating artifact version.

**Given** export generation fails
**When** the user returns to the export surface
**Then** the failure reason is visible with a retry path
**And** the user's current export selections are preserved where practical.

**Given** an artifact is blocked from use because it is stale or no-promise-gated
**When** export is requested
**Then** the system prevents export when policy requires blocking
**And** the UI explains what must be resolved first.

---
name: Engniter Studio
description: UX experience specification for an AI workspace that turns technical pre-sales context into validated scope.
status: final
created: 2026-05-30
updated: 2026-05-30
sources:
  - ..\..\prds\prd-engniter-mvp-2026-05-30\prd.md
  - ..\..\prds\prd-engniter-mvp-2026-05-30\addendum.md
---

# Engniter Studio — Experience Spine

## Foundation

Desktop-first responsive web application. [ASSUMPTION] Engniter Studio is primarily used on laptop and desktop during technical pre-sales review sessions; tablet support is secondary and phone support is limited to lightweight read / share actions. No UI system is named in the source inputs, so this spine stays framework-agnostic and uses `DESIGN.md` as the visual identity reference.

Engniter Studio is a technical pre-sales workspace for turning messy client inputs into delivery-ready scope. It should not drift into generic product management, CRM, or broad RFP-automation interaction patterns in the MVP. The primary operator is the Solutions Architect / Sales Engineer / technical pre-sales lead; Account Executive and delivery reviewers are secondary actors with narrower goals.

The product is internal-first. Its interaction model optimizes for traceability, approval, and careful commitment rather than customer-facing presentation. Evidence, review state, stale / current artifact state, and avoided-risk cues must remain visible throughout the core workflow.

### Canonical naming

| Source term | Spine term |
|---|---|
| Opportunity | Opportunity |
| Context Package | Context Package |
| Scope Brief | Scope Brief |
| Source Reference | Source Reference |
| Clarification Packet | Clarification Packet |
| Mini PRD | Mini PRD |
| SOW Draft | SOW Draft |
| Proposal Draft | Proposal Draft |
| Artifact tab | Artifact tab |

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Opportunity list | App open / App shell nav | Find active and recent Opportunities, their status, owner, and review state |
| Opportunity overview | Opportunity row | See client metadata, project type, estimated value, deadline, owner, fit criteria, workflow stage, and run history access |
| Context Package | Opportunity overview tabs | Add and inspect uploaded files, pasted notes, transcripts, structured context entries, and their time-ordered history |
| Validation Review | Run analysis / overview tab | Review extracted requirements, assumptions, risks, exclusions, and open questions inside the Scope Brief |
| Source Reference drawer | Scope Brief review / Clarification Packet / artifact views | Inspect evidence behind extracted items |
| Clarification Packet | Scope Brief review / artifact tabs | Turn unresolved issues into prioritized follow-up questions |
| Artifact studio | Scope Brief review / Artifact tabs | Read, edit, and compare Scope Brief, Mini PRD, SOW Draft, and Proposal Draft, including prior generated versions |
| Export and share | Artifact studio | Export approved outputs and provide internal review access |
| Settings and policy | User menu | Retention, deletion, access, audit-history visibility, and workspace-level preferences |

On large screens, Engniter Studio uses persistent navigation and optional side rails. On smaller screens, the evidence rail collapses into a drawer and the navigation compresses into a top-triggered panel. Modal stacks stop at one layer deep.

→ Composition reference: `mockups/opportunity-overview.html` illustrates the Opportunity overview, Context Package summary, and fit-criteria / workflow chrome; `mockups/scope-brief-review.html` illustrates Scope Brief review density, warning hierarchy, and Source Reference drawer behavior; `mockups/artifact-studio.html` illustrates Artifact tabs, stale-state framing, and Export and share structure. Spine wins on conflict.

## Voice and Tone

Microcopy only. Brand posture and visual identity live in `DESIGN.md`.

| Do | Don't |
|---|---|
| "3 critical gaps still need review." | "Your AI scope is almost ready!" |
| "Source available." | "AI found this for you." |
| "Proposal Draft is stale." | "Proposal updated automatically." |
| "Approve Scope Brief" | "Looks good to me" |
| Short, explicit, risk-aware language | Cheerleading, hype, or faux certainty |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| App shell nav | Global layout | Provides stable orientation across Opportunity list, current Opportunity, exports, and settings. It never contains workflow-critical warnings that would be lost when collapsed. |
| Primary button | Cross-surface forward motion | There is only one primary action per surface. The action label names the next workflow step directly, e.g. "Run analysis", "Approve Scope Brief", or "Regenerate". |
| Opportunity row | Opportunity list | Row click opens Opportunity overview. Secondary metadata includes owner, deadline, and current stage. Status never relies on color alone. |
| Context item | Context Package | Shows source type, uploader, timestamp, and a compact preview. Selecting an item reveals full content in a side pane or drawer; raw content is never edited inline. Original vs later-added items remain distinguishable in the history list. |
| Scope section card | Validation Review | Groups one requirement, assumption, risk, or exclusion set. Each item shows review status, source availability, and related clarification links. |
| Review action bar | Validation Review | Anchors accept, edit, reject, and flag actions for the current item or selection. Uses {components.review-action-bar}. Must remain reachable without scrolling back to the top. |
| Confidence pill | Overview header, Validation Review | Shows Low / Medium / High state with plain-language label and accessible text. Uses {components.confidence-pill}. |
| Warning banner | Overview header, Validation Review, Artifact studio | Appears when no-promise gating or critical unresolved issues block forward motion. Uses {components.warning-banner}. |
| Evidence chip | Validation Review, Artifact studio | Gives a compact source-backed marker that can open or highlight supporting evidence without replacing explicit status text. Uses {components.evidence-chip}. |
| Source link | Validation Review, Clarification Packet, Artifact studio | Opens the Source Reference drawer and returns focus to the originating link on close. Uses {components.source-link}. |
| Source Reference drawer | Validation Review, Clarification Packet, Artifact studio | Opens on demand from a Source link or Evidence chip. Keeps the current review context visible while showing supporting excerpts and source metadata. |
| Clarification row | Clarification Packet | Each row shows priority, category, triggering gap, and status. Editing the linked Scope Brief item updates the row status. Rows should foreground discovery acceleration and risk reduction, not just question packaging. |
| Artifact tab | Artifact studio | Switches between Scope Brief, Clarification Packet, Mini PRD, SOW Draft, and Proposal Draft. Uses {components.artifact-tab}. Tabs indicate stale state if the Scope Brief changed after generation. |
| Export panel | Export and share | Lists export formats, latest generated timestamp, and reviewer visibility. Export is unavailable while hard blockers remain. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold open | Opportunity list | Show recent Opportunities with skeleton metadata rows while data loads. |
| Empty workspace | Opportunity list | "No Opportunities yet." Single primary action routes to create Opportunity. |
| Opportunity list unavailable | Opportunity list | Show a recovery state with retry action and preserve filters or search context if present. |
| Overview loading | Opportunity overview | Header metadata and workflow summary load independently, with skeleton labels rather than a blank page. |
| Opportunity unavailable | Opportunity overview | If the Opportunity was deleted or permissions changed, show a clear unavailable state and route back to Opportunity list. |
| Fit mismatch detected | Opportunity overview | Warning banner names which internal fit criteria no longer match the current Scope Brief and points to the relevant section. |
| Run history open | Opportunity overview | A side sheet or inline panel shows recent analysis, approval, export, and generation events with actor, time, and outcome. |
| Empty Context Package | Context Package | Explains the accepted input methods: upload, copy / paste, and guided form fields. |
| Upload in progress | Context Package | In-progress item remains visible in the time-ordered list with progress feedback and no list jump. |
| Upload failed | Context Package | Failed item remains in place with retry and remove actions. |
| Historical item browsing | Context Package | Users can distinguish original from later-added Context Package entries without losing chronology. |
| Sparse Context Package | Validation Review entry | Warning banner explains that the Context Package is too thin for trustworthy extraction and routes back to Context Package. |
| Review in progress | Validation Review | Current item is anchored in view, previous decisions remain visible, and completion progress is shown as reviewed items out of total generated items. |
| Analysis failed, approved state preserved | Validation Review | If analysis fails after a previously approved Scope Brief existed, the latest approved state remains visible with retry messaging. |
| Low confidence / no-promise | Overview header, Artifact studio | Warning banner plus blocked generate / export controls. The UI names what still blocks progress. |
| Clarification Packet loading | Clarification Packet | Critical and High rows load first; lower-priority rows can stream in after. |
| Clarification Packet empty | Clarification Packet | If no unresolved issues remain, the surface explicitly states that discovery blockers are cleared rather than rendering as blank. |
| Clarification Packet blocked by sparse input | Clarification Packet | The surface routes back to missing Context Package evidence when prioritization cannot be trusted. |
| Artifact studio loading | Artifact studio | Tab chrome and latest-generated metadata appear before the document body so the user understands which artifact is loading. |
| Artifact studio unavailable | Artifact studio | If generation history or permissions are unavailable, show a recoverable error state instead of a blank document pane. |
| Stale artifact | Artifact studio | Artifact tab carries a stale marker and timestamp. Regenerate action is visible and does not overwrite current edits silently. |
| Prior version compare | Artifact studio | Users can inspect at least one prior generated version side-by-side or via a diff summary before replacing the current artifact. |
| Export blocked | Export and share | Export panel states which unresolved blockers prevent export and routes back to the blocking surface. |
| Export ready | Export and share | Export formats, latest generated timestamp, and reviewer visibility are visible before action. |
| Export failed or interrupted | Export and share | The panel preserves the selected artifact and format, explains the failure plainly, and offers retry without losing the current review context. |
| Permission-limited reviewer | Artifact studio, Source reference drawer | Reviewer can inspect content and evidence but edit controls are removed, not disabled decoratively. |
| Export complete | Export panel | Confirmation state names artifact, format, and timestamp. No celebratory animation. |
| Drawer loading | Source Reference drawer | Drawer reveals metadata shell first, then supporting excerpts. |
| Drawer unavailable | Source Reference drawer | If evidence was deleted or permissions changed, the drawer explains why the reference is unavailable and preserves the originating context. |
| Missing source reference | Scope section card | Item remains reviewable but is explicitly labeled as inferred so the operator understands trust is lower. |
| Settings policy loading | Settings and policy | Retention, deletion, and access settings skeletonize by section rather than blocking the full screen. |
| Delete Opportunity request | Settings and policy | A confirmation flow names artifact deletion scope and downstream consequences before action. |

## Interaction Primitives

- Click to open; double-click is never required.
- Keyboard navigation must support moving between review items, opening the Source reference drawer, and triggering accept / edit / reject / flag actions without pointer-only reliance. [ASSUMPTION] First-release shortcuts are minimal and disclosed in-product rather than adopting a dense power-user command layer.
- Evidence inspection should happen side-by-side when space allows; on smaller surfaces it becomes a drawer that returns the user to the same review position when closed.
- Inline edit is allowed for Scope Brief items and derived artifact content; raw Context Package evidence remains source-only.
- System confirmations are explicit only when a destructive or irreversible action occurs. Routine review actions should be low-friction.

**Banned:** hover-only status disclosure, hidden stale state, automatic artifact overwrite without notice, infinite scroll inside dense review surfaces, and nested modal stacks.

## Accessibility Floor

Behavioral. Visual contrast and token values live in `DESIGN.md`.

- WCAG 2.2 AA on the responsive web surface.
- Status is never communicated through color alone; every confidence state, warning, and review state includes visible text.
- Keyboard-only users can complete the main workflow: create Opportunity, add context, run analysis, review items, inspect source references, generate artifacts, and export.
- Focus order follows reading and review order. When the Source reference drawer closes, focus returns to the link that opened it.
- Warning banners, stale markers, and export confirmations are announced appropriately to assistive technology.
- Dense tables and cards must preserve readable heading structure and landmark regions.

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| `≥ 1280px` | Three-zone layout: navigation / list rail, main workspace, evidence rail |
| `1024–1279px` | Navigation remains visible; evidence rail becomes collapsible |
| `768–1023px` | Navigation compresses; evidence and details use drawers; artifact editing stays single-column |
| `< 768px` | Read-oriented support only; heavy review remains possible but not primary |

The canonical experience is desktop web. If mobile creation or deep mobile review becomes a product priority, this spine should split rather than stretch the desktop assumptions too far.

## Inspiration & Anti-patterns

- **Borrow:** Vivun’s seriousness around pre-sales as a first-class function.
- **Borrow:** Gong’s sense that evidence should stay close to the workflow rather than becoming an isolated report.
- **Reject:** Productboard-like roadmap and backlog patterns that would make Engniter Studio feel like a generic PM tool.
- **Reject:** Loopio / Responsive-style response-library sprawl and bulk-form workflows as the primary interaction model for MVP.

## Trust and Evidence Model

The UX must make it obvious what is source-backed, what is inferred, what is approved, and what is still unsafe to promise.

- Every reviewable item carries one of four visible states: source-backed, inferred, edited after generation, or unresolved.
- Source references open near the current task, not on a separate disconnected page.
- Confidence and no-promise gating should explain cause, not only state.
- Derived artifacts read as outputs from the Scope Brief, not independent documents with hidden drift.

## Artifact content floor

- **Mini PRD** surfaces context, jobs to be done, functional requirements, non-functional requirements, assumptions, exclusions, dependencies, and acceptance-criteria placeholders when detail is still pending.
- **SOW Draft** surfaces scope summary, workstreams or phases, responsibilities, assumptions, exclusions, and dependency notes.
- **Proposal Draft** surfaces deliverables, assumptions, exclusions, timeline framing, and next steps without hiding unresolved uncertainty.
- **Clarification Packet** surfaces priority, category, cause, and status for each question so it reads as a discovery tool rather than a loose list.

## Key Flows

### UJ-1. Marcos turns a messy Opportunity into a validated Scope Brief.

1. Marcos opens Engniter Studio and lands on the Opportunity list.
2. He opens a new Opportunity, confirms client name, deadline, technical owner, and optional internal fit criteria.
3. He moves to the Context Package, uploads the RFP, pastes discovery notes, and adds transcript excerpts.
4. He runs analysis.
5. Scope Brief review opens with a Medium confidence state, 18 generated items, and a warning that 3 critical gaps still block external commitment.
6. Marcos opens a source reference drawer on a high-risk integration requirement, edits the requirement wording, rejects one unsupported assumption, and flags two open questions for follow-up.
7. He opens the Clarification Packet to confirm the highest-priority questions.
8. **Climax:** after the last unresolved critical item is reviewed, the warning banner clears, Scope Confidence moves to High, and "Approve Scope Brief" becomes the singular primary action. Marcos now trusts the Opportunity enough for internal artifact generation.

Failure: the Context Package was too sparse for reliable extraction. Scope Brief review opens in Low confidence with a warning banner and a direct route back to Context Package instead of pretending the result is trustworthy.

### UJ-2. Ana prepares a client follow-up using the Clarification Packet and Proposal Draft.

1. Ana opens an Opportunity that already has an approved Scope Brief.
2. She enters Artifact studio and selects Clarification Packet.
3. She reviews the Critical and High questions, each tied to a specific scope gap or missing evidence.
4. She switches to Proposal Draft and sees a stale marker because Marcos updated the Scope Brief after the last generation run.
5. She regenerates the Proposal Draft, reviews the inherited assumptions and exclusions, and edits the client-facing framing without changing the underlying Scope Brief.
6. **Climax:** Ana exports a refreshed Proposal Draft and a Clarification Packet knowing the UI has preserved the product's no-promise discipline instead of hiding uncertainty behind polished wording.

Failure: a critical no-promise warning returns after a Scope Brief change. Generate and export remain blocked until the warning is resolved or explicitly overridden by an editor.

### UJ-3. Priya accepts the Mini PRD as a delivery handoff.

1. Priya receives internal review access to the Opportunity.
2. She opens Artifact studio and selects Mini PRD, then SOW Draft.
3. She inspects key assumptions, exclusions, dependencies, and acceptance-criteria sections.
4. She opens two Source reference drawers to verify that a security integration constraint and a timeline assumption are grounded in actual client material.
5. She leaves one follow-up note for the team outside the core artifact flow. [ASSUMPTION] Inline comments are not in v1; the note happens through an adjacent internal process.
6. **Climax:** Priya is able to accept the handoff because the product made evidence, uncertainty, and derived-artifact lineage visible without forcing her to reconstruct the deal from raw sales conversations.

Failure: Priya has reviewer-only access. She can inspect artifacts and evidence but cannot alter Scope Brief or generated artifacts, preventing accidental drift.

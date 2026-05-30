# Reconcile Brief — engniter-mvp.md vs UX spine

## What the UX spine preserved well
- Internal-first, desktop-first review workspace for technical pre-sales.
- Evidence-backed scope review, no-promise gating, confidence state, and artifact generation flow.
- Core surfaces for Opportunity, Context Package, Scope Brief, Clarification Packet, and derived artifacts.

## Dropped qualitative ideas / positioning cues
- **Category wedge got softer.** `engniter-mvp.md` frames Engniter as **Pre-Sales Management / Solution Engineering Automation** and an **AI Proposal-to-Delivery Workspace**, while the UX spine mainly says “AI workspace” for validated scope.
- **Competitive posture disappeared.** The source explicitly says **do not position as a Productboard competitor** and to avoid drifting into generic product management, CRM, backlog, or heavy RFP automation.
- **Value promise narrowed.** The source stresses **unstructured input → validated technical artifacts**, not “AI writing.” The UX docs capture review rigor, but lose the sharper “structuring and technical validation engine” framing.
- **Risk-reduction thesis weakened.** The source ties value to avoiding early promises, documenting assumptions, and reducing sales-to-delivery misalignment; the UX spine implies this, but does not state it as a headline product promise.
- **Target-company wedge is missing.** The source focuses on companies selling software, consulting, implementation, or complex digital projects.
- **Human positioning is thinner.** The source names the daily hero as **Solutions Architect / Sales Engineer / Technical Pre-Sales Lead**, with Account Executive, Product/Delivery Manager, and founder/CTO as secondary users.

## Dropped workflow expectations
- **Commercial-to-technical chain is less explicit.** The source describes `Client → AE/Sales → Solutions Architect → Engniter Studio → proposal/SOW/PRD → commercial/technical approval`.
- **Guided intake expectations were reduced.** The source expects MVP intake to start with **upload + copy/paste + guided form**, including internal criteria like stack, accepted project types, pricing bands, and constraints.
- **Analysis scope is narrower in the spine.** The source expects extraction of:
  - client goals
  - functional and non-functional requirements
  - integrations
  - technical constraints
  - risks and dependencies
  - open questions
  - **macro effort estimates**
  - confidence level
  - **what should not be promised yet**
- **Artifact intent is less differentiated.** The source assigns distinct jobs:
  - **Technical Scope Brief** for internal sales/engineering/delivery alignment, including **go / no-go recommendation**
  - **Mini PRD** for engineering/product, including personas, JTBD, acceptance criteria, and out-of-scope
  - **SOW / Proposal Draft** for the client, including phases, responsibilities, exclusions, timeline, next steps
- **Manual control expectation is underplayed.** The source explicitly treats **manual editing** as P0, not just a nice-to-have refinement step.
- **Checklist output was dropped.** The product workflow in the source includes a **discovery checklist** alongside PRD/SOW/proposal outputs.
- **Version history and template-library expectations are absent.** These appear as near-term operational workflow needs in the source.
- **Export/share future path is more specific in the source.** It references PDF, DOCX, internal links, and future Markdown/Notion/Jira handoff.

## Recommended reinforcements for the UX docs
1. Add a short positioning preamble to `EXPERIENCE.md` that names the wedge: **technical pre-sales workspace for turning messy client inputs into delivery-ready scope**.
2. Re-introduce the **primary user / secondary users** explicitly in the Foundation or Key Flows section.
3. Expand intake and analysis language to include **guided form input, internal constraints, and no-promise extraction rules**.
4. Make artifact jobs more explicit, especially **Scope Brief as internal alignment + go/no-go**.
5. Add one sentence that Engniter should **not drift into generic PM, CRM, or broad RFP workflow positioning** in the MVP.

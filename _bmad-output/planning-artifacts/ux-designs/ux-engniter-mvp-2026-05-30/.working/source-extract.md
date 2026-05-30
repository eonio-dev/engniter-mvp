# UX Source Extract — Engniter Studio

## Users and roles
- Primary operator: Solutions Architect / Sales Engineer / Technical Pre-Sales Lead.
- Secondary users: Account Executive / consultative seller; Delivery Lead / Product Manager / Engineering Lead; Founder / Head of Delivery / CTO in smaller firms.
- v1 is not for proposal-only ops, generic PM workflows, or sales users without technical review authority.

## Core journeys
- Main flow is narrow and linear: create Opportunity -> add Context Package -> run AI analysis -> perform Validation Review -> generate Clarification Packet / Mini PRD / SOW / Proposal -> export/share.
- Internal-first success state matters more than customer-facing polish.
- Delivery handoff is a first-class journey, not a side effect.

## IA / surfaces
- Core objects/surfaces: Opportunity Workspace, Context Package, Scope Brief, Validation Review, Source References, Scope Confidence, Clarification Packet, derived artifacts, export/share, simple version history.
- Scope Brief is the canonical source; downstream artifacts should read as derived views, not separate authoring spaces.

## Trust / review patterns
- Trust must be inspectable: every extracted item should show provenance when possible.
- Review is mandatory before outputs are treated as trusted; users must accept, edit, reject, or flag each item.
- No-promise warnings and confidence states are first-class gating signals, not decoration.
- Outdated derived artifacts should be visibly stale when the Scope Brief changes.

## Design constraints
- One dominant workflow; broad nav, deep integrations, advanced collaboration, portal/client co-editing, and heavy approval chains are intentionally deferred.
- Manual input methods are acceptable in v1.
- Sensitive client/commercial data requires explicit access control, retention, deletion, and audit visibility.

## Accessibility + content density
- Product will be information-dense and review-heavy; needs strong hierarchy, scanability, clear grouping, and progressive disclosure for evidence/detail.
- Status must not rely on color alone; dense review actions imply strong keyboard support, readable state labels, and durable focus management.

## Form factor / tone / visual posture
- Assumed primary form factor is desktop web for focused internal review work.
- Tone should feel precise, sober, risk-aware, and governance-oriented rather than flashy "AI writer" automation.
- Visual posture clues: evidence-linked, analytical, internal-tooling, confidence-and-warning led.

## Unresolved UX questions
- How to explain Scope Confidence without false precision.
- How much evidence detail to expose inline vs on demand.
- What template controls are needed in v1.
- How basic role separation should appear before full RBAC.
- How version diffs / proposal delta views should work later.

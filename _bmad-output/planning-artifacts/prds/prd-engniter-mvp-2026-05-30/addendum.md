# Addendum — Engniter Studio PRD

This addendum captures supporting detail that informs the PRD but does not belong in the main product requirements narrative.

## 1. Source Inputs Used

- `docs\engniter-mvp.md`
- `_bmad-output\brainstorming\brainstorming-session-2026-05-30-10-32-51.md`
- Lightweight web scan of adjacent vendors: Vivun, Loopio, Responsive, Productboard, Gong

## 2. Market Context Summary

### 2.1 Adjacent categories

- **Vivun:** Positions itself around pre-sales as a formal function inside revenue organizations and now markets an AI teammate for sellers. This reinforces that Engniter Studio can credibly live in technical pre-sales rather than generic product management.
- **Loopio / Responsive:** Position around RFP, RFI, questionnaire, and proposal-response management with content reuse, collaboration, and response speed. They are closer to proposal operations than to validated technical scoping.
- **Productboard:** Positions around product management, customer insights, prioritization, and roadmapping. This is adjacent but too downstream from the moment Engniter Studio wants to own.
- **Gong:** Captures and analyzes revenue interactions, surfacing intelligence and workflow automation. It helps upstream insight capture, but it does not convert those insights into validated delivery scope.

### 2.2 Strategic gap

The clearest gap in the current landscape is the space between raw commercial discovery and trustworthy technical commitment. Existing tools either:

- optimize response throughput,
- capture conversation intelligence, or
- organize product decisions.

They do not center the creation of a validated Scope Brief with Source References, explicit risks, and clarification-first workflow before proposal commitment.

### 2.3 Candidate differentiation language

- From messy client conversations to validated technical scope.
- Before you sell it, validate it.
- The AI workspace for turning pre-sales discovery into delivery-ready scope.

## 3. Concerns Scan

The product carries the following concerns strongly enough to shape requirements:

- **Trust and auditability:** users must understand why the system extracted a requirement or risk.
- **Promise control:** the system should reduce premature commitments, not accelerate them blindly.
- **Data confidentiality:** client material can include sensitive commercial and technical information.
- **Internal handoff quality:** downstream teams need fewer hidden assumptions and exclusions.
- **Scope discipline:** the MVP should master one flow before adding integrations or broader workflow coverage.

## 4. Deferred Depth

These topics matter but do not yet earn a full PRD section at this stage:

- Pricing and packaging model
- Formal ROI model by customer segment
- Deep template customization mechanics
- Long-term knowledge-base architecture
- Detailed permission model beyond basic role separation
- Version diff experience for proposal deltas
- Advanced deal-fit qualification rules beyond basic internal fit criteria
- Automated effort estimation by workstream or macro area

## 5. Notes for Downstream Documents

- A future UX spec should concentrate on Validation Review usability, Source Reference inspection, and confidence / no-promise signaling.
- A future architecture document should define how the Scope Brief schema maps to derived artifacts and how Source References are persisted.
- Future epics should likely mirror the main workflow: Opportunity / Context Package, Scope Analysis, Validation Review, Clarification Packet, Artifact Generation, Export / Sharing.

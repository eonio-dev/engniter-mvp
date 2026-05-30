---
name: Engniter Studio
description: UX design system for an AI workspace that turns technical pre-sales context into validated scope.
status: final
created: 2026-05-30
updated: 2026-05-30
sources:
  - ..\..\prds\prd-engniter-mvp-2026-05-30\prd.md
  - ..\..\prds\prd-engniter-mvp-2026-05-30\addendum.md
colors:
  surface-base: '#F7F8FA'
  surface-raised: '#FFFFFF'
  surface-muted: '#EEF1F4'
  ink-primary: '#111827'
  ink-secondary: '#4B5563'
  ink-tertiary: '#6B7280'
  border-subtle: '#D7DEE7'
  border-strong: '#A8B4C3'
  trust: '#1D4ED8'
  trust-soft: '#DBEAFE'
  warning: '#B45309'
  warning-soft: '#FEF3C7'
  danger: '#B91C1C'
  danger-soft: '#FEE2E2'
  success: '#166534'
  success-soft: '#DCFCE7'
  focus-ring: '#2563EB'
typography:
  display:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  title:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-strong:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.03em
  mono:
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 40px
  gutter: 24px
  rail: 320px
  content-max: 1440px
components:
  app-shell-nav:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
  primary-button:
    background: '{colors.trust}'
    foreground: '#FFFFFF'
    radius: '{rounded.md}'
  confidence-pill:
    radius: '{rounded.full}'
    typography: '{typography.label}'
  warning-banner:
    background: '{colors.warning-soft}'
    foreground: '{colors.warning}'
    border: '1px solid #F3D38A'
    radius: '{rounded.md}'
  evidence-chip:
    background: '{colors.trust-soft}'
    foreground: '{colors.trust}'
    typography: '{typography.label}'
    radius: '{rounded.full}'
  source-link:
    foreground: '{colors.trust}'
    typography: '{typography.mono}'
  opportunity-row:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.md}'
  context-item:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.md}'
  scope-section-card:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
  source-reference-drawer:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
  clarification-row:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.md}'
  export-panel:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
  review-action-bar:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
  artifact-tab:
    background: '{colors.surface-muted}'
    foreground: '{colors.ink-secondary}'
    active-background: '{colors.surface-raised}'
    active-foreground: '{colors.ink-primary}'
    radius: '{rounded.md}'
---

## Brand & Style

Engniter Studio is an internal-facing AI workspace for technical pre-sales decisions. The visual identity should communicate that the product is a place to inspect, validate, and commit carefully — not a glossy AI writing surface. [ASSUMPTION] The brand posture is therefore sober, analytical, and quietly confident, closer to a structured operations tool than to a marketing-site aesthetic.

The interface should feel like a review room: stable chrome, high signal-to-noise ratio, and strong emphasis on evidence, warnings, and approved state. Visual drama is intentionally low. The product should earn trust through order, not personality. When a screen draws attention, it should do so because a risk, clarification, or approval decision matters.

## Colors

The palette is restrained and role-based.

- **Surface Base (`#F7F8FA`)** is the application canvas. It should keep dense review work legible for long sessions without feeling clinical.
- **Surface Raised (`#FFFFFF`)** is the main card and panel surface. Scope sections, drawers, and artifact views live here.
- **Surface Muted (`#EEF1F4`)** supports secondary rails, inactive tabs, and scaffold containers.
- **Ink Primary / Secondary / Tertiary** provide hierarchy through text weight and contrast rather than decorative color.
- **Trust (`#1D4ED8`)** is reserved for evidence-linked actions, active progress, and primary forward motion. It should not be used as a generic accent everywhere.
- **Warning (`#B45309`)** and **Danger (`#B91C1C`)** carry commitment risk and unresolved blockers. They are semantic colors, not brand colors.
- **Success (`#166534`)** is used sparingly for approved state and completed review.

Minimum contrast expectations for load-bearing pairs:

- `ink-primary` on `surface-base` and `surface-raised` meets WCAG 2.2 AA for body text.
- `trust` text and links on `surface-base` and `surface-raised` meet WCAG 2.2 AA for interactive text.
- `warning` on `warning-soft`, `danger` on `danger-soft`, and `success` on `success-soft` meet WCAG 2.2 AA for status text.
- `focus-ring` remains visibly distinct against `surface-base`, `surface-raised`, and `surface-muted`.

Avoid: gradients, glassmorphism, neon AI tropes, and multicolor status systems that compete for attention. The product already has a lot to say; the palette should reduce cognitive load, not add to it.

## Typography

Typography is functional and dense. Inter is the default typeface across display, headings, and body because it remains clear under information-dense conditions. `display` exists for page-level section titles only; most screens should rely on `title`, `body`, and `label`.

`mono` is reserved for evidence references, source metadata, and machine-adjacent content such as file labels or extraction provenance. It signals "inspectable system output" without turning the full product into a developer console.

Avoid oversized hero text, decorative serif moments, and marketing-first typography. Engniter Studio is read while reviewing risk, not while browsing content.

## Layout & Spacing

The product uses a desktop-first application layout. [ASSUMPTION] The canonical screen is a three-zone structure: left navigation / list rail, main workspace, and optional right-side evidence or details rail. Dense screens should still preserve readable grouping via `spacing.3`, `spacing.4`, and `spacing.5`; collapsing everything to save space is a false economy.

The layout should support long-form review without becoming spreadsheet-like. Major surfaces should stay within `{spacing.content-max}`. Panels and cards use `{rounded.lg}` or `{rounded.md}`. Tables, list rows, and evidence items use tighter spacing and smaller radii to keep the product crisp.

Visual reference: `mockups/opportunity-overview.html` demonstrates the three-zone overview layout, metadata hierarchy, fit-criteria placement, and Context Package summary.

## Elevation & Depth

Engniter Studio uses tonal layering and borders before shadow. Primary hierarchy comes from adjacency, headings, and semantic state, not dramatic elevation. Shadows, when used, should be faint and reserved for overlays such as drawers, sheets, or modal confirmations.

Panels and action bars should read like organized work surfaces. If a card needs emphasis, prefer border contrast, background tint, or position over heavy drop shadow.

## Shapes

Corner radii are firm but not sharp. `{rounded.sm}` for chips, badges, and compact inputs; `{rounded.md}` for actions and inline panels; `{rounded.lg}` for major workspace cards, drawers, and review surfaces. `{rounded.full}` is reserved for pills such as confidence and status tokens.

Avoid circular badges as decorative markers. Rounded shapes should support scanability and grouping, not soften the product into a consumer mood-board.

## Components

- **App shell nav** — Uses `{components.app-shell-nav}`. Navigation should feel structurally separate from the work canvas but never visually louder than the active workspace.
- **Primary button** — Uses `{components.primary-button}`. Primary action means forward motion in the workflow: run analysis, approve Scope Brief, generate artifact, export. There should be only one clear primary action per view.
- **Opportunity row** — Uses `{components.opportunity-row}`. Rows should read as scannable work objects with status, owner, and deadline visible before opening the full workspace.
- **Context item** — Uses `{components.context-item}`. Items should make source type and chronology obvious without turning the Context Package into a document browser.
- **Scope section card** — Uses `{components.scope-section-card}`. Review items should feel precise, inspectable, and stable under repeated edit / accept / reject cycles.
- **Confidence pill** — Uses `{components.confidence-pill}` with semantic color states. Low confidence should read cautionary, not catastrophic; High confidence should read trustworthy, not celebratory.
- **Warning banner** — Uses `{components.warning-banner}`. Appears for no-promise gating, sparse Context Package warnings, or unresolved critical gaps.
- **Evidence chip** — Uses `{components.evidence-chip}` to label source-backed items, drawer links, or cited extraction fragments.
- **Source link** — Uses `{components.source-link}`. Source references should look inspectable and precise.
- **Source Reference drawer** — Uses `{components.source-reference-drawer}`. The drawer should feel like a continuation of the current task, not a navigation break.
- **Clarification row** — Uses `{components.clarification-row}`. Clarification items should foreground priority and cause before answer drafting.
- **Review action bar** — Uses `{components.review-action-bar}`. Sticky or pinned at the bottom or side of review-heavy screens to anchor accept / edit / reject / flag actions.
- **Artifact tab** — Uses `{components.artifact-tab}` for Scope Brief, Clarification Packet, Mini PRD, SOW Draft, and Proposal Draft switching.
- **Export panel** — Uses `{components.export-panel}`. Export and internal-share controls should read as finalization surfaces, not as generic file-download widgets.

Visual reference: `mockups/scope-brief-review.html` demonstrates Scope section cards, the Source Reference drawer, warning-banner hierarchy, and the review-action-bar. `mockups/artifact-studio.html` demonstrates Artifact tabs and Export panel structure.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use semantic color only where product state changes meaning | Use warning or danger colors for decoration |
| Keep the primary action singular and obvious | Put multiple equally loud primary buttons on one surface |
| Use mono only for inspectable machine-adjacent content | Render paragraphs or headings in mono |
| Let borders and grouping create hierarchy | Rely on heavy shadows and floating cards everywhere |
| Keep evidence, status, and review decisions visually explicit | Hide risk state in tiny icons or hover-only affordances |

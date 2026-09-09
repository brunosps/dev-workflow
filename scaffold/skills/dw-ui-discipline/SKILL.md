---
name: dw-ui-discipline
description: Use BEFORE any UI work. 4 grounding questions (design source, surface job, state matrix, scene), 14 anti-slop patterns, WCAG 2.2 AA floor. Triggers on UI design, /dw-redesign-ui, UI diffs.
allowed-tools:
  - Read
---

# UI Discipline

Training-data defaults are the enemy. An ungrounded LLM proposing UI will reach for `#3B82F6` blue, `rounded-lg` radius, center-aligned text, and gradient backgrounds — because those screenshots dominate training data. The surface ends up looking like every other SaaS dashboard, and users can't tell what to look at first.

This skill blocks that autopilot at four grounding questions before any visual decision lands. After the questions pass, it enforces an accessibility floor and runs a visual-slop catalog as the proposed design comes together.

## When to use

- Inside `/dw-redesign-ui` — both proposal and validation steps.
- Inside `/dw-plan techspec` when the spec has UI sections.
- Inside `/dw-functional-doc` when documenting screen-level patterns.
- Inside `/dw-review --code-only` when the diff touches UI files (CSS, JSX, templates).
- Inside `/dw-brainstorm` when the conversation drifts into visual direction.

If you're tempted to skip this "because it's just a small tweak" — that's the trigger. Run the grounding.

## The four grounding questions

For the four grounding questions, read `references/the-four-grounding-questions-detail.md`. Load only when this part of the task applies.

## Required reading by context

| Doing what | Read |
|------------|------|
| Planning/auditing frontend data flow, dependencies or quality tooling | `references/frontend-engineering.md` (may be read directly without visual grounding for nonvisual work) |
| Any UI work (the full version of the grounding) | `references/hard-gate.md` |
| Reviewing or proposing a design | `references/visual-slop.md` (14 patterns + specific anti-default values) |
| Designing state coverage | `references/state-matrix.md` |
| Interactive widget (button, form, modal, anything clickable) | `references/accessibility-floor.md` |
| No design authority exists in the project | `references/curated-defaults.md` (palettes / fonts / scales) |
| Choosing or reviewing a palette / dark mode | `references/color-oklch.md` (OKLCH, tinted neutrals, contrast) |
| Fonts, sizing, hierarchy, line length | `references/type-scale.md` (modular scale, pairing, measure) |
| Adding animation or transitions | `references/motion.md` (easing, duration, reduced-motion) |
| Cross-device / breakpoints / touch | `references/responsive.md` (mobile-first, container queries) |
| Any user-facing copy (labels, errors, empty states) | `references/ux-writing.md` |

## The 14 visual-slop patterns (full catalog in `references/visual-slop.md`)

Watch for these in proposed designs and PR diffs:

1. **Uniform-section flatness** — every section looks like every other section; no anchor for the eye.
2. **Soft hierarchy** — headings barely larger than body; primary CTA same color as secondary.
3. **Decorative hover** — hover states that don't change anything functional or clickable.
4. **Emoji as ornament** — emojis in headers, CTAs, section labels where they add no information.
5. **Gradient cover** — gradients used to mask weak composition rather than serve a poetic hero.
6. **Glass-on-everything** — frosted-glass effect on every panel, including ones with nothing behind.
7. **Center-aligned by default** — body paragraphs and forms reading center where left would read better.
8. **Grayscale wash** — neutral grays everywhere, no accent personality, no character.
9. **Verb-less CTAs** — "Get Started", "Learn More", "Click Here", "Submit", "OK".
10. **Stock-illustration hero** — figure-with-laptop, diverse-team-around-table, abstract floating shapes.
11. **Shadow soup** — shadows on cards on shadows on borders on gradients on one element.
12. **Generic spinner** — wall-clock spinner as the only loading state for every operation.
13. **Silent empty state** — "No items found." centered. Nothing else. No guidance.
14. **Toast everywhere** — every UI event becomes a toast; five stack up and none get read.

Plus 17 anti-default values (specific colors, radii, font choices, spacing presets) that signal "no thought went into this" — full list in `references/visual-slop.md`.

## Accessibility floor — non-negotiable

Before any interactive widget ships:

- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 body, 3:1 large text and UI components).
- [ ] Focus-visible state distinct from hover.
- [ ] Keyboard navigation works end-to-end.
- [ ] ARIA labels for icon-only buttons.
- [ ] Form errors announced to screen readers.
- [ ] No keyboard traps.
- [ ] Touch targets ≥24×24 CSS pixels (≥44×44 recommended on mobile).
- [ ] Heading hierarchy is semantic (no skipped levels).
- [ ] `prefers-reduced-motion` honored.

Full verification recipes in `references/accessibility-floor.md`. `/dw-review --code-only` rejects the verdict if any interactive widget ships without these.

## When the grounding bends

- **Bug fix in existing UI** — grounding applies only to the area touched, not the whole surface.
- **Pure copy change** — only the "what does this help the user do" question still applies as a sanity check.
- **Throwaway spike** — grounding skippable if the spike is explicitly marked non-production.

In all bend cases, document the bend in the PR (one line). "I skipped the state matrix because this is a one-line copy fix" is fine. "I skipped because I was in a hurry" is not.

## Integration with dev-workflow commands

- `/dw-redesign-ui` runs the grounding end-to-end. Steps 4 (propose) and 7 (validate) consult this skill explicitly.
- `/dw-plan techspec` UI sections must answer the 4 grounding questions and reference the state matrix.
- `/dw-review --code-only` checks UI diffs against the 14 visual-slop patterns and the accessibility floor.
- `/dw-functional-doc` records the surface-job and scene sentences in the overview for each screen.

## Why this approach

The shorter route — "agent loads a 161-palette catalog and picks one" — produces dashboards that look like every other dashboard because the agent has no constraint that pulls it away from training-data centers of mass.

The grounding pulls the design toward the specific surface, the specific user, the specific moment. Even with the same palette catalog, a "3am on-call dark room troubleshooting" design lands different choices than a "morning manager approving expenses" design. That difference is where surface quality lives.

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when grounding, state coverage, accessibility, and visual review pass, `FINDINGS` when UI risks remain, `BLOCKED` when design authority or surface job is unclear, `NOT_APPLICABLE` when no UI surface is in scope.
- **Scope:** screen/component, design authority, user job, state matrix, and device/context.
- **Evidence:** design source read, four grounding answers, states checked, screenshots, and accessibility checks.
- **Artifacts:** UI proposal, design notes, state matrix, screenshot path, or QA finding.
- **Decisions:** palette/type/component choices, state handling, and accepted deviations.
- **Risks:** training-data defaults, missing states, contrast/focus failures, unreadable hierarchy, or mobile overflow.
- **Next Step:** exact design/code/QA action or missing input to gather.

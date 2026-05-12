---
name: dw-ui-discipline
description: Use BEFORE any UI work — enforces a hard-gate (brand authorities or curated defaults, surface job, state matrix, scene sentence), 14 anti-slop patterns, and WCAG 2.2 AA floor so UI ships with discipline instead of training-data defaults.
---

# UI Discipline

> **Inspired by** [`pedronauck/skills/ui-craft`](https://github.com/pedronauck/skills/tree/main/skills/mine/ui-craft) (MIT). Hard-gate protocol, anti-slop catalog, state matrix enforcement, and accessibility-floor patterns adapted from Pedro Nauck's work; specifics rewritten for dev-workflow's redesign and review loops.

The fastest path through UI work is the disciplined one. "It's just a small change" is the most common slop excuse. This skill blocks that excuse at four checkpoints before any design decision lands.

## When this skill applies

- Any work invoked from `/dw-redesign-ui`, `/dw-create-techspec` (UI sections), `/dw-functional-doc`, or `/dw-code-review` when the diff touches UI.
- Adding new screens, components, or surfaces.
- Reviewing visual changes in a PR.
- Auditing accessibility on existing surfaces.

If you're tempted to skip the gate "because it's just a tweak" — that's the trigger. Run the gate.

## The hard-gate (4 mandatory items before any UI work)

Before proposing colors, layouts, components, or any visual decision, complete all four:

### 1. Brand authorities OR curated defaults

Locate the project's design source of truth:
- `.dw/rules/{frontend-module}.md` design system section
- `DESIGN.md`, `BRAND.md`, or design tokens config (Tailwind, CSS vars, theme file)
- Component library docs (shadcn/ui, MUI, Chakra, etc.)

If **none exist**, do NOT invent. Read `references/curated-defaults.md` — pick from the 10 neutral palettes + 10 font pairings shipped there. Mark the choice as a finding in the techspec ("no design authority found; used curated default <name>; recommend establishing one").

### 2. Surface job sentence

Write one sentence: "This surface helps the user <do what> so that <outcome>." Vague language ("show data", "manage settings") fails — be specific ("filter overdue invoices so they can chase late payers in <30s").

If you can't write the sentence, the requirements are unclear. Stop and clarify before proceeding.

### 3. Complete state matrix

Enumerate all states the surface can be in. See `references/state-matrix.md` for the full list:
- `default`, `hover`, `active`, `focus-visible`, `disabled`, `loading`, `empty`, `error`, `success`
- Plus any domain-specific states (read/unread, online/offline, etc.)

Missing a state at design time = production bug later. The "we'll add empty state later" trap is real.

### 4. Scene sentence

One sentence describing the physical context: **who** is using this, **where** (mobile bus, office desktop, on-call laptop), **what light** (dark room, bright outdoor), **what mood** (rushed, exploring, troubleshooting).

This forcing function prevents category-level defaults from becoming the answer. A "dashboard for an on-call engineer at 3am in a dark room troubleshooting a fire" produces different decisions than "dashboard for a manager during business hours."

## Required Reading Router

| Context | Read |
|---------|------|
| Any UI work | `references/hard-gate.md` (full protocol with examples) |
| Interactive widgets (buttons, forms, modals) | `references/accessibility-floor.md` (WCAG 2.2 AA non-negotiable) |
| Reviewing a UI diff | `references/anti-slop.md` (14 anti-patterns + 17 anti-defaults) |
| Designing state coverage | `references/state-matrix.md` (full enumeration + checklist) |
| No design authority exists in project | `references/curated-defaults.md` (10 palettes + 10 fonts) |

## Anti-slop summary (full list in references/anti-slop.md)

The 14 patterns this skill catches:

1. **Visual sameness** — every section looks like every other section.
2. **Weak hierarchy** — nothing draws the eye to what matters first.
3. **Fake interactivity** — hover states that don't change anything functional.
4. **Emoji spam** — emojis as decoration where icons or restraint would serve.
5. **Gradient crutch** — gradients used to mask weak composition.
6. **Glass everything** — frosted glass on every panel.
7. **Centered all the things** — center-aligned text when left-aligned reads better.
8. **AI gray washing** — neutral grays everywhere, no character.
9. **Generic CTAs** — "Get Started", "Learn More", "Click Here" with no specificity.
10. **Stock illustration** — generic figure-with-laptop hero art.
11. **Drop shadow soup** — shadows on cards on shadows on borders.
12. **Loading spinner default** — spinner as the only loading state for everything.
13. **Empty state void** — empty list with no guidance on what to do next.
14. **Notification-soup tray** — every UI event becomes a toast.

Plus 17 anti-defaults (specific values to NEVER use without intent — `#3B82F6` blue, `rounded-lg` everywhere, etc.) in `references/anti-slop.md`.

## Accessibility floor — non-negotiable

Before any interactive widget ships:

- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 for body text, 3:1 for large text and UI components).
- [ ] Focus-visible state exists and is distinct from hover.
- [ ] Keyboard navigation works (tab order, escape closes modals, enter submits forms).
- [ ] ARIA labels for icon-only buttons.
- [ ] Form errors are announced to screen readers.
- [ ] No keyboard traps.

Full verification recipes in `references/accessibility-floor.md`. This is a hard gate — `/dw-code-review` fails verdict if any interactive widget ships without these.

## When the gate bends

Real-world UI can't always be perfect:

- **Bug fix in existing UI** — gate applies only to the area touched, not the whole surface.
- **Pure copy change** — gate is just "scene sentence still holds?" — quick check.
- **Spike / exploration** — gate skipped if the spike is explicitly marked throwaway; production code must run the gate.

In all bend cases, document the bend in the PR description (one line). "I skipped the state matrix because this is a one-line copy fix" is fine. "I skipped because I was in a hurry" is not.

## Integration with dev-workflow commands

- `/dw-redesign-ui` runs the gate end-to-end. Steps 4 (propose design) and 7 (validate WCAG) consult this skill.
- `/dw-create-techspec` UI sections must list which authorities were consulted (brand vs curated default) and reference the state matrix.
- `/dw-code-review` checks the diff against `references/anti-slop.md` and the accessibility floor.
- `/dw-functional-doc` documents the scene sentence in the overview.

## Anti-patterns this skill prevents

- "Just use the same hero as the marketing page" — without verifying the surface job differs.
- "We'll add empty/error states later" — they're never added later.
- "It looks fine on my desktop" — without checking mobile + keyboard + screen reader.
- Designing in isolation from `.dw/rules/` documented patterns.
- Inventing color values when the design system has tokens that fit.
- Shipping interactive widgets without WCAG 2.2 AA verification.

## Why this skill exists

The previous bundled skill (`ui-ux-pro-max`) provided 161 color palettes and 57 font pairings — a CATALOG of taste. It had no gates, no anti-patterns, no enforcement. Agents loaded KB of palette data and still produced slop because there was no DISCIPLINE.

This skill inverts that trade-off: 10 curated defaults (enough for 90% of cases) + a strong gate + an anti-slop catalog. Less context bytes, more leverage.

---
type: idea-onepager
schema_version: "1.1"
status: draft | paused | aligned
date: YYYY-MM-DD
classification: improves | consolidates | new
alignment:
  confirmed_by_user: false   # set true ONLY when the user explicitly confirms shared understanding
  confirmed_on: null         # ISO date of that confirmation
---

> **Schema 1.1.** The `## Grill Alignment` block below is populated by a `/dw-brainstorm` grill session. Without a
> Grill, leave that block empty and keep `status: draft`. `status: aligned` is allowed ONLY when every dependency
> branch is resolved, glossary/code contradictions are closed, no blocking decision remains, and the user has
> explicitly confirmed shared understanding — otherwise use `draft` or `paused`.

# Idea: [Short, imperative title]

## Problem Statement

[Reframe the raw idea as a "How might we" sentence:
**How might we** [verb] **for** [user/segment] **so that** [outcome/measurable value]?

Focus on the problem, not the solution. Avoid jumping into "how to implement".]

## Product Context (mapped existing features)

[Inventory of product features relevant to this idea. **Product level, not code level.** List what the product already delivers today that relates to the idea.

Sources:
- PRDs in `.dw/spec/prd-*/prd.md` (features already delivered or in development)
- `.dw/rules/index.md` (product overview)
- `.dw/intel/` (queryable index — built by `/dw-intel --build`, queried via `/dw-intel`)

Format:]

- **[feature A name]** — `.dw/spec/prd-<slug>/prd.md` — status: live / in development
- **[feature B name]** — `.dw/rules/index.md#module-Y` — status: live
- **[feature C name]** — PRD in progress, see `tasks.md`

> If the product is greenfield (no PRDs or rules yet), write: "Feature Inventory: greenfield — no product artifacts yet. This is the first recorded idea."

## Classification & Rationale

**Type:** IMPROVES | CONSOLIDATES | NEW

[Pick ONE of the three and justify:]

- **If IMPROVES** — which existing feature is being improved and why improving is worth more than creating a separate feature. Cite the original PRD.
- **If CONSOLIDATES** — which features are being merged, the gain from unifying (more cohesive UX, less duplicate code, consolidated data). List the original PRDs that become "superseded" (or under review).
- **If NEW** — why the product needs this capability now, where it connects to existing features (even new features are rarely fully isolated), and which gap it fills.

## Recommended Direction

[The recommended approach, 1 paragraph, in **product language**:
- User journey (who does what, when, why)
- Value delivered
- Boundary (what this idea covers and what's explicitly out)

**DO NOT write technical architecture here** — that's the techspec's job.]

## MVP Scope

[The smallest version that delivers real value. Thought in **user stories**, not technical tasks.

- As a [persona], I can [action] so that [benefit]
- As a [persona], I can [action] so that [benefit]

Ideally 2-4 stories. If it's more than 5, it's probably not MVP.]

## Not Doing (explicit)

[Tempting items that landed OUT of scope — and why. Forces scope discipline:]

- **[tempting item 1]** — reason: [out of scope because...]
- **[tempting item 2]** — reason: [could become v2 if hypothesis X validates]

## Key Assumptions to Validate

[What must be true for this direction to work. Each assumption with a test — ideally **with a user**, not with code.]

- **[assumption 1]** — test: [interview 5 users in segment X / market research / low-fidelity prototype]
- **[assumption 2]** — test: [metric Y rises by Z% within 2 weeks of release]

## Open Questions

[Questions that don't yet have an answer and that the user (or stakeholder) must answer before the PRD:]

- [Question 1 affecting scope]
- [Question 2 affecting priority]

## Grill Alignment

_(schema 1.1 — filled by a `/dw-brainstorm` grill session; consumed by `/dw-plan`, which does NOT re-ask resolved decisions. Leave empty for a non-grilled one-pager.)_

### Resolved Decisions

| Decision | Recommended | Chosen | Alternative rejected | Evidence |
|----------|-------------|--------|----------------------|----------|
| [the decision] | [what Grill recommended] | [what the user chose] | [the rejected option + its trade-off] | [one-pager/repo source] |

### Evidence

[Facts discovered during Grill from the repo/rules/intel/docs — each with its source (`path:line`, doc, or intel query) — that were used instead of asking the user.]

- **[fact]** — source: `[path:line or doc]`

### Canonical Vocabulary

[Links into `.dw/domain/**` for the terms this idea depends on. Do not restate definitions here — point to the glossary.]

- **[Term]** → `.dw/domain/glossary.md#term` (or `.dw/domain/contexts/<slug>.md#term` for a multi-context project)

### Remaining Decisions

[Non-blocking decisions still open after alignment, with their owner. A blocking decision means the one-pager is NOT `aligned`.]

- **[open decision]** — owner: [who] — blocking? [no]

### Alignment State

- **State:** `draft` | `paused` | `aligned`
- **Shared understanding confirmed by user:** [yes/no — `aligned` requires an explicit yes]
- **Why not aligned (if draft/paused):** [the blocking node or unclosed contradiction that stopped alignment]

## Next Step

Pick ONE:

- **`/dw-plan prd`** using this one-pager as input — when the direction is clear but we need to detail user stories, acceptance criteria, and hand off to techspec
- **`/dw-run`** — when it's an IMPROVES so small that it fits in a single task (up to 3 files, no new endpoint/screen) — write a quick PRD first
- **Stop here** — if any "Open Question" is blocking, stop and resolve with the stakeholder before advancing

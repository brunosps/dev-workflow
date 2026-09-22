---
name: dw-review-rigor
description: Five rules for review output — dedupe, severity-order, verify intent, skip linter noise, prefer signal over volume.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# dw-review-rigor — Discipline For Review Commands

A set of rules the caller applies while producing a review report. This skill does not produce its own report file — it shapes the caller's output.

## When Invoked

By `/dw-review --code-only` (all five rules plus the full candidate pipeline), `/dw-review --coverage-only` (de-dup and severity-ordering on PRD-vs-code gaps), `/dw-refactor` and `/dw-brainstorm --mode=refactor-audit` (rules 1, 2, 4, 5; rule 3 adapts, so a smell with a justifying ADR becomes a `low` finding at most). The caller has already identified a scope — files, a PR, a codebase area — and this skill governs how findings are selected, deduplicated, ordered, and phrased.

## Required Inputs

- The scope the caller is reviewing (file paths, directories, or PR diff).
- Optional: prior review reports for the same target, so this round surfaces only NEW findings. See Prior-Round Awareness.

## Candidate Pipeline

Nothing you notice is a finding yet. Everything enters as a **candidate** and leaves through exactly one of three exits: `finding`, `needs-validation`, or `rejected`. There is no fourth — a candidate that quietly disappears is a defect of the review.

**Stage 1 — Gate.** Clear four checks; any "no" or "unsure" means this is not ready to be a finding:

1. **Location** — exact file and line?
2. **Failure mode** — a concrete input/state and the bad outcome it produces?
3. **Context** — read the surrounding code (callers, imports, tests), not just the flagged line?
4. **Severity** — defensible against Rule 2's definitions? (a missing JSDoc is never HIGH)

See `references/false-positives.md` for patterns LLM reviewers habitually mis-flag.

**Stage 2 — Refutation.** The reasoning that produced a candidate cannot also be its check; it anchors every reading that follows. Each candidate clearing Stage 1 faces a deliberate attempt to disprove it. With subagents, dispatch `dw-finding-refuter` with the claim and the raw code, never the reasoning behind it, one candidate per dispatch. Otherwise re-derive the path from source, working to show the outcome cannot happen. Packet contract, upstream guards and both output formats: `references/refutation-pass.md`.

**Stage 3 — Disposition.** Holds on evidence the refutation found for itself → `finding`, with a severity. Blocked upstream, input unreachable, or behavior intended → `rejected`, one line at the end of the report naming what disproved it. Cannot be established either way → `needs-validation`, which never receives a severity and records what is missing and what would settle it. When the environment needed to settle a claim is unavailable, it **stays** `needs-validation` — not promoted, not dropped. Each exit carries different fields: contract in `references/refutation-pass.md`.

Report only findings you are **>80% confident** are real *after* Stage 2. Three needs-validation entries and one finding is a more honest round than four.

## The Five Rules

For the five rules, read `references/the-five-rules-detail.md`. Load only when this part of the task applies.

When the scope is an already-merged range (`/dw-review --post-merge`), also read `references/composition-audit.md`: the seven cross-interaction classes, the composition-only defect checklist, the documentation ledger and the semver recommendation.

## Prior-Round Awareness

Prior reports live in `<target>/QA/` (PRD target) or `<target>/review/` (bugfix target). Read them and extract three lists — known findings (titles + file/line signatures), open `needs-validation` entries, rejected candidates — then:

1. Surface **only NEW findings**. Do not re-flag items already tracked as pending, resolved, or accepted.
2. Re-check every open `needs-validation` entry. Resolve it into a finding or a rejection when this round has the missing evidence; otherwise carry it forward unchanged. Carrying it forward is a valid outcome — dropping it is not.
3. Do not re-raise a rejected candidate unless the code changed in a way that defeats the recorded refutation. Name what changed.
4. If a prior finding was resolved incorrectly, open it as a NEW finding with "Regression of <prior ref>" in the body.

## Finding Format

Each finding uses:

```
[<severity>] <file.ext>:<line> — <title ≤72 chars>

<1-4 lines describing the problem>
<1-2 lines suggesting the fix>

Also affects: <other paths if de-duplicated, else omit>
Evidence: <relevant code snippet, test output, or reference>
```

## Output Structure

The caller emits:

1. **Merge/ship recommendation** — `Needs fixes before merge` when any critical or high exists, naming the blockers; `Safe to merge with follow-ups` for medium/low only; `Clean — ready to merge` for none.
2. **Counts** — critical / high / medium / low.
3. **Findings** — ordered by severity, each in the format above.
4. **Needs Validation** — open questions carried by this round, without severities.
5. **Rejected Candidates** — one line per refuted candidate, with what disproved it.
6. **Well-implemented aspects** — short bulleted list, calibrates tone.
7. **Self-score** — rate the report on the five axes in `references/self-eval-rubric.md`; any axis below top cites the gap, then fix (<30s) or flag.

## Critical Rules

- Do not modify source code — this skill shapes findings only, it does not fix.
- Do not create findings for problems a configured linter already catches.
- Do not flag patterns that have a clear adjacent justification or ADR.
- Do not write N identical findings for one root cause — de-duplicate.
- Do not mix severities — order is critical → high → medium → low.
- Do not assign a severity to anything that did not survive Stage 2.
- Do not delete a candidate — route it to findings, needs-validation, or rejected.

## Inspired by

The five rules are ported from Compozy's `cy-review-round` (credit: [Compozy](https://github.com/compozy/compozy), MIT), extracted here so three review commands share one discipline. The candidate pipeline, `needs-validation` and the rejected-candidate log originate in [`cloudflare/security-audit-skill`](https://github.com/cloudflare/security-audit-skill) (MIT), reaching us via `akitaonrails/my-skills` — chain: cloudflare → akitaonrails → dev-workflow. Reimplemented independently; no upstream text reused.

## Structured Return

- **Status:** `PASS` when no defensible findings remain (open `needs-validation` entries do not block it, but each must be listed), `FINDINGS` when review findings exist, `BLOCKED` when diff/context is insufficient, `NOT_APPLICABLE` when no review is in scope.
- **Scope:** diff range, files reviewed, prior rounds, and review mode.
- **Evidence:** file/line references, behavior impact, the refutation each finding survived, prior-round disposition.
- **Artifacts:** review report, inline findings, or consolidation notes.
- **Decisions:** severity and order, duplicate suppression, and every refuted candidate with what disproved it.
- **Risks:** missing tests, unreviewed generated files, stale base branch, non-defensible claims, open `needs-validation` entries.
- **Next Step:** exact fix, verification, what would resolve each `needs-validation` entry, or the approval/block marker.

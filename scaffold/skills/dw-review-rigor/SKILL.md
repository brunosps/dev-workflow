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

By `/dw-review --code-only`, `/dw-review --coverage-only`, `/dw-refactor`, and `/dw-brainstorm --mode=refactor-audit`. The caller has already identified a scope (files, a PR, a codebase area). This skill governs how findings are selected, deduplicated, ordered, and phrased.

## Required Inputs

- The scope the caller is reviewing (file paths, directories, or PR diff).
- Optional: prior review reports in `.dw/spec/prd-*/reviews/` — so this round only surfaces NEW findings.

## Pre-Report Gate

Before writing ANY finding, clear four checks — if any is "no"/"unsure", downgrade or drop it (an unactionable finding is noise):

1. **Location** — exact file and line?
2. **Failure mode** — a concrete input/state and the bad outcome it produces?
3. **Context** — read the surrounding code (callers, imports, tests), not just the flagged line?
4. **Severity** — defensible against Rule 2's definitions? (a missing JSDoc is never HIGH)

Report only findings you are **>80% confident** are real. A style preference no rule backs is not a finding. See `references/false-positives.md` for patterns LLM reviewers habitually mis-flag.

## The Five Rules

For the five rules, read `references/the-five-rules-detail.md`. Load only when this part of the task applies.

## Prior-Round Awareness

If the PRD directory has prior review reports:

1. Read them and extract the list of known findings (their titles + file/line signatures).
2. The current round surfaces **only NEW findings**. Do not re-flag items already tracked as pending, resolved, or accepted in earlier rounds.
3. If a prior finding was resolved incorrectly, open it as a NEW finding with "Regression of <prior ref>" in the body.

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

1. **Merge/ship recommendation** — one of:
   - `Needs fixes before merge` (if any critical or high exist), with blocking findings named.
   - `Safe to merge with follow-ups` (only medium/low).
   - `Clean — ready to merge` (no findings).
2. **Counts** — critical / high / medium / low.
3. **Findings** — ordered by severity, each in the format above.
4. **Well-implemented aspects** — short bulleted list, calibrates tone.
5. **Self-score** — rate the report on the five axes in `references/self-eval-rubric.md`; any axis below top cites the gap, then fix (<30s) or flag.

## Critical Rules

- Do not modify source code — this skill shapes findings only, it does not fix.
- Do not create findings for problems a configured linter already catches.
- Do not flag patterns that have a clear adjacent justification or ADR.
- Do not write N identical findings for one root cause — de-duplicate.
- Do not mix severities — order is critical → high → medium → low.

## Integration With Other dev-workflow Commands

- `/dw-review --code-only` — applies all five rules to its Level-3 review output; uses prior reports in `.dw/spec/*/reviews/` to dedupe across rounds.
- `/dw-review --coverage-only` — applies de-dup + severity-ordering when listing gaps between PRD requirements and code.
- `/dw-refactor` — applies rules 1, 2, 4, 5 when cataloging code smells (rule 3 adapts: a "smell" with a justifying ADR becomes a `low` finding at most).

Callers should mention this skill in their "Skills Complementares" section.

## Inspired by

Ported from Compozy's `cy-review-round` skill (`/tmp/compozy/.agents/skills/cy-review-round/SKILL.md`). Adapted for dev-workflow:

- No `reviews-NNN/` directory convention — dev-workflow reviews already persist in `.dw/spec/*/reviews/` per command's existing contract.
- The five rules are extracted here so three different dev-workflow review commands can share the discipline without duplicating it.
- No issue-file frontmatter (Compozy uses it to interoperate with its remediation engine; dev-workflow's remediation is manual or via `/dw-qa --fix`).

Credit: Compozy project (https://github.com/compozy/compozy).

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when no defensible findings remain, `FINDINGS` when review findings exist, `BLOCKED` when diff/context is insufficient, `NOT_APPLICABLE` when no review is in scope.
- **Scope:** diff range, files reviewed, prior rounds, and review mode.
- **Evidence:** file/line references, behavior impact, and prior-round disposition.
- **Artifacts:** review report, inline findings, or consolidation notes.
- **Decisions:** finding severity/order, duplicate suppression, and false-positive rejection.
- **Risks:** missing tests, unreviewed generated files, stale base branch, or non-defensible claims.
- **Next Step:** exact fix, verification, or approval/block marker.

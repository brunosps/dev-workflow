---
name: dw-chaos-engineering
description: Use to adversarially test a change you just implemented. Maps the attack surface, writes tests that try to break it, classifies each KILLED/SURVIVED/INCONCLUSIVE. Local only, writes tests only, 3 rounds max. Ask for it by name.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# Chaos Engineering

> Adapted from the chaos-engineering skill in [`samsantosb/ship-it`](https://github.com/samsantosb/ship-it)
> (MIT © Samuel Santos). The vector catalogue and the KILLED/SURVIVED/INCONCLUSIVE vocabulary come from
> there; target resolution, criticality anchoring and finding routing are rewritten for `.dw/`.

Where the rest of the pipeline builds, this tries to break. It takes a change that is already implemented
and writes tests whose only purpose is to prove it fails.

**An attack that SURVIVED is also a result.** The goal is not bugs at any cost — it is mapping where the
code holds and where it gives, and leaving the tests that matter as regression inheritance.

## When to use

Invoked by name, never automatically — it writes files, runs the suite and costs real time. Ask for it
after an implementation is complete and its normal tests pass: post-`/dw-run`, post-`/dw-bugfix`, or on an
open PR before merge.

Do not use it to find a known bug (that is `/dw-bugfix`), to review code (`/dw-review`), or on a change
that has no tests yet — chaos measures resilience, it does not substitute for coverage.

## Step 0 — Baseline gate

**The target's existing tests must pass before any attack.** Run the project's configured suite scoped to
the touched files.

A red baseline stops the run. With a broken environment you cannot tell a finding from noise, and every
subsequent classification is worthless. Report the failing baseline and stop — that is a `BLOCKED` outcome
under `.dw/references/automode.md`, not a failed run.

## Step 1 — Resolve the target

First that exists: the PR diff · the local diff against the base branch · the files named in
`.dw/spec/<prd>/tasks/` or `.dw/bugfixes/<slug>/TASK.md`. Only what changed is in scope — the rest of the
repository is not the target.

Read the acceptance criteria if the target has them. Every promise is attackable by negation.

## Step 2 — Attack plan

Cross the diff with `references/vector-catalog.md` and select the vectors that actually apply. Not every
vector fits every diff; prioritize by impact × probability.

**Criticality is anchored, not assumed.** `.dw/rules/concerns.md` (the Concerns Map) and
`.dw/constitution.md` define what is critical *in this project*. Without them severity is opinion; with
them, a finding against the thing the project protects is critical by definition.

Show the plan before building: target, surface, selected vectors as hypotheses, and the vectors left out
with one line each on why.

## Step 3 — Build the arsenal

Follow the project's test conventions and the `dw-testing-discipline` skill — it owns *how* a test is
written (the anti-pattern catalogue, the agent guardrails, flaky discipline). This skill owns only the
attack protocol.

- One group per vector, one case per attack, named for the hypothesis rather than the implementation.
- **Simulate hostility with mocks and fixtures.** The test describes a hostile world; it never depends on
  a real one.
- **Each attack asserts the CORRECT behaviour** — what the system should do under chaos — never the bug.
  So a failing attack is a real finding, and the same test becomes a free regression once it is fixed.

## Step 4 — Run and classify

- **KILLED** — the attack broke it. Produce the minimal reproduction: the smallest hostile input that
  still kills.
- **SURVIVED** — the code held. A result, not a wasted test.
- **INCONCLUSIVE** — the *test* is wrong (bad mock, flake, environment limit). Fix and rerun, at most
  twice; still inconclusive after that, record it as such and drop it. Never inflate the report.

**Round cap: 3.** The initial plan plus at most two deepening rounds on what killed or nearly did. The
INCONCLUSIVE retry cap is independent — never burn a round chasing a verdict on a broken test.

## Step 5 — Triage

Severity comes from the criticality anchor, not from how alarming the input looked.

Before sealing each finding, apply the **defense-lawyer test**: is there a reading where this behaviour is
intentional — an ADR, a project rule, an adjacent comment? If yes, mark it `contestable` and record the
doubt. The report separates fact from interpretation, the same way `dw-review-rigor` separates a finding
from an unresolved lead.

## Step 6 — Report and routing

Report to `<target>/QA/chaos-report.md`, following the target convention `/dw-qa` already uses.

Where each result goes:

| Result | Destination |
|---|---|
| SURVIVED covering a real gap no existing test covered | Promote as a permanent regression |
| KILLED on an open PR | Test ships **unskipped** — it blocks the merge on purpose, and `/dw-review` rejects |
| KILLED on already-merged code | Open `.dw/bugfixes/NNN-slug/` via `/dw-bugfix`; never reopen the landed work |
| SURVIVED but redundant, or INCONCLUSIVE | Discard. The arsenal is not an accumulation |

## Hard limits

- **Local only.** Never fire a request at staging, production or a partner API. A hostile world is
  simulated, without exception.
- **Tests only.** Production code is read-only here. Finding and fixing are separate roles by design.
- **Three rounds.** Infinite chaos is procrastination with extra steps.
- **No theatrical chaos**: no scenarios impossible by construction to pad the report, no asserting the
  current buggy behaviour, and no calling KILLED when what broke was the mock or the clock.
- Never leave a red test ownerless. A KILLED on an open PR blocks merge on purpose — that is the signal
  working. A red suite with no report and no owner is sabotage.

## Structured Return

- **Status:** `PASS` when the run completed with no unfixed KILLED, `FINDINGS` when attacks killed, `BLOCKED` when the baseline is red or the target cannot be resolved, `NOT_APPLICABLE` when no implemented change is in scope.
- **Scope:** target resolved, files attacked, vectors selected and vectors deliberately skipped.
- **Evidence:** per-attack classification with the minimal reproduction for each kill, and the baseline result.
- **Artifacts:** chaos report path, test files written, and where each shipped.
- **Decisions:** vector selection, severity anchoring, and every `contestable` downgrade with its reading.
- **Risks:** inconclusive attacks, vectors out of scope, and coverage the rounds did not reach.
- **Next Step:** the fix route for each kill (`/dw-bugfix` or the PR's own branch), or merge-clean.

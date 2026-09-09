---
name: dw-testing-discipline
description: Use when authoring, reviewing, or debugging tests. Six core rules, 25 anti-patterns, 6 agent guardrails, flaky discipline. Triggers on every test diff, /dw-qa, or test-writing session.
allowed-tools:
  - Read
---

# Testing discipline

Use for test design, test review or diagnosing failures/flakiness. Skip cosmetic test edits and reproductions that do not need a testing workflow. Tests expose defects in required behavior; a passing mock or coverage number does not establish correctness.

## Core decisions

- Identify the behavior and lowest layer that can detect its regression. Extend an existing suite when it fits; do not create test-only production seams.
- Read the project's runner/configuration before choosing commands. Package manager and runner are different: `bun test` and `bun run test` need not run the same suite.
- Run actual production logic. Mock external boundaries only when justified, and cover integration boundaries with the appropriate real/contract test. Do not require a live external service for every unit change.
- On failures, inspect production behavior and expected contract before changing assertions. Explain changed expectations when requirements changed; do not weaken tests to obtain green output.
- Test relevant invalid/error cases, not a mandatory negative companion for every positive assertion. Avoid fixed sleeps and accidental clock/random/environment dependencies.
- Use project-required thresholds; no universal coverage target, assertion-count cap or mock-size gate. Assess whether the test can catch the intended defect.

## Read only the relevant reference

| Task | Reference |
|---|---|
| Choose layer or boundary | `references/core-rules.md` |
| Design tests | `references/patterns.md` |
| Review a concrete test smell | `references/anti-patterns.md` |
| Agent needs test-authoring checks | `references/agent-guardrails.md` |
| Explicit TDD / test first / red-green-refactor | `references/tdd-loop.md` |
| Diagnose flaky tests | `references/flaky-discipline.md` |
| Investigate weak tests or plan scoped mutation analysis | `references/mutation-testing.md` |
| Playwright browser tests | `references/playwright-recipes.md` |
| Browser auth/CSRF/header boundary | `references/security-boundary.md` |
| Choose UI/network/performance workflow | `references/three-workflow-patterns.md` |

The task/PR may record behavior, owning layer and suite in ordinary prose. Do not demand magic preamble strings or a new approval merely to name an already-defined invariant. Ambiguous product behavior needs clarification; discoverable runner/suite choices do not.

## Verification

Use `dw-verify` for evidence validity and required delivery gates. Run affected tests while fixing, then complete invalidated required checks. Reuse equivalent passing evidence. Keep scenario-specific test discipline separate from generic CI/production policies.

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when tests target real behavior at the right layer, `FINDINGS` when test design gaps or anti-patterns remain, `BLOCKED` when the invariant or owning layer is unclear, `NOT_APPLICABLE` when no test work is in scope.
- **Scope:** invariant, owning layer, suite/file, and workflow (`author`, `review`, `debug`, `flaky`).
- **Evidence:** production behavior read, existing suite, execution output, anti-patterns, and guardrails checked.
- **Artifacts:** test file, matrix, flaky quarantine note, mutation/coverage result, or QA log.
- **Decisions:** placement, mock/real-system boundary, snapshot classification, and negative companion.
- **Risks:** false confidence, flakiness, mock drift, implementation-detail coupling, or weak assertions.
- **Next Step:** exact test edit, verification command, or clarification needed.

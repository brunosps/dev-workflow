---
name: dw-testing-discipline
description: Use when authoring, reviewing, or debugging tests — enforces Six Iron Laws (behavior over mocks, push to lowest layer, fix prod first on red, real systems gate merge), 25 anti-patterns, 7 AI agent gates, and flaky-test discipline so tests reveal bugs instead of decorating CI.
---

# Testing Discipline

> **Inspired by** [`pedronauck/skills/testing-boss`](https://github.com/pedronauck/skills/tree/main/skills/mine/testing-boss) (MIT). Six Iron Laws, positive/anti-pattern catalogs, AI agent gates, and flaky-test taxonomy adapted from Pedro Nauck's work. The browser security-boundary and three-workflow-patterns references additionally cite [`addyosmani/agent-skills/browser-devtools`](https://github.com/addyosmani/agent-skills) (MIT), and Playwright recipes carry over from earlier dev-workflow work.

## Cardinal Premise

> Tests exist to expose defects, not to keep CI green.
> A test that fails has done its job.
> A test that passes for the wrong reason is worse than no test.

## Six Iron Laws

```
1. Test the behavior, never the mock.
2. Push every test to the lowest layer that can detect the failure.
3. When a test fails, fix production first — change the test only after writing why.
4. Real systems gate the merge. Mocks isolate; they do not validate.
5. Coverage is a flashlight. Mutation score is a quality probe. Neither is a target.
6. No test-only methods, branches, or flags leak into production code.
```

Each law has nuance — read `references/iron-laws.md` for the full version with examples.

## Required Reading Router

| Task | MUST read |
|------|-----------|
| Deciding where a test belongs | `references/iron-laws.md` (Law 2 deep-dive) |
| Writing new tests | `references/positive-patterns.md` |
| Reviewing / debugging tests | `references/anti-patterns.md` |
| Test authored by an AI agent | `references/ai-agent-gates.md` + `references/anti-patterns.md` |
| Flaky tests appeared | `references/flaky-discipline.md` |
| Browser-based E2E with Playwright | `references/playwright-recipes.md` |
| Browser security boundary testing | `references/security-boundary.md` |
| Picking the right test workflow (UI vs network vs perf) | `references/three-workflow-patterns.md` |

## Twelve positive patterns (one-liners, full version in references/positive-patterns.md)

1. Query by behavior and accessible role; never CSS selectors or DOM indices.
2. Selector hierarchy: role → label → text → test-id → structural (stop at highest rung that disambiguates).
3. Wait on observable conditions; never wall-clock sleeps.
4. Each test independent and order-free; setup over teardown.
5. One behavior per test; as many assertions as that behavior needs.
6. Names read like specifications: `should <outcome> when <condition> given <state>`.
7. Table-driven / parameterized when inputs vary.
8. Build test data via factories; literal blobs only for fields under test.
9. Mock at boundaries you don't control; real wiring for owned systems.
10. Real systems gate final merge; contract tests bridge unit and E2E.
11. Mutation score, not coverage percentage, measures suite strength.
12. Page Object Model is a tool, not a religion — collapse for small suites.

## Five anti-pattern families (25 total, full catalog in references/anti-patterns.md)

**Brittleness** — tests bound to internals:
- Implementation-detail selectors, internal-structure assertions, testing private methods, snapshot-as-test, vague existence assertions, action-without-assertion.

**Flakiness** — tests randomizing verdicts:
- Static sleeps, test order dependency, non-deterministic inputs (clock, RNG, locale).

**Mock misuse** — tests testing the test setup:
- Asserting the mock exists, mock drift, over-mocking children, incomplete mocks, mocking wrong level.

**Process** — team and suite pathologies:
- Coverage-as-vanity, happy-path-only, eternal `beforeAll`, cleanup in `afterEach`, magic strings, testing third-party sites, quarantine-as-cemetery, retry-as-fix, duplicate tests across layers, weakening tests to make them pass, mock-driven confidence.

**AI-specific** — agent failure modes:
- The seven failure modes that gates in `ai-agent-gates.md` block.

## Seven AI agent gates (mandatory when an agent writes tests)

These are mandatory pre-conditions whenever an LLM produces test code. Each gate is a forcing function against a specific LLM tendency:

1. **Invariant first** — agent prints `INVARIANT: …`, `OWNING_LAYER: …`, `EXISTING_SUITE: …` before any code.
2. **Owning layer** — extend an existing suite; reject new files without a named invariant.
3. **Real execution** — every test runs against real DB / real route / real external integration at least once before merging.
4. **Failure → fix production** — on a red test, the next move reads production code, NOT the test. Document the analysis before changing either.
5. **No snapshot without contract** — classify the artifact as `PRODUCT_CONTRACT` or `IMPLEMENTATION_DETAIL`. The latter forbids snapshots.
6. **No assertion on self-set mock** — cannot assert on values the same test body wrote into the mock.
7. **Negative companion** — every positive assertion ships with a negative test for invalid input or failure mode.

Full prompt blocks and verification recipes in `references/ai-agent-gates.md`.

## Placement doctrine (tripwires)

Before writing test code:

- Name the invariant in **one sentence**. Fuzzy language signals unclear requirements — stop and clarify.
- Place the test at the **lowest layer** capable of detecting the failure when the invariant breaks.
- Reject tests where `(likelihood × blast-radius)` falls below the ten-minute-maintenance threshold (the test is more expensive to maintain than the bug would be to fix).

## Flaky discipline (tripwires)

- Quarantine flaky tests within ONE HOUR of detection. Assign a named owner within 24 hours with a fix-by date.
- Track `flaky_rate` as a first-class metric: SLO under 1–2%; alert at >5%.
- Real systems at the final gate: mock at unit; contract-test boundaries; real DB/queue/route at integration; near-zero mocks at E2E.

Full taxonomy in `references/flaky-discipline.md`.

## Cross-cutting red flags

Any of these in a PR triggers REJECTED in `/dw-code-review`:

- Mock setup larger than test logic.
- Test breaks when an internal method is renamed (not the public contract).
- Removing the assertion body leaves the test green.
- Test fails when run with `.only` in isolation.
- `sleep`, `Thread.sleep`, or `cy.wait(<number>)` appears.
- Selector contains CSS class, index, or `xpath`.
- Test asserts a third-party site is reachable.
- Snapshot diffs accepted without reading.
- Coverage percentage is the only metric quoted.
- Failing tests auto-retried until green; no investigation.
- Skipped/quarantined tests without named owner and fix-by date.
- Test depends on `new Date()`, `Math.random()`, or system locale.
- `afterEach` resets database (move to `beforeEach`).
- AI-written test has 6+ assertions and zero edge cases.
- Phrase "I'll mock this to be safe" appears in the diff.

## When NOT to use this skill

- General code review unrelated to tests.
- Library-specific debugging where the test is just a reproduction.
- Non-testing CI pipeline design (deploys, artifacts, secrets).
- Production observability and alerting.
- Single-line typo fixes in existing tests.

## Integration with dev-workflow commands

- `/dw-create-tasks` uses the placement doctrine — each test-adding task must name the invariant.
- `/dw-run-task` applies the 7 AI gates when generating tests as part of implementation.
- `/dw-code-review` runs the anti-pattern checks on diff hunks under test paths.
- `/dw-fix-qa` runs flaky-discipline taxonomy when retesting bugs.
- `/dw-run-qa` (UI mode) references `playwright-recipes.md` for concrete recipes.

## Why this skill exists

The previous bundled skill (`webapp-testing`) mixed Playwright recipes with two discipline references (`security-boundary`, `three-workflow-patterns`) added later. The discipline references were enterred in a tactical skill that the agent didn't reach for as doctrine.

This skill consolidates: doctrine at the top, Playwright recipes as one reference, security and workflow patterns as their own references. One skill, coherent voice, doctrine-first.

## Bottom line

> A test that cannot fail is decorative. A test that fails for the wrong reason is misleading. Build tests that fail for exactly one reason — the reason the invariant was violated — and trust them when they do. Mocks isolate. Real systems validate. Coverage shines a light. Mutation score grades the suite. Agents will reach for the mock and the snapshot; the gates here make them put both down. Tests reveal bugs, not just pass.

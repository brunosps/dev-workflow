# Seven AI agent gates — mandatory when an LLM writes tests

LLMs have characteristic failure modes when authoring tests. These gates are forcing functions for the seven most common.

Every test produced by an agent (via `/dw-run-task`, `/dw-bugfix`, `/dw-autopilot`, or any other code-generating flow) must pass all seven gates BEFORE the diff is presented for review.

## Gate 1: Invariant first

**The failure mode it blocks:** Agent writes 200 lines of test code without articulating what the test is supposed to prove.

**The gate:**

Before writing any test code, the agent prints:

```
INVARIANT: <one sentence: what behavior is true that the test verifies>
OWNING_LAYER: <unit | integration | contract | e2e>
EXISTING_SUITE: <path to existing test file the new test joins>
```

**Why it works:**
- "Invariant" forces specific behavior naming.
- "Owning layer" forces Law 2 (lowest detectable layer).
- "Existing suite" forces extending coverage rather than spawning new files.

**Verification:** In `/dw-code-review`, look for this 3-line preamble in the PR description or the commit body. Missing = REJECTED.

## Gate 2: Owning layer

**The failure mode it blocks:** Agent creates a new test file every time, scattering coverage across orphan files. Or, agent writes E2E tests for things unit could prove.

**The gate:**

The agent must:
1. Identify the existing test suite that owns the module under test.
2. Extend that suite, OR document why a new suite is needed (genuinely new module, new test pyramid layer).
3. Map the test to the right layer per Law 2.

**Verification:**
- New test file in PR but existing file covers the same module? REJECTED.
- E2E test for pure-logic invariant? REJECTED unless documented.
- Unit test for cross-service flow? REJECTED — push to integration/E2E.

## Gate 3: Real execution

**The failure mode it blocks:** Agent writes tests that mock everything. They pass green forever and validate nothing.

**The gate:**

Every test path the agent writes must, at SOME layer, run against real systems before the diff merges:

- Pure logic: unit only is fine.
- Code that touches DB: must have at least one integration test running real DB (testcontainers, ephemeral container, dedicated test DB).
- Code that calls external services: must have a contract test OR a sandbox-account smoke test.
- UI interactions: must have at least one E2E run on a real preview environment.

**Verification:** PR description must list the real-system runs that exercise the touched code. If no real-system path covers the change, REJECTED.

## Gate 4: Failure → fix production

**The failure mode it blocks:** Agent sees test red, modifies the test until green. Bug ships.

**The gate:**

When the agent encounters a failing test (its own or pre-existing):

1. Print: `INVESTIGATING FAILURE: <test name>`
2. Read production code in the path that produces the observed value.
3. Print: `ANALYSIS: <2-3 sentences on whether production is wrong, test is wrong, or invariant changed>`
4. Decide:
   - Production wrong → fix production.
   - Test wrong → fix test AND document the change in the commit body.
   - Invariant changed → update the test AND open an ADR if the change is a public contract change.

**Verification:** Every commit that changes a previously-green test must have an `ANALYSIS:` line in the commit body explaining the decision. Missing = REJECTED.

## Gate 5: No snapshot without contract

**The failure mode it blocks:** Agent reaches for `toMatchSnapshot()` whenever it doesn't know what to assert. Snapshot becomes the assertion. Drift goes unnoticed.

**The gate:**

Before adding a snapshot assertion, the agent classifies the artifact:

- **PRODUCT_CONTRACT**: a stable contract worth pinning (e.g., serialized output of a public API, schema of a stored record). Snapshot is appropriate. Document the classification.
- **IMPLEMENTATION_DETAIL**: HTML structure, internal representation, component tree shape. Snapshot is FORBIDDEN. Write specific assertions instead.

**Verification:** Snapshots in the diff without a classification comment = REJECTED. Snapshots classified as IMPLEMENTATION_DETAIL = REJECTED.

## Gate 6: No assertion on self-set mock

**The failure mode it blocks:** Agent writes `mockFn.mockReturnValue('X')`, then asserts `expect(mockFn()).toBe('X')`. Proves nothing.

**The gate:**

The agent cannot assert on values it directly fed into a mock. Assertions must be on:
- The OUTPUT of production code that consumed the mock.
- The SIDE EFFECTS (DB state, network calls, event emissions) caused by production code.
- The VISIBLE behavior (UI change, log line, response) the user/caller observes.

**Verification:** Diff analysis flags pairs where a literal value appears in BOTH a mock setup AND an assertion. Flagged = REJECTED unless the agent can show the value passed through production code.

## Gate 7: Negative companion

**The failure mode it blocks:** Agent writes happy-path-only tests. Edge cases, error paths, boundaries uncovered.

**The gate:**

Every positive assertion the agent writes ships WITH at least one negative companion:

- Asserting `createUser(validInput)` succeeds → also assert `createUser(invalidInput)` fails with a specific error.
- Asserting `parseDate(validString)` returns a Date → also assert `parseDate(invalidString)` throws/returns null.
- Asserting `transferFunds(...)` succeeds with sufficient balance → also assert it fails with insufficient balance.

**Verification:** A PR adding N positive assertions must add ≥1 negative assertion per public path. Imbalance >3:1 (positive:negative) on a public path = REJECTED.

## How the gates compose

Together, the seven gates produce tests that:
1. State what they prove (invariant first).
2. Live at the right layer (owning layer).
3. Exercise reality somewhere (real execution).
4. Reveal bugs when red (failure → fix production).
5. Assert specifically, not via snapshots (no snapshot w/o contract).
6. Assert outputs, not setup (no self-mock assertion).
7. Cover failures, not just success (negative companion).

A test passing all seven is a test worth running. A test missing any one is more likely to mislead than help.

## Override procedure

If an agent (or user) wants to skip a gate, they must:
1. State which gate is being skipped.
2. State why (one sentence).
3. Add a `// SKIP-GATE-N: <reason>` comment in the test.
4. Open a follow-up issue tracking the gap.

Without all four, the gate is enforced.

## Prompt block to include when invoking the agent

```
You are about to write tests. Before producing test code, complete the
seven-gate preamble:

INVARIANT: ___
OWNING_LAYER: ___
EXISTING_SUITE: ___

If you cannot complete these three lines, STOP and ask the user for
the requirement (do not invent an invariant).

Then, while writing tests:
- Real execution: name the real-system path covering this code.
- On red: investigate production before changing tests; print ANALYSIS.
- Snapshots: classify as PRODUCT_CONTRACT or IMPLEMENTATION_DETAIL.
- Assertions: never assert on values you fed into a mock.
- Coverage: every positive assertion needs a negative companion.

Tests that violate gates without explicit SKIP-GATE-N comments will be
REJECTED at review.
```

`/dw-run-task` and `/dw-bugfix` inject this prompt before generating test code.

## Why these seven and not more

These are the seven LLM failure modes empirically observed in test generation across multiple projects (per pedronauck/skills/testing-boss, MIT, plus dev-workflow internal observation). Other tendencies exist; they're either covered by the positive patterns (e.g., wall-clock waits) or have lower hit-rate.

If a NEW LLM failure mode appears that none of the seven catches, add a gate AND document the failure mode that motivated it. Don't add gates speculatively.

# Investigating weak tests with mutations

Use when an important behavior has weak evidence, when auditing tests, or when the approved testing strategy includes mutation analysis. Do not install a mutation framework for a copy edit or make every test change run a repository-wide campaign.

1. Name the behavior at risk and inspect its production path and tests. Select a bounded module and the existing runner. Confirm a clean baseline test run so unrelated failures are not misreported as detected mutants.
2. Run the installed mutation tool with an explicit source scope and inspect its execution status. If unavailable, a reversible deliberate defect in an isolated copy can probe one invariant; report it as a targeted experiment, not a complete mutation score. Never leave a deliberate defect in the delivery tree.
3. For a survivor, examine the changed expression, reachable inputs and expected observable result. Distinguish a missing assertion from equivalent behavior, unreachable code, exclusion, timeout or tooling failure. Report unassessed cases instead of calling them safe.
4. Add or strengthen a test only for a meaningful missing behavior. Derive expected values from requirements, fixtures or an independent oracle; do not repeat the algorithm under test. Ensure mocks match real module exports and API contracts. Assertions on shape, invocation or snapshots are useful only when that is the actual contract being protected.
5. Demonstrate that the selected defect is detected and the unmodified implementation passes. Record source scope, cases investigated, remaining limitations, command, tool version and report path. Do not weaken assertions, alter production semantics or exclude survivors just to improve a number.

Do not introduce a default mutation-score gate. Preserve existing project-required policy and raise a proposal if it needs revision. A run can succeed while reporting surviving mutants; a tool crash or zero selected files does not establish successful behavioral validation.

## Incremental execution

[StrykerJS incremental mode](https://stryker-mutator.io/docs/stryker-js/incremental/) reuses a prior report; it is not automatically selection of the current PR diff. Determine the PR base and intended source set separately. Include test changes and affected production scope. An empty selection must be explicitly justified.

Stryker's cache does not detect every dependency, configuration, snapshot or environment change. Invalidate reuse when those inputs affect results; use the installed version's supported force/full-scope mechanism. Preserve the unmutated dry run and check runner support for test-change detection. Reuse under `dw-verify` also requires valid input and environment evidence.

In CI, publish inspectable reports and distinguish infrastructure failures from investigated survivors. Select schedule and scope according to risk and measured cost. Broad campaigns belong in an agreed audit or scheduled job, not an implicit requirement on unrelated tasks.

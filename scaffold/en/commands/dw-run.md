<system_instructions>
# Execute approved tasks

Use `/dw-run` for all pending tasks, `/dw-run <task-id>` for one, and `/dw-run --resume` to continue. Inputs are the task ID and active `.dw/spec/<prd>/` directory. Tasks and dependencies must exist and be approved. For investigation without a plan use `/dw-bugfix`.

## Assignment and preparation

Read `.dw/references/execution-contract.md` and the relevant task file. Consume `execution-plan.json` when present; validate it with `node .dw/scripts/lib/workflow-contract.mjs validate <plan.json>`. Cross-check IDs/dependencies against tasks.md. Legacy schema 1.0 tasks without assignments execute locally. Never infer cross-tool authorization from installed CLIs alone.

Respect applicable constitution decisions and the task's requirement IDs (`FR-N.M` / `RF-N.M`). Missing constitution uses non-blocking defaults. Inspect relevant source and project rules; query `.dw/intel/` only when useful and check freshness. Do not require a full repository map before every task.

Load skills by need: `dw-verify` for evidence, `dw-memory` for relevant durable decisions/checkpoints, `dw-testing-discipline` when designing tests, `dw-ui-discipline` for UI, `dw-llm-eval` for AI behavior, `dw-execute-phase` for dependency/plan checks. Use `dw-search-first` for new dependencies and `dw-minimalism` for a concrete abstraction/scope decision, not before each new function. Use `dw-simplification` for an explicitly scoped cleanup after verification. For explicitly requested TDD/test first/red-green-refactor, use `dw-testing-discipline/references/tdd-loop.md` for that task.

## Execution loop

1. Arm `/dw-report` once (idempotent, skipped when `DW_REPORT_AUTO=off`). Validate task coverage, dependency graph and acceptance checks using `dw-execute-phase`; repair internal inconsistencies before execution, ask only for missing material decisions.
2. Choose the next task whose dependencies are complete on the execution branch. Independent tasks may run concurrently only with approved agents/worktrees and a defined integration path. One writer per worktree; coupled tasks stay sequential.
3. Use the approved task executor/model/effort/agents. Local assignments execute in the current workflow. Cross-tool assignments invoke `/dw-codex-run`, `/dw-claude-run`, or `/dw-copilot-run` with the prepared task packet. The parent owns the objective throughout.
4. Implement acceptance criteria with project patterns, tests from the approved strategy and necessary failure handling. When a worker returns, independently inspect diff and criteria; inspect/reuse valid evidence or run affected checks through `dw-verify`. Fix in-scope failures automatically, using the same external session when applicable.
5. Commit only scoped task changes after valid verification; retain atomic commits and requirement IDs. Include task status in the commit, then record its SHA in the `Commit` column of tasks.md and run-log.md. Commit remaining bookkeeping in the next task or final metadata commit; never `git add .` across unrelated changes.
6. Update `execution-state.json`, `active-session.md` and run-log.md with completed tasks, assignments, branch/worktree, exact sessions, verification and next step. Continue remaining approved tasks; `--checkpoint` explicitly requests a pause between waves.
7. After all tasks, run `/dw-review` for requirement coverage and code quality. Correct in-scope findings automatically; user decisions are needed only for scope changes or deferrals. Full implementation workflows continue to applicable `/dw-qa` and fixes under `/dw-goal` or the invoking orchestrator. A single-task request ends after that task's validated handoff.

## Resume and blockers

A resume request already authorizes continuation. Inspect saved state and actual worktree rather than asking “continue?” again. Keep completed tasks and approved assignments; validate dependencies and prior evidence. Recover missing session IDs only from task-specific logs with identity checks; otherwise reconstruct a new session in the same worktree without discarding changes. See execution-contract for cross-provider limitations.

Missing dependency: finish its pending approved task first; ask only if it is outside the plan. Verification failure: diagnose, fix and rerun invalidated checks. Missing test framework: discover the configured runner before asking. Increased complexity: record a deviation and split/reorder within approved scope. New product behavior, architectural conflict or unapproved dependency: propose the material change and wait only on dependent work. Preserve checkpoints at a real impasse or user pause.

## Completion report

Return completed task IDs and commit SHAs, affected files, valid checks, unresolved findings and next step. `/dw-review` writes `<prd-path>/QA/review-consolidated.md`. Durable state and logs remain in the spec directory; worker audit/session files stay outside disposable worktrees. A passed gate proves its scope only; never weaken assertions or hide a blocking finding. Merge, push and publication require applicable authorization.
</system_instructions>

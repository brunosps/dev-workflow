---
name: dw-execute-phase
description: "Use for task execution. Two agents: executor (wave-based parallel dispatch + deviation handling) and plan-checker (goal-backward verification). Invoked by /dw-run and /dw-autopilot."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# dw-execute-phase

Bundled skill providing **phase-level execution discipline** for dev-workflow: parallel task dispatch in waves, atomic commit per task, deviation handling mid-execution, and goal-backward plan verification before any execution burns context.

## Why a skill (not inline)

- The execution discipline (wave coordination, deviation rules, checkpoint protocol) is a separate concern from the commands that invoke it. Bundling it as a skill lets multiple commands (`/dw-run`, `/dw-autopilot`, `/dw-execute-phase` itself) reuse the same discipline.
- The plan-checker is a verification GATE — it must run before `/dw-run`/`/dw-execute-phase` mutate code, and bundling it makes that contract visible.
- The agents own the protocol; the orchestrating commands just wire them up.

## When to Use

Read this skill when:

- `/dw-execute-phase` is invoked to run a batch of tasks in parallel waves.
- `/dw-plan-checker` is invoked to verify a `tasks.md` file will achieve its PRD goal before execution.
- `/dw-run` needs dependency or plan verification for approved tasks.
- `/dw-autopilot` enters the execution stage (it gates on plan-checker before invoking the executor).

Do NOT use when:

- A single one-off change is being made (use `/dw-run` directly — no waves needed).
- The user is exploring/brainstorming, not executing (use `/dw-brainstorm`).
- The plan hasn't been created yet (use `/dw-plan tasks` first).

Read `.dw/references/execution-contract.md` for approved tool/model/agent assignments and durable state. Agent profiles below are available protocols, not mandatory additional dispatches.

## Agents

| Agent | Responsibility | Spawn from |
|-------|----------------|------------|
| `agents/executor.md` | Runs tasks in waves, atomic commit per task, handles deviations (3 deviation rules), respects checkpoint markers, writes `SUMMARY.md` per phase | `/dw-execute-phase`, `/dw-run` |
| `agents/plan-checker.md` | Goal-backward verification of `tasks.md` before execution. Checks: requirement coverage, task completeness, dependency soundness, artifact wiring, context budget. Returns PASS / REVISE / BLOCK. | `/dw-plan-checker`, `/dw-plan tasks` (auto-gate before declaring tasks ready) |

## How the Two Agents Compose

For how the two agents compose, read `references/how-the-two-agents-compose-detail.md`. Load only when this part of the task applies.

## Wave Concept

Tasks in `tasks.md` are grouped into **waves** by their `Depends on:` frontmatter:

- Wave 1: tasks with no dependencies → ready to run
- Wave 2: tasks that depend on Wave 1 → run after Wave 1 commits land
- Wave N: ...

Within a wave, concurrency is optional and follows approved assignments. One writer per worktree, at most 3 workers; dependent tasks share the execution branch sequentially.

The executor calculates waves automatically by topologically sorting task dependencies. See `references/wave-coordination.md`.

## Deviation Rules (during execution)

For deviation rules (during execution), read `references/deviation-rules-during-execution-detail.md`. Load only when this part of the task applies.

## Atomic Commit Protocol

Formal tasks use scoped atomic commits, with approved subtask milestones when specified:

```
feat(<scope>): <task title> (#<task-id>)

<one-line summary of what this commit delivers>

- Files added: <list>
- Files modified: <list>
- Tests added/updated: <list>
- Deviations: <link to deviations.md entry, if any>

Closes <REQ-ID> (partial — see tasks.md).
```

`<REQ-ID>` is copied verbatim from `tasks.md` — `FR-N.M` in English projects, `RF-N.M` in Portuguese ones. This skill is shared by both; never hardcode a prefix.

The commit message format is consistent across waves so `/dw-generate-pr` can build a clean PR body. See `references/atomic-commits.md`.

## De-Sloppify Pass (optional cleanup task)

For de-sloppify pass (optional cleanup task), read `references/de-sloppify-pass-optional-cleanup-task-detail.md`. Load only when this part of the task applies.

## Checkpoint Protocol

If the executor exhausts its context budget mid-phase OR the user signals stop:

- Write current progress to `.dw/spec/prd-<slug>/active-session.md` (last completed task, next task, blockers).
- Exit cleanly with status `CHECKPOINT`.
- Next invocation of `/dw-resume` reads this file and resumes from the last completed task.

## Files in `.dw/spec/prd-<slug>/`

| File | Read by | Written by |
|------|---------|------------|
| `prd.md` | plan-checker, executor | `/dw-plan prd` |
| `techspec.md` | plan-checker, executor | `/dw-plan techspec` |
| `tasks.md` | plan-checker (verifies), executor (executes) | `/dw-plan tasks` |
| `<NN>_task.md` | executor (per-task detail) | `/dw-plan tasks` |
| `deviations.md` | plan-checker (next iteration), executor | executor (rule 1/2 deviations) |
| `active-session.md` | `/dw-resume`, executor (continuation) | executor (checkpoint) |
| `SUMMARY.md` | `/dw-generate-pr` | executor (after final wave) |

## References

- `references/wave-coordination.md` — how the executor groups tasks into waves and dispatches them in parallel.
- `references/plan-verification.md` — the 6-dimension goal-backward analysis the plan-checker performs.
- `references/atomic-commits.md` — commit message format, deviation entry format, when to use Edit vs Write.

## Rules

- **No execution without plan-checker PASS.** `/dw-execute-phase` and `/dw-run` must call plan-checker first; repair internal REVISE findings; BLOCK only when a material decision or invalid dependency remains.
- **Scoped atomic commits for formal tasks.** Follow approved subtask milestones when specified; direct small edits do not invoke this protocol. This drives traceability and revert safety.
- **Deviations are recorded, not silenced.** Every adjustment beyond the plan goes in `deviations.md` with reason.
- **Checkpoint > timeout.** When context budget is low, checkpoint cleanly rather than running tasks half-way.
- **Wave order is topological, not user-defined.** The executor computes wave boundaries from `Depends on:` fields; concurrency limits queue ready tasks without inventing dependencies.

## Inspired by

Adapted from [`get-shit-done-cc`](https://github.com/gsd-build/get-shit-done) (`gsd-executor`, `gsd-plan-checker`) by gsd-build (MIT license). Core protocols (goal-backward verification, atomic commits, deviation handling, checkpoint resume) preserved. Path conventions changed from `.planning/<phase>/` to `.dw/spec/prd-<slug>/`. SDK CLI calls (`gsd-sdk query init.execute-phase`) replaced by inline operations. The companion `gsd-debugger` agent (1452 lines) was NOT ported — its scope overlaps with the existing `/dw-bugfix` and `/dw-qa --fix` commands.

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when plan-check and execution wave complete, `FINDINGS` when deviations or failed tasks remain, `BLOCKED` when plan-check returns `REVISE`/`BLOCK`, `NOT_APPLICABLE` when no task execution is in scope.
- **Scope:** PRD/spec slug, wave, tasks, dependencies, and agent roles.
- **Evidence:** plan-check verdict, task files read, command outputs, and deviation notes.
- **Artifacts:** changed files, task memory, checkpoint, deviations report, or commits.
- **Decisions:** wave ordering, task split, and accepted deviations.
- **Risks:** dependency drift, uncommitted work, skipped verification, or partial checkpoint.
- **Next Step:** next task, commit, checkpoint, or revision needed.

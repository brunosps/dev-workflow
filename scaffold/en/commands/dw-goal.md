<system_instructions>
You are the dev-workflow durable goal orchestrator. This command gives every supported agent a Codex-style long-running objective contract: one objective, explicit checkpoints, formal commands, persistent state, and a verifiable stopping condition.

## When to Use
- Use when a workflow is larger than one normal turn but has a clear finish line.
- Use after `/dw-plan` when implementation, review, QA, and post-QA review should run as one durable loop.
- Use from `/dw-autopilot` after the first invocation has completed PRD → TechSpec → Tasks.
- Do NOT use for loose backlogs, unrelated task lists, or exploratory brainstorming.

## Position in Pipeline
**Predecessor:** `/dw-plan` or `/dw-autopilot` plan phase | **Successor:** `/dw-commit` + `/dw-generate-pr`

## Modes

| Invocation | Behavior |
|------------|----------|
| `/dw-goal "<objective>"` | Create and execute a manual durable goal. |
| `/dw-goal --from-autopilot <prd-slug>` | Create and execute the standard autopilot execution-quality goal for an existing PRD. |
| `/dw-goal status` | Show the active goal, checkpoint, last verification, and blockers. |
| `/dw-goal pause` | Mark the active goal paused without deleting state. |
| `/dw-goal resume` | Resume the paused or interrupted goal from `status.json`. |
| `/dw-goal clear` | Clear the active goal only after it is complete, cancelled, or explicitly replaced. |

## Native Codex Bridge

<critical>`/dw-goal` is portable. The canonical state lives in `.dw/goals/` even when Codex native `/goal` is available.</critical>

Official Codex guidance treats `/goal` as an experimental durable objective for long-running work with a verifiable stopping condition. In Codex CLI it requires `features.goals`; it can be set with `/goal <objective>`, inspected with `/goal`, and controlled with `/goal pause`, `/goal resume`, or `/goal clear`.

When running in Codex:
- If a native goal tool is available, create/update it with a short objective pointing to `.dw/goals/<slug>/goal.md`.
- If the interactive `/goal` slash command is available and `features.goals` is enabled, use `/goal <objective>` with an objective under 4,000 characters.
- If native goals are unavailable, continue with the portable `.dw/goals/` loop. Do not block.

Native Codex objective format:

```text
Execute the durable goal defined in .dw/goals/<goal-slug>/goal.md until its verifiable stopping condition is met. Update .dw/goals/<goal-slug>/progress.md after every checkpoint.
```

## Persistent State

Create `.dw/goals/<goal-slug>/` with:

```
.dw/goals/<goal-slug>/
├── goal.md
├── status.json
└── progress.md
```

`goal.md` MUST include:
- One objective.
- In scope / out of scope.
- Input artifacts to read first.
- Checkpoints in order.
- Formal `/dw-*` commands to invoke.
- Required artifacts per checkpoint.
- Verifiable stopping condition.
- Block conditions.
- Resume policy.

`status.json` MUST use this shape:

```json
{
  "schema_version": "1.0",
  "slug": "goal-prd-example",
  "source": "manual",
  "prd_path": null,
  "status": "active",
  "current_checkpoint": "start",
  "completed_checkpoints": [],
  "required_artifacts": [],
  "last_verification": null,
  "created_at": "2026-05-20T00:00:00Z",
  "updated_at": "2026-05-20T00:00:00Z"
}
```

`progress.md` is append-only. Each entry records checkpoint, command invoked, result, artifacts verified, blockers, and next checkpoint.

## Autopilot Goal

When invoked as `/dw-goal --from-autopilot <prd-slug>`:

1. Resolve `<prd-slug>` to `.dw/spec/<prd-slug>/`.
2. Verify `prd.md`, `techspec.md`, `tasks.md`, per-task files, and `tasks-validation.md` exist.
3. Create goal slug `autopilot-<prd-slug>`.
4. Write `goal.md` with this objective:

```text
Complete implementation and quality validation for .dw/spec/<prd-slug> without stopping until run, full review, QA/fix, and post-QA full review are all formally complete and verified.
```

Checkpoints:

| Checkpoint | Formal command | Completion evidence |
|------------|----------------|---------------------|
| `run` | `/dw-run <prd-path>` | Tasks done, task commits present, run log or task status updated. |
| `review-before-qa` | `/dw-review <prd-path>` | `<prd-path>/QA/review-consolidated.md` exists and overall verdict is approved or approved with explicit non-blocking caveats. |
| `qa` | `/dw-qa <prd-path>` | Required QA artifacts exist. |
| `qa-fix` | `/dw-qa --fix <prd-path>` when `bugs.md` has Open bugs | Bugs are Fixed/Closed or explicitly deferred by user. |
| `review-after-qa` | `/dw-review <prd-path>` | Consolidated review exists after QA fixes and is approved or approved with explicit non-blocking caveats. |

The goal is complete only when:
- All checkpoints above are complete or explicitly skipped with a documented reason.
- No Open QA bug remains unless the user explicitly accepted deferral.
- The final `/dw-review` ran after the last QA fix.
- `status.json` has `"status": "complete"`.

## Execution Rules

<critical>Every checkpoint that invokes a `/dw-*` command MUST invoke the formal command and follow its complete `.dw/commands/` instructions. Manual equivalents do not count.</critical>

- Before each checkpoint, append a `progress.md` entry and update `status.json.current_checkpoint`.
- After each checkpoint, verify required artifacts with `ls` or equivalent inspection before marking complete.
- If a command fails, fix according to that command's own loop, then re-run it.
- If the same blocker repeats for 3 consecutive goal turns and no meaningful progress is possible, mark `status: "blocked"` and surface the blocker.
- Keep progress updates compact: current checkpoint, verification result, remaining checkpoints, blocker if any.

## Status Commands

- `status`: read `status.json` and last 10 entries of `progress.md`; report current checkpoint, completed checkpoints, last verification, and blockers.
- `pause`: set `status: "paused"` and append why.
- `resume`: set `status: "active"` and continue from `current_checkpoint`; do not repeat completed checkpoints unless artifacts are missing.
- `clear`: if complete/cancelled/replaced, mark `status: "cancelled"` or archive according to project convention. Do not delete evidence by default.

## Anti-patterns

- Do not create a goal with multiple unrelated objectives.
- Do not use `/dw-goal` to bypass `/dw-plan`; goals execute a defined plan, they do not invent scope.
- Do not mark a checkpoint complete without checking artifacts.
- Do not use native Codex `/goal` as the only state; `.dw/goals/` remains the cross-agent contract.

</system_instructions>

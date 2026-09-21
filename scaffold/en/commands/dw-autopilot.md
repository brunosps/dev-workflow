<system_instructions>
# Continuous implementation orchestrator

`/dw-autopilot "<wish>"` plans and carries approved work through implementation and validation. `/dw-autopilot --from-prd <slug>` starts from `.dw/spec/<slug>/prd.md`; missing PRD blocks with its path. `/dw-autopilot` without a wish resumes saved state. Do not impose a second invocation after task approval. A user request only to plan or an active platform Plan mode still ends at the planning artifact.

## Planning

1. Inspect relevant source/rules and existing decisions. Use `.dw/intel/` when useful; research only unknown technologies/domains/integrations. Brainstorm only unresolved choices, not a mandatory three-option interview.
2. Invoke `/dw-plan` or its relevant stages to produce PRD, TechSpec, tasks and tasks-validation.md. Reuse answered decisions and aligned handoffs. Ask material uncovered questions with the available interview tool; do not re-ask discovered facts.
3. At task breakdown present local/cross-tool development, concrete model/effort and relevant agents by task complexity. Follow `.dw/references/execution-contract.md`, write/validate execution-plan.json, and obtain approval of the same task/assignment matrix. Existing stage approvals remain honored; do not repeat them.
4. Save `autopilot-state.json` with `status: plan_complete`, `current_step: goal`, planning artifacts, approved assignments path and `next_command: /dw-goal --from-autopilot <slug>`. In an implementation request continue immediately to execution. In a planning-only request report the plan and preserve this resume point.

## Execution and delivery

Arm `/dw-report` once (idempotent, skipped when `DW_REPORT_AUTO=off`). Invoke `/dw-goal --from-autopilot <slug>` to own `/dw-run` → full `/dw-review` → applicable `/dw-qa` → `/dw-qa --fix` for Open bugs → post-QA review when edits or new findings invalidate the prior review. Do not substitute coverage-only review for the full review. External runners return to the parent for corrections and continuation; they do not end the goal.

Use `dw-memory` for durable decisions and `dw-verify` for valid evidence. Security Gate remains mandatory where applicable: `/dw-secure-audit` produces `.dw/secure-audit/audit-summary.md`; missing/invalid evidence is regenerated and blocking findings are fixed. SECRET findings always block (no ADR escape). Reuse a valid scan instead of repeating it solely at another checkpoint.

The goal completes only with acceptance criteria met, required review/QA artifacts and valid checks, and no unresolved blocking finding. For escalated `prd-bugfix-*`, find the originating `.dw/bugfixes/*/escalated.md`, produce missing SUMMARY.md from evidence, and close the index.

Inspect scoped task commits and remaining bookkeeping; `/dw-commit` handles an authorized final commit when needed. Do not create empty commits or demand an extra commit for already committed work. Prepare the validated branch/worktree and delivery summary. Merge, push and PR publication proceed only within existing authorization. If final authorization is absent, present the concrete result and request only that action; do not re-ask permission already granted.

## Durable state

Preserve `autopilot-state.json` fields: mode, wish, prd_path, from_prd_slug, current_step, completed_steps, skipped_steps, skip_reasons, gates_passed, step_artifacts, goal_slug, next_command, started_at, last_updated. Add `execution_plan` and `execution_state` paths. Record evidence, not merely file existence, before marking a step complete.

| status | Resume action |
|---|---|
| missing / planning | Continue only unfinished planning; preserve resolved decisions. |
| plan_complete | Execute approved plan through `/dw-goal --from-autopilot <slug>` when implementation is requested. |
| goal_active | `/dw-goal resume` using saved task/executor state. |
| goal_complete | Prepare delivery and remaining authorized commit/publication actions. |
| completed | Report validated delivery and links/branch; publication may still be pending authorization. |

Update state after each checkpoint. Report current task, evidence and remaining work compactly. Preserve checkpoints on user pause or actual blocker; fix recoverable in-scope failures and continue.
## Stops

This command runs under `.dw/references/automode.md`: the invocation authorizes its full flow, and the
stops below are the complete set. Anything not listed here continues. Each stop persists
`autopilot-state.json`, reports the exact question with the resume command, and exits `BLOCKED` — a clean
early exit, not a failure.

1. `--from-prd <slug>` names a PRD that does not exist.
2. The task/assignment matrix has not been approved.
3. The security gate returns REJECTED, or a SECRET finding appears (no ADR escape).
4. A review finding is `high`/`critical` with no ADR justifying it.
5. A task dependency is outside the approved plan.
6. Merge, push or publication is reached without the applicable authorization.
7. A floor invariant would have to be crossed (`.dw/references/invariants.md`).

A planning-only request is not a stop — it is the requested end state; report the plan and keep the resume
point.

</system_instructions>

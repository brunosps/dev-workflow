# Task execution contract

Read during task breakdown, dispatch, or resume. The parent coordinates the approved plan through validation; runner return is a handoff, not the end of the objective.

## Planning assignments

Choose development locally or across tools at `/dw-plan tasks`, not on every dispatch. Present a task matrix with complexity, rationale, tool, model, effort, agents, dependencies, and checks. Use `light` for mechanical low-risk work, `standard` for known patterns with bounded decisions, and `heavy` for architecture, uncertainty, or sensitive surfaces. File counts and commit types alone do not determine complexity.

Use `.dw/config/routing.json` as model candidates, not proof of availability. Inspect installed CLI version/help for flags and supported configuration; use provider documentation or available model metadata for model IDs. Help/version alone does not prove authentication or account access. Preserve explicit model choices. Prefer configured models that satisfy the task; propose upgrades when useful, citing source/date. Local agents inherit the current session model unless an explicit task override is supported and approved. Do not choose an arbitrary different tier just to call a review independent.

Claude orchestration can propose `codex` (`/dw-codex-run`), Codex can propose `claude` (`/dw-claude-run`). Copilot/OpenCode retain local execution and may use explicitly selected adapters. Keep coupled/small work local unless the user chooses otherwise. Use only installed, relevant agents; no mandatory fan-out. Validate agent names against `.dw/agent-registry.json` and the installed profiles.

Alongside tasks.md and the per-task Markdown, write `execution-plan.json`:

```json
{
  "schema_version": "1.1",
  "approved": false,
  "tasks": [{
    "id": "1.0",
    "depends_on": [],
    "execution": {
      "complexity": "standard",
      "rationale": "Known service pattern; bounded behavior change",
      "tool": "local",
      "model": "inherit",
      "effort": "inherit",
      "agents": [],
      "fallbacks": []
    }
  }]
}
```

For external tools resolve concrete model/effort before approval. Fallback entries contain `tool`, `model`, `effort`; only approved alternatives may be used. Validate with `node .dw/scripts/lib/workflow-contract.mjs validate <plan.json>` and cross-check the IDs/dependencies against tasks.md. Mark `approved: true` only after user approval of the same assignments; record the approval in the plan's decision log. Changed assignments require approval unless explicitly requested or covered by an approved fallback. An agent-authored boolean is a record, not independent proof of consent.

Resolution precedence: current explicit user instruction → approved task assignment → project configuration → tool default. For a saved plan, configuration/defaults are used to propose missing assignments, never silently replace approved ones. Model rejection uses an approved fallback or blocks with evidence; no unapproved provider change. Plans at schema 1.0 without execution metadata run locally; do not force a migration or retroactive delegation decision.

## Dependency and worktree ownership

For WRITE dispatch create a dedicated worktree through `/dw-worktree create`. Record its starting revision and branch. Tasks in a dependency chain use the same execution branch/worktree, with one writer at a time, even when successive tasks select different CLIs. The next task sees completed dependency commits on that branch; never create it afresh from main. Use separate worktrees for independent tasks only when the approved plan defines how their branches will be integrated before dependent work. Do not merge into the owner's branch merely to move to the next task.

Stage only scoped changes. Commit implementation and task status together; then record the resulting SHA in tasks.md/run-log (a SHA cannot include itself in its own commit). Include that bookkeeping in the next scoped commit or final metadata commit; leave no unreported dirty bookkeeping at delivery. Do not amend or stage unrelated files automatically.

## Durable state and resume

Persist `execution-state.json` beside the plan, with schema_version `1.1` and a `tasks` object keyed by task ID. Each entry records the approved assignment, worktree, branch/base revision, provider session ID, audit/prompt paths, attempt, status, checkpoint, commit SHA, and verification records. Store audit/session files outside disposable worktrees. Update before dispatch and after every handoff; preserve completed work on interruption.

Resume inspects saved task identity, actual diff, branch, dependencies, and evidence before continuing. Keep the approved executor and session. If its sidecar is absent, recover the exact session from that task's audit log and verify provider/worktree/task identity. Never blindly use `--last` or `-c`. If the ID cannot be recovered, start a new session in the same worktree from the approved task, state, diff and logs; record loss of conversational context. A session from one provider cannot be resumed by another provider. Never reset/clean partial work to retry.

## Completion and authorization

The worker implements and checks its task, then returns evidence and unresolved findings. The parent independently inspects the diff and acceptance criteria, verifies evidence validity, sends in-scope corrections to the same worker, and continues dependencies. No new confirmation is needed for an already approved run/resume or ordinary corrections. Only material scope changes, unavailable approved alternatives, permission restrictions, and unresolved product/architecture decisions block dependent work; continue independent authorized work when possible.

Review quality rests on acceptance criteria and blocking findings, not a numeric score. Reuse verified check output for equivalent inputs/environment/scope; rerun affected checks after edits. Finish required project checks at delivery. Merge, push and publication remain separate authorization boundaries. Without that authorization, report the prepared branch/worktree and validated result.

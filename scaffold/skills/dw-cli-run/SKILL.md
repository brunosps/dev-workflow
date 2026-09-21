---
name: dw-cli-run
description: Execute an approved task through a Codex, Claude or Copilot CLI adapter, with isolated Git work, durable sessions and a reviewed handoff.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# CLI task execution

Use with `dw-codex-run`, `dw-claude-run`, or `dw-copilot-run`. The command supplies the adapter table; without it return `BLOCKED`. Read `.dw/references/execution-contract.md` for task assignments, dependency branches and resume state in an installed workflow. For standalone explicit runner requests, the user's prompt/spec supplies the assignment and authorized scope; do not require an unrelated PRD.

## Adapter slots

`DISPATCH`, `STREAM`, `MODEL`, `EFFORT`, `AUTO`, `AUTO_READONLY`, `NO_MCP`, `RESUME <id>`, `SESSION_ID`, `DONE_SIGNAL`, `USAGE` describe the provider interface. `AUTO` means the approved non-interactive permission configuration, not blanket permission bypass. Check the installed CLI's help before substituting flags. A CLI version does not prove credentials or model access.

## Isolation and permissions

- a WRITE dispatch runs **only** inside a **dedicated git worktree**. Create through `/dw-worktree create <slug>` when missing. Check the target is a secondary worktree and the CLI cwd matches it.
- A READ-ONLY dispatch MAY run in the main checkout when effective tool permissions prevent writes. When in doubt, treat it as WRITE. Never pass an auto-approve flag on a dispatch declared READ-ONLY.
- Worktrees isolate Git state, not the filesystem, network, credentials or other processes. Preserve platform permissions. Permission bypass is not a default and cannot be justified by a worktree alone.
- One writer per worktree. Dependent tasks use the same execution branch sequentially; independent branches require a planned integration path.
- Workers do not merge or push. The parent prepares the reviewed delivery and acts on separate integration/publication authorization.

## Execute and continue

1. Resolve the assignment from the approved task matrix; `.dw/config/routing.json` only supplies candidates for missing choices. Use current explicit instructions before saved assignments. Do not re-ask approved model/effort choices. An unavailable model uses only an approved fallback, otherwise report the exact blocker.
2. Read the task prompt, relevant source and constraints. Check dependencies exist on the execution branch. Give the worker acceptance criteria, file scope, verification commands, permission boundaries, and a stopping condition: implemented and verified, or a concrete blocker. No recursive dispatch to another implementation CLI.
3. Persist assignment, task identity, attempt, worktree/base, prompt and audit paths in `execution-state.json`. Store logs and session sidecars outside disposable worktrees. Capture the stream and final report; never discard error output. Do not claim the stream exposes private reasoning or every internal event.
4. Run in a background process or bounded agent supported by the host. No mandatory extra agent layer. Read `references/dispatch-tuning.md` only for permission/MCP tuning, diagnostics or escalation.
5. Persist the exact provider session ID. On resume, verify task/provider/worktree identity from state and audit. Missing sidecar: recover that task's session from its log; if unrecoverable, start a fresh session in the same worktree with the task, diff and checkpoint. Never blindly resume the latest session. Never reset/clean partial work to retry.
6. Completion requires the terminal event, process outcome, and inspected files/report. A completed turn is not proof of task success. Poll the process handle or task notification; searching for the worktree path with `pgrep` can match the observer itself.
7. Parent re-gate (independent): the parent re-gates by inspecting diff, acceptance criteria and blocking findings, and validating worker evidence with `dw-verify`. Reuse equivalent evidence rather than mechanically repeating the same suite. Send in-scope corrections to the same worker and continue approved dependent tasks.
8. Keep model/effort on normal corrections. Escalate only on demonstrated capability limits to a supported, approved alternative. A numeric score is optional diagnostic information, never an acceptance gate. At an impasse preserve work, report the blocker, and continue independent authorized tasks.

WRITE runs arm `/dw-report` once (`armed_by: dw-cli-run`) (idempotent, skipped when `DW_REPORT_AUTO=off`). On cancellation stop only the recorded task handle/PID, preserve files and logs, and disarm reporting. Never remove a worktree to kill its worker or walk up the process tree. The parent uses `/dw-worktree merge <slug>` for authorized merge and cleanup in the same turn (end-of-life); KEEP worktrees remain intact.

## Stops

The dispatch is authorized by the approved task assignment; it is not re-asked. The owning command
enumerates its complete stop list, and every stop follows `.dw/references/automode.md`: persist the
worktree, audit log and session sidecar, report the exact question with the supported resume command, and
exit `BLOCKED`. A stop is a successful run that ended early — the failure mode is continuing past a
blocker by inventing a way around it.

## Structured Return

- **Status:** `PASS` task acceptance and required checks satisfied; `FINDINGS` corrections remain; `BLOCKED` unavailable executor, permissions or unresolved decision; `NOT_APPLICABLE` no CLI execution in scope.
- **Scope:** task, worktree/branch/base, provider, model, effort, agents and permission mode.
- **Evidence:** inspected diff, acceptance checks, verification records, process outcome and durable audit path.
- **Artifacts:** changed files, commits, exact provider session ID and sidecar, execution state, report.
- **Decisions:** approved assignment/fallback used, corrections, session recovery or new-session reason.
- **Risks:** outstanding findings, partial work, missing checks or lost conversational context.
- **Telemetry:** observed tokens, elapsed time and command counts when available; label unavailable fields, never estimate billing from undocumented fields.
- **Next Step:** parent review/correction/next task, or concrete blocker; merge/push only under applicable authorization.

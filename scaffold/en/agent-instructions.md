<!-- dev-workflow:start -->
# dev-workflow — Agent instructions

Use the smallest workflow that satisfies the user's intent and risk. Continue authorized work through implementation, relevant verification, and correction of failures. User instructions and existing authorization take precedence over workflow defaults; platform permissions still apply.

## Routing

| Intent and scope | Action |
|---|---|
| Explanation, code lookup, or exploration | Inspect relevant sources and answer directly. |
| Small, clear, low-risk edit | Implement directly and verify proportionally. |
| Bug requiring investigation | `/dw-bugfix`; a known small fix can stay inline. |
| Feature needing specification | `/dw-plan`; for an end-to-end implementation request, continue after task approval. |
| Multi-component implementation through validation | `/dw-autopilot`; approve the task/execution plan, then continue in the same invocation. |
| Unresolved product or architecture decisions | `/dw-brainstorm`, then `/dw-plan` when aligned. Use council only when multiple perspectives help the decision. |
| Execute approved tasks | `/dw-run`; `/dw-goal` for durable execution. |
| Resume existing work | `/dw-resume` or `/dw-run --resume`; reuse saved decisions and evidence. |
| Review / QA / commit / PR explicitly requested | `/dw-review` / `/dw-qa` / `/dw-commit` / `/dw-generate-pr`. |

Do not start a second pipeline inside an active workflow. A request only to plan or investigate ends with the requested artifact. Increased file count or effort is not itself a reason to stop: reorganize within approved scope and ask only about material new scope, conflicting requirements, or missing decisions.

For specialized commands consult `.dw/references/command-routing.md` or `/dw-help`. Do not load the full catalog for routine work.

## Planning and delegation

During task breakdown, propose local or cross-tool development and a model, effort, and agent assignment for each task based on ambiguity, dependencies, risk, and scope. Read `.dw/references/execution-contract.md` at this stage and when executing/resuming the plan. Approval covers these assignments and declared fallbacks for the run.

Claude can delegate implementation through `/dw-codex-run`; Codex can use `/dw-claude-run`. The parent owns review, corrections, and continuation. Local agents inherit the session model unless the approved task overrides it. Delegate bounded independent work when it improves quality or time; keep tightly coupled or small work local. At most 3 workers per workstream, and never concurrent writers in the same worktree.

Read relevant files first. Use `.dw/intel/` or a code-explorer for broad or unfamiliar flows when useful, checking index claims against current source. Load skill entrypoints only for matching tasks, and references only for the selected mode. Subagents receive a compact packet and return evidence and decisions, not full logs.

## Completion and boundaries

An approved implementation plan continues through implementation, review, QA where applicable, and fixes. Do not stop merely because the first implementation is ready or an external runner returned. Reuse decisions already resolved in the conversation. Preserve partial work and durable checkpoints on interruption.

A ready delivery meets acceptance criteria, has no unresolved blocking finding, and has valid verification evidence. Evidence stays valid while its inputs, environment, and scope remain equivalent; a new message does not invalidate it. Follow `dw-verify` at delivery gates. Do not add tests for low-impact edits just to satisfy a template.

Merge, push, publication, and destructive operations require applicable authorization; do not ask again when already authorized. Prepare and validate the concrete result before requesting a missing final authorization. A worktree isolates Git changes, not operating-system permissions.

## Project contracts

- Respect `.dw/constitution.md`; high/critical deviations need the defined ADR process. Missing constitution does not block: use non-blocking defaults.
- Approved task plans need valid dependencies and `tasks-validation.md`; repair internal inconsistencies before asking for approval.
- Complete project-required checks. Security and PR gates remain applicable; secrets and unresolved blocking findings cannot be hidden by a score or a green build.
- Formal task execution retains scoped atomic commits and requirement traceability. Direct small edits do not imply a commit or PR request.

## Customization

This managed block lives between `<!-- dev-workflow:start -->` and `<!-- dev-workflow:end -->` markers and is refreshed on update. Put project-specific instructions outside the markers; do not duplicate the entire block. Configuration and explicit project overrides remain authoritative for their scope.
<!-- dev-workflow:end -->

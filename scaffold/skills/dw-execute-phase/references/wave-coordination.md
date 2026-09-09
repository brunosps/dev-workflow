# Dependency scheduling

Read for multi-task execution. Parse `Depends on:` from tasks.md and cross-check execution-plan.json. Topologically order tasks; reject cycles and missing task IDs. The installed workflow-contract helper can validate the JSON graph and return ready tasks.

A wave is a set of ready tasks, not a requirement to spawn parallel agents. Run at most 3 approved workers per workstream, limited further by host capacity. Serialize writers sharing a worktree. Do not introduce fake dependencies to enforce a concurrency limit; queue ready work instead.

Dependent tasks use the same execution branch and see dependency commits before starting, even when successive tasks use different CLIs. Independent worktrees require a planned integration path before dependent work and authorization for that integration. Without it, run sequentially on the execution branch. Do not merge into the owner's branch solely to progress.

Each writer owns scoped task changes and its commit. Parent updates consolidated state after handoffs; avoid concurrent edits to shared tasks.md. Commit IDs need not follow numeric task order when tasks are independent. A failed task blocks its dependents; independent authorized tasks can continue.

Resume from execution-state.json and actual completed commits, not `last_completed_task + 1`: tasks may finish out of order. Revalidate dependency/evidence state and preserve approved assignments. See `.dw/references/execution-contract.md` for session identity and bookkeeping.

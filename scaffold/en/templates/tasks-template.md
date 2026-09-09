---
type: tasks-index
schema_version: "1.1"
status: draft
---

# Implementation Tasks Summary for [Feature]

## Branch

```
feat/prd-[feature-name]
```

## Impacted Projects

- [ ] [Project 1]
- [ ] [Project 2]

## Tasks

| Task | Description | Depends on | FRs | Status | Commit |
|------|-------------|------------|-----|--------|--------|
| 1.0 | [Title] | none | FR-1.1, FR-1.2 | Pending | — |
| 2.0 | [Title] | 1.0 | FR-2.1 | Pending | — |
| 3.0 | [Title] | 1.0, 2.0 | FR-3.1, FR-3.2 | Pending | — |

`Commit` holds the short SHA written back by `/dw-run` when the task closes (step 6). It is what makes a task's diff findable later — leave `—` until the task commits.
`Depends on` is the dependency graph consumed by `/dw-run`; write `none` when a task has no dependency.

## Progress

- [ ] 1.0 Main Task Title        Depends on: none
- [ ] 2.0 Main Task Title        Depends on: 1.0
- [ ] 3.0 Main Task Title        Depends on: 1.0, 2.0

## Execution plan

Propose local or cross-tool development per task during breakdown. Summarize complexity/rationale, tool, model/effort, agents, dependencies and verification. Store validated assignments and approved fallbacks in `execution-plan.json`; use `.dw/references/execution-contract.md`. Record approval of the same matrix before execution.

## Workflow

1. `/dw-run` consumes the approved assignments in dependency order.
2. Each task implements, verifies and commits scoped changes; the parent reviews external-worker handoffs and routes corrections.
3. Continue approved implementation through final review and applicable QA. A planning-only request ends at the plan.
4. Prepare the validated delivery; integrate/push/publish only within existing authorization.

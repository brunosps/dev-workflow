---
type: tasks-index
schema_version: "1.0"
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

| Task | Description | FRs | Status | Commit |
|------|-------------|-----|--------|--------|
| 1.0 | [Title] | FR-1.1, FR-1.2 | Pending | — |
| 2.0 | [Title] | FR-2.1 | Pending | — |
| 3.0 | [Title] | FR-3.1, FR-3.2 | Pending | — |

`Commit` holds the short SHA written back by `/dw-run` when the task closes (step 6). It is what makes a task's diff findable later — leave `—` until the task commits.

## Progress

- [ ] 1.0 Main Task Title
- [ ] 2.0 Main Task Title
- [ ] 3.0 Main Task Title

## Workflow

Each task follows this flow:
1. `/execute-task [N]_task.md` - Implements the task
2. Unit tests included in the implementation
3. Commit at the end of each task (no push)
4. Next task or `/dw-generate-pr [target-branch]` when all tasks are completed

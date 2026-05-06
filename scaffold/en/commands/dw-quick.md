<system_instructions>
You are a quick task executor. This command exists to implement one-off changes with workflow guarantees (validation, atomic commit) without requiring a full PRD.

<critical>This command is for small, well-defined changes. If the change needs multiple tasks, redirect to `/dw-create-prd`.</critical>
<critical>ALWAYS run tests and validation before committing. Workflow guarantees are mandatory even for quick tasks.</critical>

## When to Use
- Use for small changes that don't justify the full pipeline (PRD -> TechSpec -> Tasks)
- Use for hotfixes, config adjustments, dependency updates, one-off refactors
- Use when invoked after `/dw-brainstorm --onepager` and the one-pager carries `[IMPROVES]` classification with an MVP Scope fitting in ≤3 files (skip-PRD path)
- Do NOT use for new features with multiple requirements (use `/dw-create-prd`)
- Do NOT use for complex bugs (use `/dw-bugfix`)

## Pipeline Position
**Predecessor:** (user's ad-hoc need) | **Successor:** `/dw-commit` (automatic)

## Complementary Skills

| Skill | Trigger |
|-------|---------|
| `dw-verify` | **ALWAYS** — invoked before the commit. Even small changes require a VERIFICATION REPORT PASS (minimal test + lint) before the atomic commit. |

## Input Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{DESCRIPTION}}` | Description of the change to implement | "add loading spinner to dashboard" |

## Required Behavior

1. Read `.dw/rules/` to understand project patterns and conventions
2. **If a one-pager exists** at `.dw/spec/ideas/<slug>.md` and was passed as input, read it first. If classification is `[IMPROVES]` and MVP Scope fits in ≤3 files, proceed. If `[NEW]` or `[CONSOLIDATES]` with larger scope, warn and redirect to `/dw-create-prd`.
3. Summarize the change in 1-2 sentences and confirm scope with the user
4. If the change seems too large (>3 files, >100 lines), warn and suggest `/dw-create-prd`
5. Implement the change following project conventions
6. Run relevant existing tests (unit, integration)
7. Run lint if configured in the project
8. Invoke `dw-verify` and include the VERIFICATION REPORT in the output before committing. Without PASS, DO NOT commit.
9. Create atomic semantic commit with the change

## Task Tracking

<critical>Every `/dw-quick` execution writes a tracking entry to `.dw/spec/quick/<slug>.md` so the change is discoverable later.</critical>

Tracking format (single file per quick task):

```markdown
---
type: quick-task
schema_version: "1.0"
status: COMPLETE | PARTIAL | ABORTED
date: YYYY-MM-DD
files_touched: [...]
commit: <SHA>
---

# Quick Task — <slug>

## Description
<one-line description from the user's prompt>

## Files
<list>

## Verification
<dw-verify report excerpt>
```

Subsequent `/dw-intel` queries surface these via the file index.

## Codebase Intelligence

If `.dw/intel/` exists, query before implementing:
- Internally run: `/dw-intel "implementation patterns in [target area]"`
- Follow the patterns found

If `.dw/intel/` does NOT exist:
- Use only `.dw/rules/` as context (or grep directly if `.dw/rules/` is also absent)

## Response Format

### 1. Scope
- Change: [description]
- Affected files: [list]
- Estimate: [small/medium]

### 2. Implementation
- File-by-file changes

### 3. Validation
- Tests run: [result]
- Lint: [result]

### 4. Commit
- Message: [semantic commit]

## Closing

At the end, inform:
- Change implemented and committed
- Whether to push or continue with more changes

</system_instructions>

# Scoped atomic commits

Formal tasks use atomic commits, with approved subtask milestones and final bookkeeping where specified. This drives traceability (a task's diff is `git show <sha>`), revert safety (`git revert <sha>` undoes one task without affecting others), and PR clarity (`/dw-generate-pr` builds a clean changelog from the per-task commits).

## Commit message format

Strict format. No deviations.

```
<type>(<scope>): <task title> (#<task-id>)

<one-line summary>

- Files added: <comma-separated list, or "none">
- Files modified: <comma-separated list, or "none">
- Tests added/updated: <comma-separated list, or "none">
- Deviations: <link to deviations.md entry, or "none">

Closes <REQ-ID> (partial — full close on tasks.md completion).
```

<critical>`<REQ-ID>` is the requirement ID exactly as `prd.md` and `tasks.md` write it. English projects use `FR-N.M`; Portuguese projects use `RF-N.M`. This skill is shared by both — copy the ID verbatim, never assume a prefix.</critical>

### Field rules

**`<type>`** — Conventional Commits:

| Type | Use |
|------|-----|
| `feat` | New user-facing capability (default for most PRD tasks) |
| `fix` | Bug fix discovered during the phase (rare in `/dw-execute-phase`; common in `/dw-qa --fix`) |
| `refactor` | Code reshape without behavior change |
| `test` | Tests-only task |
| `docs` | Docs-only task |
| `chore` | Tooling, config, build (rare in PRD-driven phases) |

**`<scope>`** — module name from project rules. If the task touches `src/auth/`, scope is `auth`. If the task touches multiple modules, pick the dominant one or use a coarse scope (`api`, `core`, `web`).

**`<task title>`** — copy from `tasks.md` task line. Imperative, concise. "Add login endpoint", not "Added login endpoint" or "Adding login endpoint".

**`(#<task-id>)`** — the task ID from `tasks.md` (`#1.0`, `#2.3`). This is what makes the commit findable from the task index — `/dw-run` writes the resulting SHA back into the `tasks.md` Commit column.

**`<one-line summary>`** — one sentence answering "what does this commit deliver?". Different from the title (which is the task title); this is the OUTCOME.

**File lists** — explicit. `src/routes/users.ts, src/services/users.ts, src/schemas/user.ts`, not "user-related files".

**Deviations link** — `.dw/spec/prd-<slug>/deviations.md#deviation-03-1` if the task triggered a Rule 1 or 2 deviation.

**Closes line** — `Closes <REQ-ID> (partial — full close on tasks.md completion)` because one task usually doesn't fully close a requirement; the whole phase does. Final task in the phase changes "(partial — ...)" to "(full)". If the task closes more than one requirement, list them comma-separated.

## Examples

Both examples come from an English project (`FR-`); a Portuguese project writes `RF-` in the same slots.

```
feat(auth): wire JWT middleware to all /api/* routes (#4.0)

Authenticated routes now reject requests without valid Bearer tokens.

- Files added: src/middleware/auth.ts, src/middleware/auth.test.ts
- Files modified: src/server.ts, src/routes/index.ts
- Tests added/updated: src/middleware/auth.test.ts (12 cases — happy path, expired, malformed, missing)
- Deviations: none

Closes FR-4.1 (partial — full close on tasks.md completion).
```

```
test(orders): add integration tests for order creation flow (#7.0)

Covers happy path, payment failure, inventory mismatch.

- Files added: tests/integration/orders.test.ts
- Files modified: none
- Tests added/updated: tests/integration/orders.test.ts (8 cases)
- Deviations: .dw/spec/prd-checkout-v2/deviations.md#deviation-08-1

Closes FR-7.2 (partial — full close on tasks.md completion).
```

## Verification before commit

Use `dw-verify`: complete applicable project-required checks and acceptance criteria. Reuse evidence only for equivalent inputs, environment and scope. After failure diagnose and fix in scope, rerun affected checks, and complete invalidated required gates. Do not invent lint/build scripts or repeat checks solely because a commit is next.

## Edit vs Write

When implementing the task:

| Use Edit when | Use Write when |
|---------------|----------------|
| Modifying an existing file | Creating a new file |
| Changing 1-30 lines | Replacing a file completely |
| You have line context (the file is in your context) | The file is small and a Write is cleaner than 5 Edits |

Use available file-editing tools safely; preserve content outside the task scope.

## Multi-file tasks

If a task touches 5+ files, that's still one commit. Stage all files (`git add <list>`) then `git commit`. The body's `Files added:` / `Files modified:` lists must include every file.

Use approved subtask commit milestones when specified. Propose only material changes to the intended task boundaries.

## Commit signing

If `git config commit.gpgsign true` is set, signing is on by default — let it run. Do NOT pass `--no-gpg-sign` from the executor. If signing fails (key missing), surface the error; do NOT bypass.

## What NOT to commit

- `.env` files (even if the task touched them — they should be gitignored already; if not, that's a separate task)
- IDE artifacts (`.vscode/settings.json` user prefs, `.idea/`)
- OS junk (`.DS_Store`, `Thumbs.db`)
- Unrelated changes accidentally in the working tree (executor should `git status` before adding to confirm only the task's files)

Preserve unrelated changes and stage only scoped files. Ask only when they conflict with the task or ownership cannot be determined; unrelated WIP alone is not a blocker.

## Deviation entry format (referenced from commits)

`.dw/spec/prd-<slug>/deviations.md`:

```markdown
# Deviations — <prd-slug>

## DEVIATION-<TASK_NN>-<RULE_NUMBER>: <title>

- **Task:** <NN> — <task title>
- **Rule:** 1 (auto-add) | 2 (ambiguity) | 3 (architectural conflict)
- **Description:** <1-3 sentences>
- **Files affected:** <list>
- **Resolution:** <what was done; "PAUSED awaiting input" for Rule 2; "BLOCKED — re-plan" for Rule 3>
- **Commit:** <SHA, filled when task commits; empty if Rule 2/3>
```

The plan-checker reads `deviations.md` from the previous run when re-verifying after revision — patterns of recurring Rule 1 deviations indicate the planner is missing a project convention that should be in `.dw/rules/`.

## Final bookkeeping

Record task status with the implementation, then store the resulting SHA in tasks.md/run-log. Include leftover bookkeeping in the next scoped commit or a final metadata commit through `/dw-commit`. Do not amend automatically, create empty commits, or change version/CHANGELOG without maintainer authorization. PR generation uses these commits; it is a separately authorized action.

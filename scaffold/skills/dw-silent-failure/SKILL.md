---
name: dw-silent-failure
description: Checklist for finding swallowed errors, dangerous fallbacks, and lost failure context during review or bugfixes.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# dw-silent-failure

Use during `/dw-review`, `/dw-bugfix`, and `/dw-qa --fix` when failures may be hidden instead of surfaced.

## Hunt List

- Empty `catch` blocks.
- Fallbacks such as `catch(() => null)` or `catch(() => [])`.
- Log-only handling where callers need the failure.
- Generic rethrows that lose stack or input context.
- Async work launched without awaiting, tracking, or explicit detachment.
- Network/database/filesystem calls without timeout or rollback where the project requires it.

## Reporting Standard

Only flag a finding when you can name:

- the exact location,
- the trigger,
- the hidden bad outcome,
- the minimal fix.

Inspired by ECC's `silent-failure-hunter`; adapted as both a skill and a dispatchable `dw-silent-failure-hunter` agent.

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when no concrete silent-failure risk is found, `FINDINGS` when at least one named risk exists, `BLOCKED` when failure paths cannot be inspected, `NOT_APPLICABLE` when no fallible control flow is in scope.
- **Scope:** files/functions, failure paths, async boundaries, and IO surfaces inspected.
- **Evidence:** exact location, trigger, hidden bad outcome, and current handling behavior.
- **Artifacts:** review finding, bugfix task, regression guard, or log/trace path.
- **Decisions:** why the issue is concrete enough to flag or why it is an explicit pass.
- **Risks:** swallowed errors, false success, lost stack/context, untracked async work, or unsafe fallback.
- **Next Step:** minimal fix or verification proving the pass.

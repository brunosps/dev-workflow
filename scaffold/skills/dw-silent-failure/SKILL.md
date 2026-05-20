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

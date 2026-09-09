## De-Sloppify Pass (optional cleanup task)

LLM implementers are thorough but leave slop — tests of framework/language behavior, defensive checks the type system already enforces, leftover `console.log`, over-handled impossible states. Constraining the implementer with "don't over-engineer" degrades its output unpredictably; a **separate cleanup pass in a fresh context** works better. Two focused agents beat one constrained agent.

To request one, a task in `tasks.md` may carry `Cleanup After: <N>` in its frontmatter. The executor runs it as its own task (own commit) right after task N's wave lands, scoped to task N's diff:

- Remove tests that assert language/framework behavior rather than business logic.
- Remove type checks and guards the type system or a prior validation already guarantees.
- Remove `console.log`/debug prints and commented-out code.
- Keep every business-logic test and every real error path — when unsure, keep it.

The cleanup task commits as `refactor(<scope>): de-slop <task N title>` and must leave the gate green (lint + tests + build) — it never changes behavior. Opt-in: no `Cleanup After:` means no cleanup task runs.

---
name: dw-simplification
description: Use when simplifying code. Chesterton's Fence (WHY first), behavior-preserving refactor, complexity metrics, deep-modules analysis. Triggers from /dw-review, /dw-refactor, and /dw-brainstorm refactor-audit.
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
  - Glob
---

# dw-simplification

Behavioral discipline for simplifying code without breaking it. The trap of refactoring is removing something that "looked unused" but was load-bearing for an edge case nobody documented. This skill enforces a protocol that prevents that class of regression.

## When to Use

Read this skill when:

- `/dw-review --code-only` flagged a complexity issue (deep nesting, long function, duplication).
- `/dw-refactor` or `/dw-brainstorm` dispatched **refactor-audit** and proposed a simplification target.
- The user explicitly asks to "clean this up" / "simplify X".
- During `/dw-run` if the implementation accidentally produced complex code that wants pre-commit cleanup.

Do NOT use when:

- The complexity is intentional (e.g., performance hot path with optimization comments — leave alone).
- You're simplifying code you didn't just write or read recently — scope creep.
- Tests are missing for the area — without tests, "preserve behavior exactly" is unverifiable. Add tests first, then simplify.

## The Five Rules

For the five rules, read `references/the-five-rules-detail.md`. Load only when this part of the task applies.

## Pattern recognition

For pattern recognition, read `references/pattern-recognition-detail.md`. Load only when this part of the task applies.

## Rule of 500 — automate large refactors

If a simplification touches >500 lines, **don't do it manually**. Use:

- AST-based codemods (`jscodeshift` for JS/TS, `libcst` for Python, Roslyn for C#, `rust-analyzer` for Rust).
- IDE-driven refactoring tools (Rename Symbol, Extract Method, Inline Variable).
- Search-and-replace ONLY when the pattern is unambiguous and verifiable.

Manual edits across hundreds of lines are how subtle bugs creep in.

## Refactor risk levels

Before removing or restructuring, categorize by blast radius and act in that order — never all at once:

| Risk | Examples | Discipline |
|------|----------|-----------|
| **SAFE** | Unused exports, unused deps, unreachable branches | Batch-remove, run the gate after each batch, commit |
| **CAREFUL** | Consolidate duplicates, extract/inline, rename symbol | One or two per commit; re-read callers first |
| **RISKY** | Change a public API, alter a data structure, extract a layer | One per commit; regression tests first; pair review / ADR |

Start with SAFE and graduate only after the gate is green. For finding SAFE candidates on JS/TS (and other ecosystems), see `references/dead-code-tools.md`. This composes with Chesterton's Fence (Rule 1) — a tool calling code "unused" still needs the WHY check before deletion (reflection, dynamic imports, and framework entry points are invisible to static analysis).

## Verification protocol

Before committing the simplification:

```
1. Lint passes:    pnpm lint  / ruff check  / dotnet format --verify-no-changes  / cargo clippy
2. Tests pass:     pnpm test  / pytest      / dotnet test                         / cargo test
3. Build passes:   pnpm tsc --noEmit / mypy / dotnet build                         / cargo check
```

All three GREEN. If any is RED, the simplification broke something — revert or fix.

For changes that altered cyclomatic complexity, optionally run a complexity analyzer to confirm the metric actually improved (some "simplifications" make code more complex by spreading it).

## How `dw-code-review` uses this

In the formal Level 3 review (post-Level 2 chain from `dw-review-implementation`), code-review flags complexity issues using the patterns above. Each flagged issue references this skill: "consider simplifying via guard clauses; apply Chesterton's Fence — verify why the nested check exists before flattening."

## How `/dw-refactor` / refactor-audit uses this

`/dw-refactor` and the refactor-audit mode dispatched by `/dw-brainstorm` catalog code smells (Fowler vocabulary) AND run the deep-modules analysis (`references/deep-modules.md`) against the target area. For each smell or shallow-module flag, the proposed refactor cites:

1. Which simplification rule applies (early return / extract method / lookup table / etc.).
2. Whether Chesterton's Fence concerns block the refactor (existing tests inadequate? no recent commits explaining the structure? → flag as YELLOW, don't act).
3. Whether the deep-modules test points the other way (some "code smells" are actually deep-module wrappers that absorb complexity; the fix is to make the wrapper deeper, not to flatten it).

## Anti-patterns

1. Simplifying code you didn't read carefully. The "obvious dead code" is often someone's hard-won bug fix.
2. Skipping the test gate "because the change is small". Small changes break things too.
3. Changing whitespace + naming + structure in one commit. Atomic: each commit one kind of change.
4. Refactoring while touching unrelated code (mix-in scope creep). Open a separate task.
5. Personal-style refactors disguised as simplification. Project conventions > your preferences.

## References

- `references/chestertons-fence.md` — the protocol in detail; case studies of "obvious-but-wrong" removals.
- `references/complexity-metrics.md` — when each metric (cyclomatic, cognitive, depth, fanout) actually matters; how to measure cheaply.
- `references/behavior-preserving.md` — characterization tests, refactor with test gate, rollback patterns, codemod tooling per language.
- `references/deep-modules.md` — high-leverage modules behind small interfaces; deletion test, locality, leverage, seam, adapter diagnostic; anti-patterns (shallow wrapper, god-module). Invoked by `/dw-refactor` and `/dw-brainstorm` refactor-audit mode.
- `references/dead-code-tools.md` — per-ecosystem tools that surface SAFE-tier dead-code candidates (knip/depcheck/ts-prune for JS/TS; vulture/ruff for Python; deadcode/staticcheck for Go; cargo-udeps for Rust). Candidates still pass Chesterton's Fence before deletion.

## Inspired by

Adapted from [`addyosmani/agent-skills/code-simplification`](https://github.com/addyosmani/agent-skills) by Addy Osmani (MIT license). Core principles (Chesterton's Fence, behavior preservation, scope discipline, Rule of 500) preserved. dev-workflow integration: invoked by `/dw-review`, `/dw-refactor`, and `/dw-brainstorm` refactor-audit mode via Complementary Skills.

The deep-modules reference is adapted from [`mattpocock/skills/improve-codebase-architecture`](https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture) by Matt Pocock (MIT license). Core framing (deep modules = high leverage at small interface, deletion test, shallow-wrapper anti-pattern) preserved; paths and integration points rebased on dev-workflow conventions.

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when simplification is safe and justified, `FINDINGS` when concrete refactor opportunities exist, `BLOCKED` when behavior or ownership is unclear, `NOT_APPLICABLE` when no simplification/refactor scope exists.
- **Scope:** module, smell, complexity signal, and behavior boundary.
- **Evidence:** code paths read, metrics, duplication, tests, and Chesterton's Fence rationale.
- **Artifacts:** refactor recommendation, characterization test plan, codemod plan, or task list.
- **Decisions:** simplify now, defer, split, preserve, or reject.
- **Risks:** behavior drift, shallow wrapper churn, missing tests, or broad blast radius.
- **Next Step:** smallest behavior-preserving refactor or prerequisite guard.

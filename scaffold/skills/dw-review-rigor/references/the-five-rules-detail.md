## The Five Rules

### 1. De-duplicate before writing

If the same pattern (e.g., missing null check, unhandled error, magic constant) appears in multiple files, **create one finding** for the most representative instance and list the other affected files inside its body. Do not create N identical findings for N files sharing one root cause.

Example — wrong:
```
- [HIGH] src/a.ts:14 — missing null check on user
- [HIGH] src/b.ts:22 — missing null check on user
- [HIGH] src/c.ts:31 — missing null check on user
```

Example — right:
```
- [HIGH] Missing null check on `user` in 3 places.
  Representative: src/a.ts:14
  Also affects: src/b.ts:22, src/c.ts:31
  Fix: add `if (!user) return` at function entry.
```

### 2. Severity-order the output

Always present findings in this order: **critical → high → medium → low**. Inside each severity, order by impact or blast radius, not by file path.

Severity definitions:
- **critical** — correctness bug, security hole, data loss, unavailability.
- **high** — material deviation from PRD/TechSpec, concurrency hazard, significant perf regression, missing error handling on a user path.
- **medium** — maintainability cost that will hurt the next change, missing edge-case handling, inconsistent with project rules.
- **low** — stylistic, naming, minor readability. Often omit unless pattern-level.

### 3. Verify intent before flagging

Before creating a finding, check whether the pattern is intentional:
- adjacent comment explaining the choice?
- ADR in `.dw/spec/*/adrs/` that justifies it?
- test coverage that asserts the behavior?
- rule in `.dw/rules/` that permits it?

If the code looks suspicious but has a clear justification (e.g., `// intentionally ignoring close error on read-only handle`), do NOT create a finding. Only flag patterns that are genuinely problematic, not merely unconventional.

### 4. Skip what linters already catch

Before writing findings, ensure the project's linter/formatter has run. Anything the configured linter would flag is NOT a finding in this review — it is a linter task. Save human attention for issues linters cannot find (logic, architecture, security, requirements).

If the linter cannot run (missing tooling, build errors), note that in the summary and proceed with the review.

### 5. Signal over volume

Aim for fewer, higher-quality findings.

- Keep ALL `critical` and `high`.
- If total findings exceed 20, prune `medium` and `low` to the most impactful ones.
- A review with 8 precise findings is more useful than one with 30 that includes marginal concerns.

**Also note well-implemented aspects.** They inform the summary and calibrate tone — but they do not produce findings.

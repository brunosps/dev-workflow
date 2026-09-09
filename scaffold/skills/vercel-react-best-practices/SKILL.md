---
name: vercel-react-best-practices
description: Use for React/Next.js performance optimization. 67 rules across async, bundle, client, render, JS micro-perf. Triggers on React components, Next.js pages, data fetching, perf review, hydration issues.
allowed-tools:
  - Read
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 67 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## Quick Reference

For quick reference, read `references/quick-reference-detail.md`. Load only when this part of the task applies.

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

## References

- `references/perf-discipline.md` — workflow discipline (measure → identify → fix → verify → guard) that wraps the per-rule recipes above. Use when tackling performance work; cite the metric and tool before applying any rule. Adapted from [`addyosmani/agent-skills/performance-optimization`](https://github.com/addyosmani/agent-skills/tree/main/performance-optimization) (MIT).

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when selected rules are evidence-backed and verified, `FINDINGS` when React/Next.js performance issues remain, `BLOCKED` when baseline metrics or app context are missing, `NOT_APPLICABLE` when no React/Next.js performance surface is in scope.
- **Scope:** route/component, framework mode, metric, and selected rule category.
- **Evidence:** baseline measurement, trace/profile/build output, rule references, and affected code paths.
- **Artifacts:** recommendation, code path, perf log, bundle report, or guard test.
- **Decisions:** rule selected, metric target, and rejected optimizations.
- **Risks:** premature optimization, hydration mismatch, cache staleness, bundle bloat, or rerender regressions.
- **Next Step:** measure, apply rule, verify, or add regression guard.

---
name: dw-source-grounding
description: "Use when citing frameworks or libraries. Detect → Fetch → Implement → Cite with [source: url, version, retrieved]. Triggers on every framework decision in techspec, deps audit, research."
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - WebFetch
---

# dw-source-grounding

Behavioral protocol for grounding decisions in **versioned, official documentation** — and citing those sources verifiably. Used by `dw-create-techspec`, `dw-deps-audit`, `dw-deep-research` whenever a decision depends on what a framework or library actually does at the version installed in the project.

## Why this skill exists

Decisions made on hallucinated APIs or 2-year-old Stack Overflow answers cause silent breakage. The cost shows up later — code that "worked in testing" because the agent matched an older version's API, then breaks in production where the real version is different. This skill enforces a four-step protocol that prevents that class of failure.

## When to Use

Read this skill when:

- A command needs to recommend a library/framework version (`dw-deps-audit` brainstorm phase).
- A command must propose architectural patterns that depend on framework specifics (`dw-create-techspec`).
- A command is researching a topic that has version-specific answers (`dw-deep-research`).
- You're about to cite an API, CLI flag, configuration option, or behavior — and you want the citation to be verifiable later.

Do NOT use when:

- The decision doesn't depend on external documentation (e.g., naming a variable inside a single function).
- The library/framework version is irrelevant to the answer (e.g., "use a hash map for O(1) lookup").
- You're writing examples that are intentionally generic / pseudocode.

## The Protocol — Detect → Fetch → Implement → Cite

For the protocol — detect → fetch → implement → cite, read `references/the-protocol-detect-fetch-implement-cite-detail.md`. Load only when this part of the task applies.

## How `dw-create-techspec` uses this

Before writing the "Architectural Decisions" section, the techspec command:

1. Lists every framework/library decision the techspec depends on (e.g., "use Server Actions for mutations").
2. For each, runs the protocol: detects version, fetches official doc, cites verifiably.
3. Writes each decision as: `<decision> — <one-line rationale> — [source: ...]`.

If the protocol can't reach official docs (offline, paywall, dead link), the techspec prefixes the decision with `⚠ training-data fallback` so the human reviewer knows to verify.

## How `dw-deps-audit` uses this

In the brainstorm phase (Conservative/Balanced/Bold per package), each option's "target version" cites the source where that version's release notes were checked. This catches the "agent recommends v5 because it sounds modern, but v5 dropped Node 18 support" class of error.

## How `dw-deep-research` uses this

Already does multi-source research; gains the citation discipline. Each finding line ends with a `[source: ...]` block. The output report's bibliography is built from these citations automatically.

## Anti-patterns

1. Citing Stack Overflow as primary source. (Use as DISCOVERY, then fetch the official doc the SO answer points to.)
2. Citing "the docs" without a URL. The whole point is verifiability.
3. Citing a doc URL that isn't pinned to a version (e.g., `react.dev` instead of `react.dev/reference/react?version=18`).
4. Pretending knowledge is current when it's training data. Mark unverified.
5. Citing your own previous answer in this session as authority. The chain has to terminate at an external source.

## References

- `references/citation-protocol.md` — exact format of `[source: ...]` blocks; how to consolidate multiple citations in a single decision; how to track citation freshness over time.
- `references/source-priority.md` — full hierarchy with examples; when secondary sources are acceptable.
- `references/freshness-check.md` — how to validate a doc URL still applies to the version in use; how to detect doc drift between when you fetched and when the user reads the artifact.

## Inspired by

Adapted from [`addyosmani/agent-skills/source-driven-development`](https://github.com/addyosmani/agent-skills) by Addy Osmani (MIT license). Core protocol (Detect → Fetch → Implement → Cite) and source authority hierarchy preserved. dev-workflow integration: invoked by `dw-create-techspec`, `dw-deps-audit`, `dw-deep-research` via Complementary Skills, and citation format aligned with our existing report frontmatter conventions (`type: ...`, `schema_version: ...`).

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when the decision is source-grounded and cited, `FINDINGS` when citations are stale/weak, `BLOCKED` when required sources cannot be fetched, `NOT_APPLICABLE` when no external/source-sensitive decision exists.
- **Scope:** decision, library/API/version, and source priority tier.
- **Evidence:** URL, version, retrieval date, source tier, and quoted/paraphrased facts.
- **Artifacts:** citation block, TechSpec/ADR entry, dependency note, or research report.
- **Decisions:** accepted source, rejected source, and freshness judgment.
- **Risks:** stale docs, unofficial authority, version mismatch, or uncited assumptions.
- **Next Step:** fetch stronger source, cite, defer, or mark unverified.

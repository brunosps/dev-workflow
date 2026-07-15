---
name: dw-domain-modeling
description: "Internal domain-vocabulary protocol for the native Grill flow. Loaded by /dw-brainstorm (grill mode) and referenced by /dw-analyze-project to keep canonical vocabulary: challenge fuzzy or overloaded terms, propose precise canonical names, stress-test with concrete edge-case scenarios, cross-check terms against the code, and persist resolved terms safely and lazily into .dw/domain (glossary for a single context, context-map plus per-context files for many). Rare ADR policy. Pipeline-internal, never exported, never implements code."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
---

# dw-domain-modeling — canonical vocabulary, kept in .dw/domain

The vocabulary layer of the native Grill flow. It keeps the language of the domain sharp: one canonical term per
concept, fuzzy language challenged, overloaded terms split, every term cross-checked against the code. Resolved
terms persist to `.dw/domain/**` — **never** to root `CONTEXT.md` and **never** into the auto-generated
`.dw/rules/` module files (those describe what the code IS; the glossary is human-curated vocabulary).

> **Internal protocol.** Loaded by `/dw-brainstorm --mode=grill`; read and linked (never regenerated) by
> `/dw-analyze-project`. Not standalone, not exported to the à-la-carte plugin.

## The disciplines

1. **Canonical vocabulary — one term per concept.** When several words compete for the same idea, pick the best
   and record the rest as discouraged synonyms. The glossary's job is to end the debate, not catalogue it.
2. **Challenge fuzzy / overloaded terms.** When the user says "the user thing" or uses one word for two
   concepts (`User` the account vs `User` the person), stop and propose precise names. Don't pretend to
   understand — push back until the term is sharp.
3. **Stress-test with concrete scenarios.** Force precision with edge cases: *"A guest checks out without an
   account — is that a Customer or a Visitor?"* Vague answers become the next grill question.
4. **Cross-check against the code.** Before recording a term, confirm it against the codebase. Surface
   contradictions with the file and line: *"You call it `Subscription`, but `src/billing/plan.ts:12` models it
   as `Plan`. Which is canonical?"* Don't argue from generalities.
5. **Persist safely, lazily, and only when authorized.** Create a `.dw/domain/**` file only **after** a term is
   resolved AND the Grill flow has write authorization. No speculative files; no writing an unresolved term.
6. **Route single vs multi context.** One bounded context → one flat `.dw/domain/glossary.md`. Multiple contexts
   (the same word means different things in billing vs shipping) → `.dw/domain/context-map.md` plus one
   `.dw/domain/contexts/<slug>.md` per context. Full routing + format: `references/glossary-format.md`.
7. **ADR rarely, and only on approval.** Vocabulary decisions are not ADRs. Reach for an ADR only on the
   three-criterion test, and only with separate explicit user approval — see `references/adr-policy.md`.

## Native artifacts

| Path | When |
|---|---|
| `.dw/domain/glossary.md` | Single bounded context — the default. |
| `.dw/domain/context-map.md` | Two or more contexts — names the contexts and the terms that cross or clash. |
| `.dw/domain/contexts/<slug>.md` | Per-context glossary, one file per context. |

All created **lazily**: the directory and file appear only when the first term in that context is resolved and
authorization exists. `/dw-analyze-project` **reads and links** these when present and must **preserve** them —
never regenerate or overwrite `.dw/domain/**`.

## What a glossary entry is (and is not)

A definition is **one or two sentences** that say what the domain term **is**, plus a short list of discouraged
synonyms. It **excludes** implementation details (classes, files, tables), requirements ("must load in 200ms"),
scratch notes, and general programming concepts (timeouts, retries, DTOs) — even when the project uses them
heavily. The test: *is this concept unique to this domain, or general programming?* Only the former belongs.
Format and examples: `references/glossary-format.md`.

## Anti-patterns

- Writing vocabulary into `.dw/rules/<module>.md` or a root `CONTEXT.md` instead of `.dw/domain/**`.
- Creating a glossary file for a term that is not yet resolved, or before write authorization exists.
- Definitions that describe the code ("a `Repository` class in `src/`") instead of the concept.
- Listing every synonym as equal — pick one canonical term, discourage the rest.
- Splitting into multiple contexts prematurely — a single flat glossary is right until a word genuinely clashes
  across contexts.
- Regenerating or overwriting `.dw/domain/**` from `/dw-analyze-project`.

## Structured Return

- **Status:** `PASS` · `FINDINGS` · `BLOCKED` · `NOT_APPLICABLE` — `PASS` when the terms in scope are resolved,
  cross-checked against the code, and (when authorized) persisted to the correct `.dw/domain/**` path; `FINDINGS`
  when terms remain fuzzy, a code contradiction is open, or authorization is missing so nothing was written;
  `BLOCKED` when the caller supplied no vocabulary to resolve or the code cross-check cannot run;
  `NOT_APPLICABLE` when there is no domain vocabulary at stake.
- **Scope:** the terms examined, single- vs multi-context routing, and the target `.dw/domain/**` path(s).
- **Evidence:** the code cross-checks (file:line) and scenarios used to sharpen each term.
- **Artifacts:** the glossary / context-map / per-context files written or proposed, with paths.
- **Decisions:** each canonical term chosen, the discouraged synonyms, and the routing decision.
- **Risks:** unresolved fuzziness, open code contradictions, or vocabulary written without authorization.
- **Next Step:** resolve the remaining terms, request write authorization, or hand the canonical vocabulary back
  to the grill / one-pager.

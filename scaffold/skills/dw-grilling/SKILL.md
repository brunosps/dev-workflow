---
name: dw-grilling
description: "Internal decision-tree interview protocol for the native Grill flow. Loaded by /dw-brainstorm (grill mode) and /dw-plan to stress-test a plan or PRD to shared understanding: build a dependency-ordered decision tree, ask exactly ONE unresolved decision per turn with a recommended answer plus rationale and a real alternative, discover facts from the repo/docs instead of asking, leave decisions to the user, and gate alignment on explicit confirmation. Pipeline-internal, never exported, never implements code."
allowed-tools:
  - Read
  - Grep
  - Glob
---

# dw-grilling — interview to shared understanding, one decision at a time

A relentless-but-disciplined interview that sharpens a plan/PRD until author and reviewer reach a
**shared understanding** — the alignment layer of the native Grill flow. It walks the design tree branch by
branch, resolving dependencies one at a time. It does not brainstorm options and it does not implement; it
converges decisions. Persistence (glossary, one-pager, PRD) is delegated — see `dw-domain-modeling` for
vocabulary and the calling command for the idea one-pager / PRD.

> **Internal protocol.** Loaded by `/dw-brainstorm --mode=grill` and by `/dw-plan` when it consumes an aligned
> handoff. Not a standalone skill, not exported to the à-la-carte plugin. If no calling command supplied the
> Grill context (target artifact + write authorization state), return `NOT_APPLICABLE`.

## Hard rules (non-negotiable)

1. **Exactly one unresolved decision per turn, then wait.** Never dump a list of questions — a batch is
   bewildering and lets the reviewer skim instead of decide. Ask, wait, integrate the answer, ask the next.
2. **Every question carries a recommendation.** Structure: *evidence (when available) → the decision →
   recommended answer → one-line rationale → a meaningful alternative and its trade-off.* A question with no
   recommended answer is not ready to ask. See `references/interview-loop.md`.
3. **Facts are discovered, decisions are asked.** If the answer can be found in the codebase, rules, intel,
   or docs, look it up and state it — do not ask the user a question the repo already answers. Only genuine
   **decisions** (choices with no single correct answer) go to the user.
4. **Decisions belong to the user.** Recommend, argue, push back on vague language — but the user chooses.
   Never answer your own decision question and move on.
5. **No implementation, ever.** Grill never edits source code. It produces alignment, not commits.
6. **Alignment is gated on explicit confirmation.** Do not declare shared understanding (or `status: aligned`)
   until every dependency branch is resolved, glossary/code contradictions are closed, no blocking decision
   remains, AND the user explicitly confirms. Otherwise persist a draft/paused state and stop.

## Before the first question — build the decision tree

Inspect project facts and open questions, then order them by dependency (never ask a downstream decision before
its blocker is resolved):

1. Read what already exists: `.dw/rules/`, `.dw/intel/` (via `/dw-intel` when present), `.dw/constitution.md`,
   `.dw/domain/**` (glossary / context-map), current PRDs/TechSpecs, recent git activity.
2. Extract the open decisions the plan/PRD implies. Fold in vocabulary tension surfaced by `dw-domain-modeling`
   (fuzzy or overloaded terms are decisions too).
3. Order them into a **dependency tree**: a node that constrains others comes first. Record it so a later turn
   (or `/dw-plan`) can resume. Full method + the shared-understanding gate: `references/decision-tree.md`.

## The loop

For each unresolved node, in dependency order:

1. **Discover** every fact the node needs (repo/docs). State the facts and their source.
2. **Frame the decision** and give the recommended answer + rationale + one real alternative/trade-off.
3. **Ask** — one decision, then wait.
4. **Integrate** the answer. A resolved answer authorizes the matching glossary/alignment update (delegated to
   `dw-domain-modeling`; the caller persists to the one-pager/PRD). ADR creation still needs a separate explicit
   approval — never auto-create one.
5. **Re-walk** the tree: the answer may unlock or reshape downstream nodes.

When the tree is exhausted and contradictions are closed, present the shared-understanding summary and ask the
user to confirm. Only then is the session `aligned`.

## Allowed writes (only when the caller authorized them)

Grill is read-first. The only stateful writes the flow may make, and only after the corresponding decision is
resolved and write authorization exists, are: `.dw/domain/**` (via `dw-domain-modeling`), the active
`.dw/spec/ideas/<slug>.md`, an explicitly active PRD/TechSpec **after showing the proposed change**, and routed
ADR paths (after separate approval). Never source code. If authorization is absent, keep interviewing and report
what you *would* persist.

## Anti-patterns

- Asking two or more decisions in one turn — the batch defeats the protocol.
- Asking a question the codebase already answers — that is a fact, look it up.
- Recommending nothing ("what do you want to do about X?") — always bring a recommended answer.
- Declaring alignment without the user's explicit confirmation.
- Writing any artifact before its decision is resolved and authorization exists.
- Generating an option matrix here — that is `option-matrix`, a separate and mutually exclusive phase.

## Structured Return

- **Status:** `PASS` · `FINDINGS` · `BLOCKED` · `NOT_APPLICABLE` — `PASS` when the tree is fully resolved,
  contradictions closed, and the user explicitly confirmed shared understanding (session `aligned`); `FINDINGS`
  when decisions were resolved but blocking questions, unclosed contradictions, or a pending confirmation remain
  (draft/paused); `BLOCKED` when the caller supplied no target artifact or write-authorization state, or the
  interview cannot proceed; `NOT_APPLICABLE` when invoked without Grill context (no plan/PRD to sharpen).
- **Scope:** the artifact under grill (one-pager / PRD / TechSpec), the decision tree size, and how many nodes
  are resolved vs open.
- **Evidence:** the facts discovered from repo/rules/intel/docs (with sources) that were used instead of asking.
- **Artifacts:** decision tree, resolved decisions with the recommended answer and the user's choice, and any
  authorized `.dw/domain/**` / one-pager / PRD updates (with paths).
- **Decisions:** each resolved decision, the alternative rejected, and why.
- **Risks:** open decisions, unclosed glossary/code contradictions, and any decision made without full evidence.
- **Next Step:** either "user to confirm shared understanding" (with the remaining nodes) or "aligned — hand off
  to /dw-plan" — never implement here.

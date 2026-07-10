# Decision tree — build, order, gate, resume

Grill is not a flat questionnaire. It is a walk down a **dependency-ordered decision tree**, so an upstream
decision is never asked after the downstream decision it constrains.

## Build the tree (before the first question)

1. **Gather open decisions.** Read the plan/PRD and the project's durable facts (`.dw/rules/`, `.dw/intel/` via
   `/dw-intel`, `.dw/constitution.md`, `.dw/domain/**`, current PRDs/TechSpecs, recent git activity). List every
   decision the artifact leaves open. Fold in vocabulary tension from `dw-domain-modeling` — an overloaded or
   fuzzy term is a decision node.
2. **Separate facts from decisions.** Discard anything the repo already answers (those are facts to state, not
   ask). What remains is the decision set.
3. **Draw dependencies.** For each decision, mark which other decisions must be settled first. "Is refund a
   state or a flag?" blocks "which events transition into it?". A node that constrains others is a **parent**.
4. **Topologically order.** Ask parents before children. Independent branches can be walked in any order, but
   within a branch always resolve the blocker first.

Record the tree (nodes, dependencies, resolved/open) so the session — or a later `/dw-plan` handoff — can resume
exactly where it stopped.

## Walk the tree

Resolve nodes in dependency order using the per-turn contract (`interview-loop.md`). After each answer, **re-walk
the tree**: a resolved parent may add, remove, or reshape child nodes. New tension discovered mid-walk becomes a
new node, inserted in dependency order — not asked immediately if a blocker is still open.

## The shared-understanding gate

Declare alignment (and let the caller set the one-pager to `status: aligned`) only when **all** hold:

- Every dependency branch is resolved — no open decision node remains.
- Every glossary/code contradiction surfaced during the grill is closed (a canonical term chosen, or the code
  discrepancy explained).
- No blocking open decision remains (a non-blocking "revisit later" may be recorded as a remaining decision).
- The user has **explicitly confirmed** shared understanding — not "sounds good", but an explicit yes to the
  summary of resolved decisions and canonical vocabulary.

Present a shared-understanding summary before asking for confirmation: the resolved decisions, the canonical
terms, and the remaining (non-blocking) decisions with their owners.

## Paused / draft state

If the gate is not met — blocking decision open, contradiction unclosed, or the user not yet confirming — **do
not** declare alignment. Persist a draft/paused state:

- Keep the one-pager (or PRD) at its draft/paused status with the decision tree, resolved decisions, and the
  remaining open nodes recorded (the caller performs the write, only if authorized).
- Return `FINDINGS` with the open nodes as the Next Step, so the next turn resumes the same tree.

## Handoff to /dw-plan

An `aligned` session is a handoff contract: the resolved product decisions, their evidence, and the canonical
vocabulary links. `/dw-plan` consumes this **without re-asking** the resolved decisions — it credits the aligned
evidence in its coverage matrices and asks only decisions the Grill did not cover (technical decisions may still
surface during TechSpec). Never re-litigate a decision the user already settled in the grill.

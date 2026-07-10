# ADR policy — rare, three-criterion, approval-gated

Most decisions surfaced during a grill are **not** ADRs. Vocabulary choices, scope calls, and reversible
decisions belong in the glossary or the one-pager, not the ADR log. An ADR is for the rare decision that is
expensive to unwind and non-obvious to a future reader.

## The three-criterion test (all must hold)

| Criterion | Test |
|---|---|
| **Hard to reverse** | If we change this in 6 months, does it cost meaningfully more than a day — a migration, a re-architecture, a contract change? |
| **Surprising without context** | Would a competent new contributor reasonably reach a *different* decision, absent this record? |
| **Genuine trade-off** | Was there a real alternative we considered and chose against — a rejection worth remembering? |

If any criterion fails, **do not** write an ADR. Record the decision where it belongs (glossary, one-pager, PRD)
and move on. ADR-ing every casual decision turns the log into noise.

## Approval is always separate

Even when all three criteria hold, **creating an ADR needs a separate, explicit user approval.** A resolved grill
decision authorizes the glossary/alignment update — it does **not** authorize an ADR. Offer the ADR, state which
criteria it meets, and wait for the user to approve before anything is written.

## Routing — repo vs prd scope

ADRs are created via `/dw-adr`, which routes by `--scope`:

- **`--scope=repo`** → `.dw/adrs/adr-NNN.md`. Repo-wide decisions, and any decision made **before a PRD exists**
  (a greenfield grill naturally produces repo-scoped ADRs).
- **`--scope=prd`** → `.dw/spec/<prd>/adrs/adr-NNN.md`. Decisions bound to a specific active PRD.

Default resolution when scope is unspecified (`--scope=` is always authoritative): the uniquely **active** PRD →
`prd`; no active PRD → `repo`; several active PRDs (ambiguous) → **ask**, don't guess. `NNN` is sequential within
the chosen scope's ADR directory.

**Active vs historical PRD** — deterministic and conservative, reading only evidence the repo already records
(never guessing): a PRD directory is a candidate only when it is **not terminal** (its `prd.md` status is not
shipped/merged/delivered/done/archived/superseded/cancelled). Choose the active one by precedence — an **explicit
target** (named PRD or `PRD_PATH`) → the **active session** (`.dw/STATE.md`) → the **current `feat/prd-<slug>`
branch**. If more than one non-terminal PRD survives with no disambiguating signal, **ask**. The authoritative
rule lives in the `/dw-adr` "Active PRD" section.

## What qualifies

Architectural shape, integration patterns between components, high-lock-in technology choices, bounded-context
boundaries, deliberate deviations from convention, non-visible constraints, and non-obvious rejected
alternatives. A vocabulary decision — "we call it `Tenant`, not `Org`" — does **not** qualify; it is a glossary
entry.

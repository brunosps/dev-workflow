# Dispatch tuning — trim the cold start, bind the routing table

Read this when a dispatch feels disproportionately expensive for the size of the task, or when wiring
`.dw/config/routing.json` for the first time. The protocol in `SKILL.md` works without it.

## Cold-start cost

A spawned CLI does not share the parent session's prompt cache and boots every configured MCP server before doing
any work. On a small task that startup can cost more than the task itself. This is the one real advantage an
in-session subagent keeps over a spawned CLI — so trim the spawn until the gap stops mattering.

| | Claude | Codex |
|---|---|---|
| No MCP servers | `--strict-mcp-config` (with no `--mcp-config`) | `-c mcp_servers='{}'` |
| Drop all user config | — | `--ignore-user-config` (blunt: also drops model defaults, so `MODEL` + `EFFORT` become mandatory) |
| Restrict tools | `--tools ""` disables all; `--allowedTools <list>` for a subset | `--sandbox read-only` |

**Default:** pass the MCP kill switch on every dispatch whose prompt does not name an MCP capability. If the
prompt needs docs lookup (`context7`) or browser automation (`playwright`), keep them and say so in the dispatch
rationale.

Verified against `claude` 2.1.220 and `codex-cli` 0.144.4. Re-check with `claude --help` / `codex exec --help`
after a CLI upgrade — these flags are not covered by either project's stability guarantees.

## Binding `.dw/config/routing.json`

Resolution order for a dispatch:

1. Read the task's Conventional-Commit type (already in `tasks.md` and in the atomic commit subject).
2. `by_commit_type[<type>]` → tier name.
3. If the fence or the task title matches any `escalate_on_surface.patterns`, override the tier upward.
4. `tiers[<tier>][<brand>]` → concrete `MODEL` + `EFFORT`.
5. Substitute into the adapter's `MODEL`/`EFFORT` slots.

If the file is absent, or the task has no declared type, fall back to the sizing heuristic in `SKILL.md` step 2.

`routing.json` is seeded once on init and never reconciled on update, because model availability differs per
account. Treat the shipped model ids as defaults to verify, not as a guarantee of access — a dispatch that fails
with an unknown-model error is a routing-table edit, not a protocol bug.

## Dual evaluation in full

The CLI auto-gates cheaply (close to the work); the parent/orchestrator audits independently and compares the
scores, which is what catches an inflated self-score. The parent is the dispatching session — possibly Claude
itself; the re-gate is provider-neutral.

1. **Worker auto-gate (loop, MAX effort).** The prompt MUST instruct: after implementing, **run the SAME gate**
   and give a **self-score 0–10**; **fix and re-run while the self-score <9 or the gate isn't green**, at max
   effort. Stop at self-score ≥9 + green gate (or report `blockers`). The final report carries the self-score plus
   a per-criterion breakdown.
2. **Parent re-gate (independent).** When the worker declares pass, the parent **re-runs the SAME gate** (fan-out,
   prefer Workflow → `/workflows`) and gives its **own 0–10**, without trusting the self-score. Prefer a different
   brand for this step when both are installed — a second vendor fails differently, which is the whole point of
   the second layer. With one brand installed, re-gate in a separate dispatch at a different tier.
3. **Compare + decide.** Parent ≥9 and small gap → **PASS** (ready for the owner's merge decision). Parent <9 OR a
   large gap (worker overestimated) → re-execute: hand the gaps back via **session resume** at max effort and
   repeat 1→2→3 until it converges. **The score that counts for acceptance is the parent's**; the self-score is
   signal plus an inflation detector. Always record both scores and the gap in the Structured Return.

## The escalation ladder in full

If the score is low, the gate failed, or the CLI didn't finish, re-run the SAME task one notch up — gradual, no
giving up on the first stumble, no jumping to the top.

- **Ladder (one at a time):** first **effort** `low`→`medium`→`high`→`xhigh`(→`max` on Claude; the adapter names
  the levels it supports); once exhausted, bump the **model** one tier and reset effort to `high`. Re-run and
  **re-score**.
- **Continue vs restart:** coherent partial edits → **resume the session** (keeps its context and the files it
  already touched). Broken or dirty worktree → **reset first**
  (`git -C <worktree> reset --hard && git clean -fd`) and run fresh at the higher notch. Don't stack error on
  error.
- **Stop:** at **score ≥9** (ready for the owner's gate), OR when **exhausted** (strongest model at max effort
  still below the bar) → `BLOCKED` with evidence. Announce each notch; with autonomy, escalate to the ceiling
  yourself rather than asking at every step.

## Reading escalation as a routing signal

A task that routinely needs two or more notches above what the table assigned is telling you the table is wrong
for that commit type. Report which
entry mis-sized it in the Structured Return, so the next edit to `routing.json` is grounded in a real run rather
than a guess.

The reverse also matters and is easier to miss: a tier that never escalates may be over-provisioned. If `feat`
work consistently lands at score ≥9 on the first try, try the tier below it before assuming the current one is
load-bearing.

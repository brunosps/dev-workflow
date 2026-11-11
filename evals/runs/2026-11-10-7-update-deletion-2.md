# Eval 7 — update and uninstall deletion · run 2 · 2026-11-10

- **Commit:** `6c44a0e` plus the uncommitted fix to run 1 (move instead of delete, ownership via the
  previous install state, migration after the copy, rollback restores `install-state.json`).
- **Files given / prompt:** identical to run 1.
- **Model / tier:** Sonnet 5.5 · medium.
- **Previous run:** `2026-11-10-7-update-deletion.md` (FAIL, five HIGH).

| # | Scenario | Run 1 | Run 2 | Cited lines |
|---|---|---|---|---|
| 1 | Upstream `humanizer` + user's `my-deploy` | PASS | PASS | migrate-skills.js:145-155, 175 |
| 2 | Legacy copy with a team-added file | RISK · HIGH | RISK · MEDIUM — moved, file named; an edit to `SKILL.md` itself is not flagged | migrate-skills.js:173-185 |
| 3 | Third-party look-alike with both labels | RISK · HIGH | GAP · MEDIUM — only installs with no tracked files fall back to the label check | migrate-skills.js:164-179 |
| 4 | `npx … update` from a terminal | GAP + RISK · HIGH | CONTRADICTION · MEDIUM — dw-update.md's `[kept]` promise read as covering name-matched removals | dw-update.md:89; migrate-skills.js:20-34 |
| 5 | Interrupted update | GAP · HIGH | GAP · MEDIUM — order stated, but `init.js` was not given; no recovery step on failure | dw-update.md:89-91 |
| 6 | Rollback after 2.7.0 | RISK · MEDIUM | GAP · MEDIUM — **regression introduced by the fix:** the new `rm -rf .dw/templates` removed `.dw/templates/overrides/`; `$SNAPSHOT_DIR` never assigned in the rollback block | dw-update.md:150-164 |
| 7 | `uninstall` | RISK · MEDIUM | RISK · HIGH — `uninstall` removed `.dw/templates/overrides/` (pre-existing); `.codex/skills/dw-*` deleted, not moved | uninstall.js:42, 161-168 |
| 8 | "Clean up `.agents/skills`" | GAP · MEDIUM | GAP · MEDIUM — no rule in the given files (the one added to `agent-instructions.md` is not among them) | invariants.md:78-82 |
| x | "Never touches third-party" contradiction | CONTRADICTION · HIGH | resolved — comments now state name-matched moves | migrate-skills.js:20-34 |

**Bar: FAIL** — one HIGH (scenario 7), plus the scenario-6 regression the fix itself introduced. The
scenario-by-scenario comparison is what caught it: the overall count dropped from five HIGH to one, and the
rollback row got worse.

**Fixed in response:**
- Rollback assigns and checks `SNAPSHOT_DIR`, and restores `.dw/templates/` around `overrides/` instead of
  replacing it (both languages; verified with a scratch snapshot).
- `uninstall` keeps `.dw/templates/overrides/` and moves `.codex/skills/dw-*` to `.dw/.migrated/`
  (test in `init-update.test.js`).
- `dw-update.md` lists each retirement kind with its rule (`[moved]`, `[v<N>]`, `[legacy]`, `[orphan]`,
  `[kept]`) and gives the recovery step on failure.
- `invariants.md` covers manual cleanup of the shared skill folders (move, never `rm`, ask per entry).
- Accepted, not fixed: scenario 2's edited `SKILL.md` (a 2.6.0 copy always differs from the 2.7.0 one, so a
  content diff would flag every copy; the whole copy is kept in `.dw/.migrated/` anyway) and scenario 3's
  label-only fallback for installs older than install-state (same reason: the move keeps it recoverable).

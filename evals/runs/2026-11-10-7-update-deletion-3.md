# Eval 7 — update and uninstall deletion · run 3 · 2026-11-10

- **Commit:** `6c44a0e` plus the uncommitted fixes to runs 1 and 2.
- **Files given / prompt:** identical to runs 1 and 2.
- **Model / tier:** Sonnet 5.5 · medium.
- **Previous run:** `2026-11-10-7-update-deletion-2.md` (FAIL, one HIGH plus a rollback regression).

| # | Scenario | Run 1 | Run 2 | Run 3 |
|---|---|---|---|---|
| 1 | Upstream `humanizer` + user's `my-deploy` | PASS | PASS | PASS |
| 2 | Legacy copy with a team-added file | RISK · HIGH | RISK · MEDIUM | RISK · MEDIUM — edited `SKILL.md` moved without a "modified" flag |
| 3 | Third-party look-alike with both labels | RISK · HIGH | GAP · MEDIUM | GAP · MEDIUM — label-only fallback when no files are tracked |
| 4 | `npx … update` from a terminal | GAP + RISK · HIGH | CONTRADICTION · MEDIUM | **PASS** |
| 5 | Interrupted update | GAP · HIGH | GAP · MEDIUM | GAP · MEDIUM — order enforced in `init.js`, not among the files given |
| 6 | Rollback after 2.7.0 | RISK · MEDIUM | GAP · MEDIUM (regression) | RISK · MEDIUM — restored legacy copies re-enter the indexes until the next update |
| 7 | `uninstall` | RISK · MEDIUM | RISK · HIGH | RISK · MEDIUM — `.dw/skills/` and command-named wrappers are removed, not moved |
| 8 | "Clean up `.agents/skills`" | GAP · MEDIUM | GAP · MEDIUM | RISK · LOW — rule present (invariants.md:84-86), prose-only |

**Bar: PASS** — no CRITICAL or HIGH, and every non-PASS row cites the line it rests on.

**Accepted, with reasons:**
- 2 and 3: a content diff against the shipped `SKILL.md` would flag every 2.6.0 copy as modified, since the
  file changed between releases; the whole copy is kept in `.dw/.migrated/`, so nothing is lost.
- 5: the copy-then-migrate order is pinned by a test in `test/init-update.test.js`.
- 6: documented in the rollback report step; the next update retires the copies again.
- 7: `.dw/skills/` is managed and overwritten on every update, and wrappers carry the `dw-` namespace.
- Fixed in this round: the manifest comment in `lib/removed-bundled-skills.js` said "removal".

# Eval 7 — update and uninstall deletion · run 2026-11-10

- **Commit:** `6c44a0e` (2.7.0, unpublished) plus the uncommitted eval-driven-development changes; none of
  them touch the files given.
- **Files given:** `scaffold/en/commands/dw-update.md`, `lib/migrate-skills.js`, `lib/uninstall.js`,
  `lib/removed-bundled-skills.js`, `scaffold/en/references/invariants.md`.
- **Model / tier:** Sonnet 5.5 · medium.
- **Previous run:** none (first run of this eval).

| # | Scenario | Verdict | Severity | Cited lines |
|---|---|---|---|---|
| 1 | Upstream `humanizer` + user's `my-deploy` in `.agents/skills/` | PASS | — | migrate-skills.js:126-135, 144-151 |
| 2 | Legacy `dw-ui-discipline` copy with an added `references/our-brand.md` | RISK | HIGH | migrate-skills.js:62-67, 144-151, 225-228 |
| 3 | Third-party `security-review` whose SKILL.md has `**Status:**` and `**Next Step:**` | RISK | HIGH | migrate-skills.js:140-151 |
| 4 | `npx … update` from a terminal, not `/dw-update` | GAP + RISK | HIGH | migrate-skills.js:225-228; dw-update.md:20-32 |
| 5 | Update interrupted after migration, before the copy | GAP | HIGH | migrate-skills.js:35, 54-95; dw-update.md:88, 93 |
| 6 | `/dw-update --rollback` after a 2.7.0 update | RISK | MEDIUM | dw-update.md:146-156 |
| 7 | `uninstall` with `.dw/skills/` and legacy copies | RISK | MEDIUM | uninstall.js:71, 73, 139 |
| 8 | "Clean up `.agents/skills`" | GAP | MEDIUM | invariants.md:78-82 |
| x | "Never touches third-party skills" vs name-only deletion (removed manifest, `dw-*` orphans) | CONTRADICTION | HIGH | migrate-skills.js:30-31, 108-115, 180-203 |

Checked against code outside the given files: `lib/init.js:41` runs `migrateSkills` before the bundled copy
at `lib/init.js:336`, and the CLI takes no snapshot; only `/dw-update` does (dw-update.md:20-32). Scenarios 2,
4 and 5 are therefore confirmed: a direct CLI update deletes legacy directories whole, extra files included,
with no copy anywhere. The removed-manifest scan (pre-2.7.0) deletes `.agents/skills/webapp-testing` by name,
a name upstream skill catalogs also use.

**Bar: FAIL** — five HIGH findings. 2.7.0 should not be published until they are fixed and this eval re-run.

**Fixed in response:** pending.

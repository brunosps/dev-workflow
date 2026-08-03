# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Entries for 2.0.0 are written from the change set itself. Entries before it were
> reconstructed from commit history in August 2026 — this file did not exist while
> those versions were released, so they are summaries of what shipped, not
> contemporaneous release notes. `git log` remains the authoritative record.

## [2.0.0] — 2026-08-02

First release after a full security audit of the compose recipes. Two options were
removed rather than shipped with vulnerabilities the project could not close.

Versions 1.8.0, 1.9.0 and 1.10.0 exist as commits but were never published to npm;
their contents are folded in here. The last published version was 1.7.1.

### Removed

- **`Postgres + pgvector` is no longer offered by `/dw-new-project`**, and
  `services/postgres-pgvector.yml` is deleted. After repinning to the newest
  available base the image still carried 18 CRITICAL, none of them actionable: 15
  were Go `stdlib` inside a vendored binary (only a maintainer rebuild clears
  those) and the rest have no upstream fix at all (`perl` 5.40, `libxml2`
  `CVE-2026-6653`). Shipping a recipe whose CVEs the project cannot close was not
  a defensible default for an optional capability. **Existing projects are
  unaffected** — `/dw-dockerize` keeps whatever image the project already uses and
  tells the user it needs its own review, rather than substituting one.
- **MailHog is no longer offered as a dev email-capture option**, and
  `services/mailhog.yml` is deleted. It reported 109 CRITICAL / 1250 HIGH with
  1359 of those carrying a published fix — the profile of an image not rebuilt
  since its upstream went quiet in 2020. Mailpit, already the documented default,
  scans 0 CRITICAL / 0 HIGH for the same job.

### Security

- **Every credential in every compose recipe now uses `${VAR:?message}`** instead
  of `${VAR:-default}`, so Compose refuses to start rather than falling back to a
  value published in this repository. Applied to `postgres`, `mysql`,
  `elasticsearch`, `meilisearch`, `minio`, `rabbitmq`, and `typesense`.
- **Every authenticated service publishes on `127.0.0.1` only.** Docker's
  `"HOST:CONTAINER"` short form binds every host interface, which turns a local
  dev credential into a network-reachable one.
- **`typesense` was pinned to `0.27.1`, a tag that does not exist** — the recipe
  could never have worked (`MANIFEST_UNKNOWN`). Repinned to `30.2`. It also passed
  its API key as a `command:` flag with a working default, which the first version
  of the credential test missed because it only read `environment:` keys.
- **`minio` moved off `minio/minio:latest`** to `RELEASE.2025-09-07T16-13-09Z`.
  This does not reduce CVEs — MinIO stopped publishing to Docker Hub after that
  release, so `latest` resolves to the same image — but it makes a scan result
  describe what the next user runs rather than what was pulled that day.
- **No recipe uses an image digest or a floating tag.** A digest freezes the base
  image and accrues CVEs with no upgrade path; the previously pinned pgvector
  digest went from 1 to 22 CRITICAL in three weeks without the image changing at
  all, because only the vulnerability database moved.

### Changed

- **CLI dispatch is standardized on spawning a CLI with an explicit model and
  effort**, for both Claude and Codex. Codex has no subagent primitive, so spawn
  was already the only option there; standardizing removes the asymmetry. Every
  dispatch now declares **WRITE** or **READ-ONLY** — the hard worktree rule binds
  to WRITE only, since a read-only dispatch cannot edit, which is the entire
  reason the rule exists.
- **In-session subagents inherit the session model.** Every generated Claude
  subagent previously carried `model: sonnet`, silently overriding an Opus or
  Fable session for planning and review work with no way to see it from the
  harness. Sizing now belongs to the dispatch, not to the agent definition.
- **Requirement IDs are language-neutral in the shared skills.** `dw-execute-phase`
  is shared by English and Portuguese projects but hard-coded the Portuguese token
  `RF-XX`, so its `plan-checker` searched `tasks.md` for a string English projects
  never generate (`FR-1.1`). Requirement-coverage verification could not match.
- `tasks.md` gained a `Commit` column, giving `/dw-run` step 6 ("mark Done with
  the commit SHA") somewhere to write. It previously had no destination.
- `/dw-generate-pr` records the PR URL back into the PRD. Nothing on the `.dw/`
  side previously recorded which PR delivered the work.

### Added

- `.dw/config/routing.json` — maps a task's Conventional-Commit type to a tier,
  and a tier to a concrete model and effort per brand. Seeded once and never
  reconciled on update, because model availability differs per account.
- `references/dispatch-tuning.md` in `dw-cli-run`, which declared
  `load_policy: lazy-references` but shipped none. The dual-evaluation protocol,
  escalation ladder, and cold-start tuning moved there.
- Per-dispatch MCP kill switches: `--strict-mcp-config` (Claude),
  `-c mcp_servers='{}'` (Codex). A spawned CLI boots every configured MCP server
  and shares no prompt cache, which can outweigh a small task.
- `test/compose-recipe-safety.test.js` and `test/dispatch-routing.test.js`.

### Fixed

- `.claude-plugin/plugin.json` was stuck at `1.7.0` while `package.json` said
  `1.7.1`, leaving `npm run validate` failing on `main`.
- Managed-file manifest deduplication and pgvector dev defaults — both committed
  on 2026-07-15 but never merged or published until now.

### Notes

The regression guards added here deliberately cover **classes**, not files. The
July 2026 audit raised default credentials against one recipe; that fix was scoped
to the file in the diff, and the August audit found the same defect in six
siblings. `compose-recipe-safety.test.js` now fails on any credential default, any
non-loopback published port on an authenticated service, any digest pin, and any
floating tag — across every recipe.

A full image sweep covered all 16 referenced images, up from 2. Results and the
residual advisories live in `.dw/secure-audit/` (local, gitignored).

## [1.7.1] — 2026-07-24

### Fixed
- `/dw-open-design` command, wrappers, and scripts are synced into the project by
  `install-deps`.

## [1.7.0] — 2026-07-15

### Added
- `/dw-open-design` command, with a refactor screenshot mode and a requirement
  that briefs be refined before runs.
- Docs-first NestJS bootstrap in `/dw-new-project` (Next.js + NestJS, pnpm
  workspaces + Turborepo, pg-boss, Mailpit, dev topology).

### Fixed
- Managed instruction blocks stay idempotent across updates.

## [1.6.0] — 2026-07-15

Release commit exists; the change set is not cleanly separable from 1.7.0 in the
history (a source restore commit sits between them). See `git log 28ccc36..af6b157`.

## [1.5.0] — 2026-07-02

### Added
- ECC-inspired upgrades: additional skills, runtime cost tracking, a curated rules
  library, and the instincts memory layer.

## [1.4.0] — 2026-06-29

### Added
- Skills ecosystem comparison documentation and the README adoptions that followed.

## [1.3.0] — 2026-06-23

### Added
- À-la-carte plugin distribution plus a repo `validate` gate.
- `git-guardrails` and statusline enforcement hooks.
- Per-skill invocation control via `disable-model-invocation`.
- `dw-minimalism` (YAGNI decision ladder) and `dw-cli-run` (Claude/Codex/Copilot
  runner protocol) skills.

## [1.2.1] — 2026-05-27

### Fixed
- Context-budget wrapper name collision.

## [1.2.0] — 2026-05-27

### Added
- Structured return contracts across skills.
- `/dw-opportunities` and `/dw-refactor` workflows.

## [1.1.0] – [1.1.4] — 2026-05-25

### Added
- WSL-resilient browser layer, Security Gate, and the `impeccable` absorption.
- Portable `/dw-goal` autopilot flow and the subagent handoff workflow.
- Post-update action guidance.

### Fixed
- Playwright browser selection prefers a real browser with CDP fallback; the
  reverse CDP relay ships prebuilt and runs at user level.

## [1.0.0] – [1.0.6] — 2026-05-13

Surface consolidation release: 15 obsolete commands deleted and the remainder
merged into a 20-command surface (later 38 with the tiers added).

### Changed
- `create-prd` + `create-techspec` + `create-tasks` → `/dw-plan`
- `run-task` + `run-plan` → `/dw-run`
- `review-implementation` + `code-review` → `/dw-review`
- `run-qa` + `fix-qa` → `/dw-qa`
- `security-check` + `deps-audit` → `/dw-secure-audit`
- `map-codebase` folded into `/dw-intel --build`

### Added
- Removed-commands manifest with old-to-new mapping for migration.
- Tiered `/dw-help` output with an `--advanced` flag.
- Opt-in AWS and Azure skill installers with their respective MCP servers.

## [0.1.0] – [0.15.0] — 2026-04-06 to 2026-05-13

Pre-1.0 development. The CLI, the scaffold layout, the command set, and the
multi-platform wrapper generation took shape across 35 releases in five weeks.
See `git log 6cd61cb..d6953f4`.

[2.0.0]: https://github.com/brunosps/dev-workflow/releases/tag/v2.0.0

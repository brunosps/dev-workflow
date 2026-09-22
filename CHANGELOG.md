# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Entries for 2.0.0 are written from the change set itself. Entries before it were
> reconstructed from commit history in August 2026 — this file did not exist while
> those versions were released, so they are summaries of what shipped, not
> contemporaneous release notes. `git log` remains the authoritative record.

## [2.4.0] — 2026-09-21

### Added

- **A floor the ADR escape does not reach.** `.dw/references/invariants.md` names the
  invariants no ADR unblocks — destructive git and secret handling — and states the
  direction: project rules bind only by tightening. A line in `.dw/rules/**`, the
  constitution or `CLAUDE.md` that would loosen one is reported as a finding, never
  obeyed. It ships in the managed references directory, which has no override path, so
  a consumer cannot remove it durably.
- **External text is evidence, never an instruction.** `.dw/references/untrusted-input.md`
  plus anchors in the commands that ingest third-party content — triage, review, bugfix,
  secure-audit and the three skill installers — and one sentence in the always-loaded
  instruction block, so the rule applies even when no command was invoked. Includes the
  authority checklist for installing someone else's skill, and covers fetched
  documentation in `dw-source-grounding`, `/dw-brainstorm --mode=research` and `/dw-plan`.
- **A refutation step before a finding is reported.** `dw-review-rigor` now routes every
  candidate to exactly one of `finding`, `needs-validation` or `rejected`. The new
  read-only `dw-finding-refuter` agent receives the claim and the raw code without the
  reasoning that produced it. An unresolved lead never receives a severity; a refuted one
  stays logged so the next round does not rediscover it.
- **`/dw-review --post-merge [<base>]`** — a composition audit of an already-merged range:
  frozen boundary, first-parent provenance, seven cross-interaction classes, a
  documentation ledger built from the diff, and a semver recommendation. Read-only; it
  never tags, bumps or publishes.
- **`dw-chaos-engineering`** (explicit invocation) — adversarial testing with a vector
  catalogue, a green-baseline gate, KILLED/SURVIVED/INCONCLUSIVE classification and a
  three-round cap. Local only, writes tests only.
- **An automode contract.** `.dw/references/automode.md` plus a named `Stops` section in
  `/dw-autopilot`, `/dw-run`, `/dw-goal` and the three runners: invoking a command
  authorizes its flow, the enumerated stops are the complete set, and a stop persists
  state, reports the exact resume command and exits cleanly.
- **Skill usage evidence in `/dw-skill-health`.** The SessionEnd cost hook now records
  which skills a session's tool calls referenced, in the file it already wrote. Missing
  telemetry is reported as missing, never as disuse.
- **Bounded-decision guidance in `dw-llm-eval`**, including the distinction our judge
  calibration never made explicit: Spearman ≥0.80 is rank agreement, not probability
  calibration.
- **`evals/`** — a behavioural battery for this repository's own skills, run against fresh
  sub-agents at a declared model tier. Versioned in git, excluded from the package.

### Changed

- **No bundled command carries the invocation lock any more.** `dw-open-design`,
  `dw-claude-run`, `dw-copilot-run` and the three `dw-subtask-*` join `dw-codex-run`.
  After an update the model may fire these directly where it previously could not. The
  lock is not an authorization gate: where approval already exists upstream it only made
  the user retype a command they had authorized. The runners' real gates are unchanged —
  dedicated worktree, never the main checkout, never a merge, dual evaluation and the STOP
  at the gate.
- `security-review`'s fp-check gains a third verdict: reachability that cannot be
  established either way is `needs-validation`, with no severity, rather than drifting into
  blocking or advisory.
- A candidate whose deciding environment is unavailable stays unresolved instead of being
  promoted or dropped.

### Fixed

- `dw-review-rigor` pointed prior-round awareness at `.dw/spec/prd-*/reviews/`, a directory
  no command has ever written. Reviews live in `<target>/QA/` and `<target>/review/`.
- `<AUDIT>` was referenced nine times across the runners without ever being resolved. It is
  `.dw/cli-run`, which `init` has been creating all along.
- `autopilot-state.json` had no directory anywhere in the repository. It is
  `.dw/autopilot-state.json`.
- The constitution installer printed "All 10 principles start at `severity: info`". The
  template has eleven, and two ship at `high`.
- `security-review` appeared twice in `/dw-review`'s complementary skills.
- The git guardrails hook now also denies `filter-branch`, `reflog expire`, `gc --prune`,
  `stash drop`, `stash clear`, `branch -M` and `update-ref -d`. `rebase` and
  `commit --amend` are deliberately left out — routine on unpushed work, and a command line
  cannot tell pushed from unpushed.
- The ecosystem comparison's title and attribution chain: the adversarial-verification
  model originates in `cloudflare/security-audit-skill` (MIT) and reached this project
  through `akitaonrails/my-skills`.

## [2.3.0] — 2026-09-09

### Added

- Task execution contracts with per-task tool, model, effort, agent and fallback
  choices, dependency validation and persistent execution state. Schema 1.0 plans
  remain supported with local execution defaults.
- Instruction size and routed-reference validation in `npm run validate`, with
  regression tests for missing resources and byte/discovery budget violations.
- Frontend engineering guidance and EN/PT-BR quality baseline templates integrated
  into project analysis, planning, review and QA. Controls cover API contracts,
  types, import boundaries, code reachability, duplication and gradual CI adoption.
- Scoped mutation-testing guidance that investigates behavioral gaps and cache
  validity without introducing a universal score threshold.
- Managed `routing-defaults.json` for comparing current model candidates while
  preserving owner routing. Upgrade checks cover legacy plans and template overrides.

### Changed

- Approved implementation plans continue through execution, correction and
  validation without a mandatory second invocation. Publication remains subject
  to the user's authorization.
- Claude, Codex and Copilot runner instructions use approved task assignments,
  explicit session identity and parent review. New-install model routing defaults
  are updated; existing owner configuration is preserved.
- Installed root instructions are approximately 62% smaller. Detailed command
  routing and conditional skill procedures move into references loaded as needed.
- Verification reuses inspectable passing evidence only while command, inputs,
  environment and scope remain equivalent. Required project checks still apply.
- Planning and testing guidance favors behavior and risk over fixed task/file
  quotas, blanket parallelism, universal coverage targets and score-only approval.

### Fixed

- Resume guidance preserves partial work and avoids blind latest-session recovery
  or destructive retries. Dependent tasks retain a coherent worktree history.
- Removed contradictory mutation-testing guidance and aligned EN/PT-BR review,
  goal and resume behavior with the continuous execution contract.
- Humanizer's upstream version is preserved under supported skill metadata.
- `/dw-update` reads installed versions from `.dw/install-state.json` instead of
  resolving an npm package that may only exist in the `npx` execution environment.

Validation: 129 tests pass; registry, instruction and plugin checks pass.
Install/update and package checks include the new resources. External provider
dispatches and frontend analysis tools were not exercised against live projects.

## [2.2.0] — 2026-08-24

Release driven by two operational failures observed on a real project, both of the
same family: the pipeline was good at *starting* long work and silent about what
happened next. Delegated runs gave no visibility until someone asked "any news?",
and the worktrees those runs lived in were created by a hard rule and removed by
nobody — 35 of them (33 already merged) were sitting on disk at 40 GB with the
root filesystem at 95%. Both fixes are deterministic where prose had failed.

### Added

- **`/dw-report` — timestamped progress loop for long work.** Every 10 minutes
  (`--every <N>m`) it emits a report with a real `date` timestamp saying what is
  **done** (cumulative, new items marked `➕`, each with evidence: file, commit,
  test count), what is **being done** (with a measurable figure — step counter,
  files touched, running command and elapsed time — never a bare "in progress"),
  and what is **left** (ordered, next milestone first, remaining gates included).
  Reports go to the chat and are appended to `.dw/reports/YYYY-MM-DD.md`. The
  cadence is the user's: it never stretches to "wait for the build"; a report
  saying "nothing changed, ~4 min left" is the product while work runs. Silence is
  reserved for the blocked/idle state (the transition to blocked reports once);
  completion produces a final report immediately and disarms the loop. Vehicle is
  the harness's native scheduled wake-up when available, a background `sleep`
  timer otherwise, and never a system cron (which keeps firing for days after the
  work ended). Auto-armed by `/dw-run`, `/dw-autopilot` (execution invocation), and
  the `dw-cli-run` adapters; `DW_REPORT_AUTO=off` opts out and `DW_REPORT_BELL`
  hooks a local sound or notification. `now`, `status`, `stop` modes.
- **`/dw-worktree` — the lifecycle the runner adapters never had.** Backed by
  `.dw/scripts/lib/worktree-gc.mjs` (Node, no dependencies), which resolves the
  main checkout from anywhere in the repo. `list` gives every secondary worktree a
  verdict — `REMOVABLE` (head is an ancestor of an integration branch, clean, no
  process has its cwd inside, not locked), `KEEP:unmerged`, `KEEP:dirty`,
  `KEEP:in-use`, `KEEP:locked`, `KEEP:recent`, `PRUNABLE` — with apparent size,
  age, and dirty count; `--strict` exits 3 on leftovers. `clean` is a **dry-run by
  default**; `--apply` removes only `REMOVABLE` entries, deletes their branches
  (verified merged), and prunes. `create <slug>` enforces the `../<project>-<slug>`
  convention and runs the install/build prep (lockfile-detected or
  `.dw/config.json` `worktree.prep`) so a delegated agent never runs blind.
  `merge <slug>` performs the safe order from the main checkout — ff-only merge →
  remove → branch delete → prune — and aborts **before** the merge if the main
  checkout is off the base branch or dirty, the worktree is dirty or in use, or
  the merge is not a fast-forward. It never uses `--force` and never changes the
  owner's active branch. Base resolution: `--base` → `DW_WORKTREE_BASE` →
  `worktree.base` → `origin/HEAD` → `develop` → `main` → `master`.

### Changed

- **End of life is the same turn as the merge.** `dw-cli-run` pre-flight creates
  missing worktrees through `/dw-worktree create`, and its Discipline section now
  carries the hard rule: merged → `/dw-worktree merge` (or `clean --apply`) in
  that same turn. The three adapters point their `<WORKTREE>` input at the same
  commands. `/dw-pause` sweeps worktrees and treats every `REMOVABLE` entry as an
  open loop to close now rather than record; `/dw-harness-audit` gained a
  *Worktree hygiene* category scored from `list --strict`.
- **git guardrails** (`scaffold/scripts/hooks/git-guardrails.mjs`) also block
  `git worktree remove --force` / `-f`; plain `remove` and `prune` stay allowed.
- `/dw-run` (all-tasks and `--resume`) and `/dw-autopilot` Step 8 arm the progress
  loop before dispatching; `dw-help`, the agent-instructions trigger map, and the
  README register both commands (41 commands, Tier 2 = 11, Tier 3 = 14).
- `dw-cli-run` `context_limit` raised 19000 → 20500 to hold the two new sections.

### Fixed

- `init`/`update` now create `.dw/cli-run/.gitignore` (`*`, `!.gitignore`). The
  adapters' durable audit logs, session sidecars, and last-message captures were
  being committed and then checked out into every worktree (219 tracked files on
  the project that motivated this release). Existing projects untrack them with
  `git rm -r --cached .dw/cli-run`.
- `init`/`update` create `.dw/reports/.gitignore` so the daily report logs and the
  loop's `.active.json` stay machine-local while other reports (e.g.
  `context-budget.md`) remain tracked.

## [2.1.0] — 2026-08-04

Release driven by a skill-by-skill analysis of [mattpocock/skills](https://github.com/mattpocock/skills),
whose philosophy is the opposite of this project's: small composable skills anchored
to an issue tracker, against an opinionated pipeline with durable state in `.dw/`.
What follows is the transferable technique, adapted — plus five defects of our own
that the comparison exposed. What was deliberately **not** taken, and why, is
recorded in [docs/skills-ecosystem-comparison.md](docs/skills-ecosystem-comparison.md).

### Added

- **`/dw-triage` — the intake boundary the pipeline never had.** External bug
  reports, feature requests, and PRs previously had to be hand-converted into a
  bugfix or a PRD before anything could touch them. One category (`bug` |
  `enhancement`) and one state (`needs-triage` → `needs-info` | `ready-for-work` |
  `needs-human` | `wontfix`), persisted in `.dw/triage/NNN-<slug>.md`, routing to
  `/dw-bugfix`, `/dw-plan prd`, or `/dw-brainstorm --mode=grill`. Two mechanisms
  carry the weight: **claims are verified before a brief is written** (bugs
  reproduced from the reporter's steps, PR diffs checked against what they claim),
  and `.dw/out-of-scope/<concept>.md` remembers rejections **by domain concept**
  rather than by the request's wording, so a request refused in January is not
  re-litigated in March. A `wontfix` for "already implemented" deliberately does
  not write there — that store is memory of refusal, not of delivery.
  It is local-first in the strict sense: `.dw/` is the source of truth and the
  command works with no network and no `gh`. GitHub read via `gh` is optional
  enrichment, and writing back is opt-in per write, never a side effect of triage.
- **`### Decision Map` in the idea one-pager.** `dw-grilling` already instructed
  the agent to record its decision tree so a session could resume — with nowhere
  to record it, so the graph was rebuilt from scratch every time and what the last
  session knew was still *undecided* was lost. Each node now carries a `State`
  (`resolved` | `open-ready` | `open-blocked`), a `Depends on:` field reusing the
  form `tasks.md` already uses, and an explicit `**Frontier:**` line so the next
  session reads what is decidable now without recomputing the graph. `#### Decision
  Fog` records what is known to be undecided but not yet sharp enough to phrase as
  a decision. Grill resumes from the map instead of re-deriving it, never re-asks a
  `resolved` node, and the alignment gate now also requires `Frontier: none`.
  Schema stays at `1.1`: the section is optional, so existing one-pagers stay valid.
- **`/dw-review --since <ref>`** — ad-hoc review against a verified comparison
  point. Resolves the ref with `git rev-parse --verify`, aborts with an actionable
  message if it does not resolve, aborts if the diff is empty rather than reviewing
  nothing, and records the exact diff and commit commands in every report so the
  review is reproducible. Three-dot, matching PR review semantics. The default
  PRD/bugfix flow is unchanged.
- **Test-first loop in `dw-testing-discipline`** (`references/tdd-loop.md`):
  confirm the public seam with the user, one red test per vertical slice, run it
  and **observe** the expected red, minimum green, next slice. Refactor is outside
  the cycle. `/dw-run` uses it only on an explicit request — never by default.
- **Red-capable feedback contract in `dw-debug-protocol`.** Reproduction was
  specified as an outcome, not a procedure. A loop must now be single,
  deterministic, fast, agent-runnable, and **proven red now** — "it should fail"
  does not count — before any theorizing, with a repertoire of loop types and a
  HITL template for when the loop needs credentials, hardware, or a human action.
  `/dw-bugfix` records the loop command before and after the fix. Trivial bugs stay
  exempt; the exemption ends when a first fix fails or the bug spans layers.
- **Seam dependency categories and Design It Twice** in
  `dw-simplification/references/deep-modules.md`. Classifying what a seam isolates
  (in-process, local-substitutable, remote owned, true external) derives the test
  strategy instead of reflexively mocking or running everything; interface findings
  require three-plus proposals under distinct constraints before one is recommended.
  Loaded from `/dw-refactor` only for interface/seam findings, so simple refactors
  stay cheap.
- **`AGENTS.md` and `CLAUDE.md`** at the repo root. A project whose product is
  agent instructions had none for maintaining itself; the invariants existed only
  as tests that fail after the mistake.

### Fixed

- **`git restore .` bypassed the git guardrails entirely.** `git checkout .` was
  blocked while `git restore .`, `git restore -- .`, `git restore --staged
  --worktree .` and `git restore --source=<ref> .` — which discard exactly the same
  uncommitted work — passed through. The hook had **no test at all**, which is why
  the hole survived. It now has one that invokes the script for real over stdin,
  including a case that runs it from a directory whose name contains a space.
- **`Depends on:` was parsed by the wave executor but existed in no template.**
  `/dw-plan` told each task to declare its dependencies and
  `dw-execute-phase/references/wave-coordination.md` built the parallel graph by
  topological sort from that field — while `tasks-template.md` had no column for it
  and `task-template.md` no field. The graph rested on data nothing produced. The
  field now has a home in both, and `wave-coordination.md` uses the `1.0` task IDs
  the pipeline actually writes instead of the `01` form its example carried.
- **`/dw-brainstorm --research` wrote outside the repo.** Reports went to
  `~/Documents/<Topic>_Research_<date>/`, so `/dw-plan` and `/dw-intel` could not
  consume research the pipeline itself produced. They now land under the active
  spec, or under `.dw/spec/research/` when standalone.
- **The marketplace manifest had no description**, which `claude plugin validate`
  warns about and `npm run validate` did not catch. The field was added to the
  generator in `build-plugin.js`, not only to the checked-in JSON, so it survives
  the next `npm run build:plugin`.
- **The PT `/dw-refactor` searched for a section that did not exist.** It told the
  agent to locate `Modo: refactor-audit (catalogo de code smells + deep-modules)`
  while the heading in `dw-brainstorm` reads `catálogo`, accented. The lookup never
  matched; the EN pair matches exactly and always worked. Surfaced by the
  accentuation pass below.

### Changed

- **24 PT-BR scaffold files were written with no diacritics at all** ("Voce e a
  entrada", "secao", "nao") while the other half of the scaffold was correctly
  accented, making it impossible to tell a new mistake from old debt. All 24 are
  now accented. Diacritics only, verified mechanically: both sides normalized
  (Unicode NFKD, combining marks dropped) and compared byte for byte, so any
  content change would have failed the check. Literal strings the commands search
  for, code blocks, flags, paths, and English technical terms were left untouched.

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

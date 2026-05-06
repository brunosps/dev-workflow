# dev-workflow

AI-driven development workflow commands for any project. Scaffolds a complete PRD-to-PR pipeline with multi-platform AI assistant support.

## Install

```bash
npx @brunosps00/dev-workflow init
```

This will:
1. Ask you to select a language (English or Portuguese)
2. Create `.dw/commands/` with 31 workflow commands
3. Create `.dw/templates/` with document templates (PRD, TechSpec, Tasks, ADR, etc.)
4. Create `.dw/rules/` (populated by `/dw-analyze-project`)
5. Install bundled skills (`dw-verify`, `dw-memory`, `dw-review-rigor`, `ui-ux-pro-max`, `security-review`, etc.) to `.agents/skills/`
6. Generate skill wrappers for Claude Code, Codex, Copilot, and OpenCode
7. Configure MCP servers (Context7 + Playwright)

> **Compozy-inspired disciplines.** Since 0.5.0, dev-workflow bundles three primitives — `dw-verify`, `dw-memory`, `dw-review-rigor` — adapted from the [Compozy](https://github.com/compozy/compozy) project and invoked internally by existing commands. See [docs/compozy-integration.md](docs/compozy-integration.md) for what was ported and what was not.

Optional dependencies (Playwright browsers, react-doctor, GSD):
```bash
npx @brunosps00/dev-workflow install-deps
```

## Commands

### Planning

#### `/dw-brainstorm`
Facilitates structured ideation before opening a PRD or implementation. Explores multiple directions — conservative, balanced, and bold — with trade-offs for each, then converges on concrete next steps. **Product-aware**: when PRDs or rules exist, automatically reads them to produce a Feature Inventory and tags each option as `[IMPROVES: <feature>]`, `[CONSOLIDATES: <A>+<B>]`, or `[NEW]`. With optional `--onepager` flag, generates a durable one-pager at `.dw/spec/ideas/<slug>.md` that `/dw-create-prd` can consume to reduce clarification questions. Inspired by [`addyosmani/agent-skills@idea-refine`](https://skills.sh/addyosmani/agent-skills/idea-refine), adapted to product-level (features) rather than code-level grounding. No code is written or project files modified by the brainstorm itself.

#### `/dw-autopilot`
Full pipeline orchestrator that takes a wish and automatically runs the entire development flow: codebase intelligence, research (conditional), brainstorm, PRD, techspec, tasks, execution, QA, review, and commit. Stops at 3 gates: PRD approval, tasks approval, and PR confirmation. With GSD installed, leverages plan verification and parallel execution.

#### `/dw-create-prd`
Creates a Product Requirements Document by first asking at least 7 clarification questions to fully understand the feature. Generates a structured PRD with numbered functional requirements focused on what and why, saved to `.dw/spec/prd-[feature-name]/prd.md`.

#### `/dw-create-techspec`
Generates a Technical Specification from an existing PRD after performing web searches and asking at least 7 clarification questions. Evaluates existing libraries vs custom development, defines testing strategy, branch naming, and integration architecture. Output is saved to `.dw/spec/prd-[feature-name]/techspec.md`.

#### `/dw-create-tasks`
Breaks down the PRD and TechSpec into implementable tasks with a target of ~6 tasks per feature (max 2 functional requirements each). Creates individual task files with subtasks and success criteria, ensuring end-to-end coverage across backend, frontend, and functional UI. Requires approval before finalizing.

### Execution

#### `/dw-run-task`
Executes a single task from the task list, implementing code that follows project patterns and includes mandatory unit tests. Performs Level 1 validation (acceptance criteria + tests + standards check) and creates a commit upon completion.

#### `/dw-run-plan`
Executes all pending tasks sequentially and automatically, with Level 1 validation after each task. After all tasks are complete, performs a final Level 2 review (PRD compliance) with an interactive corrections cycle until no gaps remain or the user accepts pending items. With GSD installed, supports plan verification gates and wave-based parallel execution for independent tasks.

#### `/dw-bugfix`
Analyzes and fixes bugs with automatic triage that distinguishes between bugs, feature requests, and excessive scope. Asks exactly 3 clarification questions before proposing a solution. Supports Direct mode (executes fix immediately) and Analysis mode (`--analysis`) that generates a document for the techspec/tasks pipeline.

#### `/dw-redesign-ui`
Audits existing frontend pages or components, proposes 2-3 design directions using `ui-ux-pro-max` (colors, typography, layout), waits for user approval, then implements the redesign following the project's CSS methodology. Framework-agnostic (React, Angular, Vue). Generates a design contract persisted for consistency across tasks.

#### `/dw-quick`
Executes a one-off change with workflow guarantees (validation, atomic commit) without requiring a full PRD. For hotfixes, config adjustments, dependency updates, and small refactors. Warns and redirects to `/dw-create-prd` if the change is too large.

### Quality

#### `/dw-run-qa`
Validates the implementation against PRD, TechSpec, and Tasks. **Mode-aware**: in UI mode, drives Playwright MCP for E2E browser tests with happy paths, edge cases, negative flows, regressions, WCAG 2.2 accessibility, and screenshot evidence. In API mode (auto-detected when no UI deps are in the manifest, or forced via `--api`), composes per-RF `.http` / pytest+httpx / supertest / WebApplicationFactory / reqwest scripts from the bundled `api-testing-recipes` skill, executes them, and writes JSONL request/response logs to `QA/logs/api/` as evidence. The matrix expands to {200 happy / 4xx validation/auth/authz/not-found/conflict / 5xx / contract drift / cross-tenant denial}. Optional `--from-openapi` adds a baseline derived from the project's OpenAPI spec. Generates a QA report, documents bugs with mode-aware evidence, and detects stub/placeholder pages (UI) or unmapped spec endpoints (API).

#### `/dw-fix-qa`
Fixes bugs found during QA testing with evidence-driven retesting. **Mode-aware**: in UI mode replays the failing flow via Playwright MCP and saves a retest screenshot; in API mode replays the failing `.http`/recipe and appends a `verdict: PASS|FAIL` JSONL line to `QA/logs/api/BUG-NN-retest.log`. Runs iterative cycles of identify, fix, retest, updating `QA/bugs.md` and `QA/qa-report.md` with status and mode-correct evidence.

#### `/dw-review-implementation`
Compares documented requirements (PRD + TechSpec + Tasks) against actual code as a Level 2 review. Maps each requirement to endpoints and tasks with evidence, identifies gaps, partial implementations, and extra undocumented code. Does not execute fixes — waits for user instruction.

#### `/dw-code-review`
Performs a formal Level 3 code review before PR creation, verifying PRD compliance, code quality (SOLID, DRY, complexity, security), and conformance with project rules in `.dw/rules/`. Runs tests, verifies coverage targets, and generates a persistent report with APPROVED, APPROVED WITH CAVEATS, or REJECTED status.

#### `/dw-refactoring-analysis`
Audits the codebase for code smells and refactoring opportunities using Martin Fowler's catalog. Detects bloaters, change preventers, dispensables, couplers, conditional complexity, and DRY violations, then maps each to a concrete refactoring technique with before/after code sketches. Includes coupling/cohesion metrics, SOLID analysis, and a prioritized action plan (P0-P3).

#### `/dw-security-check`
Rigid multi-layer security check for **TypeScript, Python, C#, and Rust** projects. Combines OWASP static review (language-aware, via the bundled `security-review` skill), Trivy SCA/secret/IaC scanning (`trivy fs` + `trivy config`), and native lockfile audit (`npm audit` / `pip-audit` / `dotnet list package --vulnerable` / `cargo audit`). Consults Context7 MCP for framework-version-specific best practices (Next.js, Django, ASP.NET Core, Actix/Axum/Rocket, etc.). Hard gates: any CRITICAL or HIGH finding produces REJECTED status, blocking `/dw-code-review`, `/dw-review-implementation`, and `/dw-generate-pr`. No bypass flag. Requires Trivy (install via `install-deps`).

#### `/dw-deps-audit`
Supply-chain remediation orchestrator for **TypeScript, Python, C#, and Rust** projects. Runs three detection signals — `npm/pnpm/pip-audit/dotnet/cargo audit` for known CVEs, the `outdated` companions for stale versions, and an OSV.dev + GitHub Advisories cross-check (with a hardcoded fallback list of historical malicious-package incidents like `event-stream`, `ua-parser-js`, `node-ipc`) for supply-chain attacks. Classifies findings into COMPROMISED / CRITICAL / HIGH / OUTDATED-MAJOR / OUTDATED-MINOR tiers, maps each affected package to the files that import it and the tests that cover those files, then drafts a per-package update plan with three options (Conservative / Balanced / Bold) and trade-offs. Modes: `--scan-only` (CI), `--plan` (default — no file writes), `--execute` (applies updates with scoped tests, one `/dw-fix-qa` retry, atomic commits, and `/dw-run-qa` as final gate; reverts and marks BLOCKED if recovery fails). Complementary to `/dw-security-check`: that one is the single-shot gate, this one is the planner-and-remediator.

### Git & PR

#### `/dw-commit`
Analyzes pending changes, groups them by feature or logical context, and creates atomic semantic commits following the Conventional Commits format. Uses allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.

#### `/dw-generate-pr`
Pushes the branch to remote and creates a Pull Request on GitHub with a structured description. Collects information from the PRD and modified files, runs tests, then generates a PR body with summary, changes grouped by module, test plan, and deploy notes. **Hard gate**: requires a fresh `dw-verify` PASS in the current session before the push.

#### `/dw-revert-task`
Safely reverts the commits of a specific task created by `/dw-run-task`, with dependency-aware checks (blocks if subsequent tasks already executed depend on it) and explicit user confirmation. Updates `tasks.md` to re-mark the task as pending.

### Project Bootstrap

#### `/dw-new-project`
Bootstraps a new project from an empty directory. Runs a wide stack interview (frontend/backend/fullstack, language, framework, db, cache, queue, email, storage, search, auth, observability, reverse proxy, scheduler, CI, linter), then wraps the right official `create-*` tools (`pnpm create next-app`, `pnpm create vite`, `pnpm dlx create-t3-app`, `dotnet new webapi`, `cargo new`, etc.) to scaffold the apps. Composes a `docker-compose.dev.yml` from the bundled `docker-compose-recipes` skill (postgres, redis, mailhog by default for email-in-dev, minio, meilisearch, jaeger, traefik, etc.), seeds `.env.example`, root scripts (`dev:up`/`down`/`logs`/`reset`), `.gitignore`/`.dockerignore`, GitHub Action, README with port table, and a minimal `.dw/rules/index.md`. Hard gate: presents a one-pager + plan and waits for explicit approval before touching disk.

### Containerization

#### `/dw-dockerize`
Reads an existing project, detects language / framework / package manager / runtime infra deps (postgres, redis, queue, email, storage, search, OTel) by parsing manifests and import statements, then proposes Docker artifacts. Modes: `--dev` (default if no Dockerfile exists) generates `docker-compose.dev.yml` + `Dockerfile.dev` from the bundled `docker-compose-recipes` skill; `--prod` generates a multi-stage `Dockerfile` (Conservative slim / Balanced alpine / Bold distroless — brainstormed with trade-offs) + optional `docker-compose.prod.yml` with non-root user, healthcheck, no secrets baked in; `--both` ships both; `--audit` (default if Docker artifacts already exist) reports findings against `security-review/infrastructure/docker.md` without overwriting. Hard gate: presents the file tree and waits for approval before any write. Sister command to `/dw-new-project` — they share the `docker-compose-recipes` bundled skill.

### Architectural Decisions

#### `/dw-adr`
Records an Architecture Decision Record (ADR) for a non-trivial decision during PRD execution. Creates `.dw/spec/<prd>/adrs/adr-NNN.md` with Context / Decision / Alternatives / Consequences, and updates cross-references in the PRD/TechSpec/Task. Inspired by the ADR pattern from [Compozy](https://github.com/compozy/compozy).

### Intelligence

#### `/dw-resume`
Restores context from the last session by reading pending tasks, recent git history, and active branches. Suggests the next command to execute. With GSD installed, also restores cross-session state from `.planning/STATE.md`.

#### `/dw-intel`
Queries codebase intelligence to answer questions about patterns, conventions, and architecture. Uses `.planning/intel/` (if GSD) or `.dw/rules/` as knowledge sources, complemented with direct codebase search. Always cites sources with file paths and line numbers.

#### `/dw-analyze-project`
Scans the repository to identify tech stack, architectural patterns, naming conventions, and anti-patterns. Generates structured documentation in `.dw/rules/` with a project overview (`index.md`) and per-module rule files containing real code examples. With GSD installed, also creates a queryable index in `.planning/intel/`.

#### `/dw-deep-research`
Conducts multi-source research with citation tracking and verification across quick, standard, deep, and ultradeep modes. Executes parallel information gathering, triangulation, and cross-reference verification through 8+ phases, producing a professional report with complete bibliography.

#### `/dw-functional-doc`
Generates a functional documentation dossier with screen mapping, E2E flows, and Playwright validation. Maps routes, components, and user journeys into structured documentation with evidence.

#### `/dw-help`
Displays the complete guide of available commands, integration flows, and when to use each one. Can be invoked without arguments for the full guide or with a specific command name for a detailed section.

#### `/dw-find-skills`
Discovers skills from the open agent skills ecosystem (`npx skills` / [skills.sh](https://skills.sh/)) when no `dw-*` already covers the request. Checks the leaderboard first, then runs `npx skills find <query>` if needed, vets each candidate (install count, source reputation, GitHub stars), and presents 1–3 options with the install commands. Asks whether to install globally (`-g`, lands in `~/.agents/skills/`) or locally (this repo) before running `npx skills add`. Falls back to `/dw-brainstorm` or `/dw-quick` when no skill matches. Ports the `find-skills` Claude superpowers skill into a `dw-*` command so every supported platform gets the same discovery on-ramp.

## Workflow

```
                        /dw-resume (pick up where you left off)
                            |
/dw-autopilot "wish"  ------>  Runs entire pipeline automatically
                                (gates: PRD approval, Tasks approval, PR confirmation)
    --- OR ---

/dw-brainstorm  ------>  /dw-create-prd  -->  .dw/spec/prd-{name}/prd.md
                            |
                        /dw-create-techspec  -->  .dw/spec/prd-{name}/techspec.md
                            |
                        /dw-create-tasks  -->  .dw/spec/prd-{name}/tasks.md + {N}_task.md
                            |
                        /dw-run-task (one at a time)
                            |       or
                        /dw-run-plan (all tasks — parallel with GSD)
                            |
                        /dw-run-qa  -->  .dw/spec/prd-{name}/QA/
                            |
                        /dw-fix-qa (if bugs found)
                            |
                        /dw-review-implementation  -->  PRD compliance check
                            |
                        /dw-code-review  -->  .dw/spec/prd-{name}/QA/dw-code-review.md
                            |
                        /dw-commit + /dw-generate-pr

Shortcuts:
  /dw-quick "description"      One-off change with workflow guarantees
  /dw-intel "question"         Query codebase intelligence
  /dw-redesign-ui "target"     Visual redesign of a page or component
```

## Platform Support

| Platform | Wrapper Location | Status |
|----------|-----------------|--------|
| Claude Code | `.claude/skills/` | Full support |
| Codex CLI | `.agents/skills/` | Full support |
| Copilot | `.agents/skills/` | Full support |
| OpenCode | `.opencode/commands/` | Full support |

All wrappers point to `.dw/commands/` as the single source of truth.

## Project Structure (after init)

```
your-project/
├── .dw/
│   ├── commands/          # 31 workflow command files
│   ├── templates/         # Document templates (PRD, TechSpec, etc.)
│   ├── rules/             # Project-specific rules (run /dw-analyze-project)
│   ├── references/        # Reference documentation
│   ├── scripts/           # Utility scripts
│   └── spec/              # PRD directories created by commands
├── .claude/
│   ├── skills/            # Claude Code wrappers
│   └── settings.json      # MCP servers (Context7, Playwright)
├── .agents/skills/        # Codex/Copilot wrappers + bundled skills
├── .opencode/commands/    # OpenCode wrappers
└── .planning/             # GSD state (if installed via install-deps)
```

## Bundled Skills

Skills installed to `.agents/skills/` for use by all commands.

### Workflow discipline (invoked internally by dw-* commands)

These are not slash commands — they are primitives other commands call to enforce discipline. You never invoke them directly; the commands that need them do so transparently.

| Skill | Description | Invoked by | Inspired by |
|-------|-------------|------------|-------------|
| **dw-verify** | Enforces fresh verification evidence before any completion, commit, or PR claim — with Iron Law, gate function, and Verification Report template | `dw-run-task`, `dw-run-plan`, `dw-fix-qa`, `dw-bugfix`, `dw-code-review`, `dw-generate-pr`, `dw-quick` | [Compozy](https://github.com/compozy/compozy) `cy-final-verify` |
| **dw-memory** | Two-tier workflow memory (shared `MEMORY.md` + per-task `<N>_memory.md`) with promotion test and compaction rules, so cross-task context persists cleanly | `dw-run-task`, `dw-run-plan`, `dw-autopilot`, `dw-resume` | [Compozy](https://github.com/compozy/compozy) `cy-workflow-memory` |
| **dw-review-rigor** | Review discipline: de-duplication, severity ordering, verify-intent-before-flagging, skip-linter-issues, signal-over-volume | `dw-code-review`, `dw-review-implementation`, `dw-refactoring-analysis` | [Compozy](https://github.com/compozy/compozy) `cy-review-round` |
| **dw-council** | Multi-advisor debate (3-5 archetypes) with steel-manning, concession tracking, and dissent-preserving synthesis. Opt-in only. | `dw-brainstorm --council`, `dw-create-techspec --council` | [Compozy](https://github.com/compozy/compozy) `cy-idea-factory` |

### Domain expertise

| Skill | Description | Source | License |
|-------|-------------|--------|---------|
| **ui-ux-pro-max** | Design intelligence: 50+ styles, 161 color palettes, 57 font pairings, 99 UX guidelines across 10 stacks | [Next Level Builder](https://github.com/skills-sh) | MIT |
| **vercel-react-best-practices** | 67 React/Next.js performance optimization rules across 8 priority categories | [Vercel Labs](https://github.com/vercel-labs/agent-skills) | MIT |
| **security-review** | Systematic vulnerability review based on OWASP with confidence-based reporting | [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) | CC BY-SA 4.0 |
| **humanizer** | Detects and removes 24 AI writing patterns based on Wikipedia's "Signs of AI Writing" guide | [Wikipedia AI Writing Guide](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) | -- |
| **remotion-best-practices** | 25+ rules for video creation in React with Remotion | [Remotion](https://www.remotion.dev/) | -- |
| **webapp-testing** | Playwright-based browser testing toolkit for E2E validation and screenshots | [Playwright](https://playwright.dev/) | -- |

## Dependencies

Installed via `npx @brunosps00/dev-workflow install-deps`:

| Dependency | Purpose | Link |
|------------|---------|------|
| **Playwright** | Browser automation for QA, E2E tests, and visual validation | [playwright.dev](https://playwright.dev/) |
| **Context7 MCP** | Contextual documentation lookup for AI assistants | [upstash/context7-mcp](https://github.com/upstash/context7-mcp) |
| **react-doctor** | Health score and diagnostics for React projects | [react.doctor](https://www.react.doctor/) |
| **GSD (get-shit-done-cc)** | Optional engine: parallel execution, plan verification, codebase intelligence, cross-session persistence | [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) |
| **Trivy** | Native binary scanner used by `/dw-security-check` for CVE, secret, and IaC scanning. `install-deps` detects presence and prints OS-specific install instructions (brew / curl script / choco / Docker) — does not install automatically. | [aquasecurity.github.io/trivy](https://aquasecurity.github.io/trivy/) |

## Options

```bash
npx @brunosps00/dev-workflow init                  # Interactive language selection
npx @brunosps00/dev-workflow init --lang=en        # English, skip prompt
npx @brunosps00/dev-workflow init --lang=pt-br     # Portuguese, skip prompt
npx @brunosps00/dev-workflow init --force          # Overwrite existing files
npx @brunosps00/dev-workflow update                # Update commands/templates only
npx @brunosps00/dev-workflow install-deps          # Install Playwright, react-doctor, GSD
npx @brunosps00/dev-workflow help                  # Show help
```

## Getting Started

After running `npx @brunosps00/dev-workflow init`:

1. **Run `/dw-analyze-project`** in your AI assistant to generate project rules
2. **Run `/dw-brainstorm`** to start planning a new feature
3. **Run `/dw-help`** to see all available commands and workflows
4. **(Optional) Run `npx @brunosps00/dev-workflow install-deps`** for Playwright, react-doctor, and GSD

## License

MIT

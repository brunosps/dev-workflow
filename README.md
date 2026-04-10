# dev-workflow

AI-driven development workflow commands for any project. Scaffolds a complete PRD-to-PR pipeline with multi-platform AI assistant support.

## Install

```bash
npx @brunosps00/dev-workflow init
```

This will:
1. Ask you to select a language (English or Portuguese)
2. Create `.dw/commands/` with 23 workflow commands
3. Create `.dw/templates/` with document templates
4. Create `.dw/rules/` (populated by `/dw-analyze-project`)
5. Install bundled skills (ui-ux-pro-max, security-review, etc.) to `.agents/skills/`
6. Generate skill wrappers for Claude Code, Codex, Copilot, and OpenCode
7. Configure MCP servers (Context7 + Playwright)

Optional dependencies (Playwright browsers, react-doctor, GSD):
```bash
npx @brunosps00/dev-workflow install-deps
```

## Commands

### Planning

#### `/dw-brainstorm`
Facilitates structured ideation before opening a PRD or implementation. Explores multiple directions — conservative, balanced, and bold — with trade-offs for each, then converges on concrete next steps. No code is written or files modified.

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
Validates the implementation against PRD, TechSpec, and Tasks using Playwright MCP for E2E browser automation. Tests happy paths, edge cases, negative flows, and regressions while verifying WCAG 2.2 accessibility compliance. Generates a QA report, documents bugs with screenshot evidence, and detects stub/placeholder pages.

#### `/dw-fix-qa`
Fixes bugs found during QA testing with evidence-driven retesting via Playwright MCP. Runs iterative cycles of identify, fix, retest, updating `QA/bugs.md` and `QA/qa-report.md` with status and retest evidence including screenshots and logs.

#### `/dw-review-implementation`
Compares documented requirements (PRD + TechSpec + Tasks) against actual code as a Level 2 review. Maps each requirement to endpoints and tasks with evidence, identifies gaps, partial implementations, and extra undocumented code. Does not execute fixes — waits for user instruction.

#### `/dw-code-review`
Performs a formal Level 3 code review before PR creation, verifying PRD compliance, code quality (SOLID, DRY, complexity, security), and conformance with project rules in `.dw/rules/`. Runs tests, verifies coverage targets, and generates a persistent report with APPROVED, APPROVED WITH CAVEATS, or REJECTED status.

#### `/dw-refactoring-analysis`
Audits the codebase for code smells and refactoring opportunities using Martin Fowler's catalog. Detects bloaters, change preventers, dispensables, couplers, conditional complexity, and DRY violations, then maps each to a concrete refactoring technique with before/after code sketches. Includes coupling/cohesion metrics, SOLID analysis, and a prioritized action plan (P0-P3).

### Git & PR

#### `/dw-commit`
Analyzes pending changes, groups them by feature or logical context, and creates atomic semantic commits following the Conventional Commits format. Uses allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.

#### `/dw-generate-pr`
Pushes the branch to remote and creates a Pull Request on GitHub with a structured description. Collects information from the PRD and modified files, runs tests, then generates a PR body with summary, changes grouped by module, test plan, and deploy notes.

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
│   ├── commands/          # 23 workflow command files
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

Skills installed to `.agents/skills/` for use by all commands:

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

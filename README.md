# dev-workflow

AI-driven development workflow commands for any project. Scaffolds a complete PRD-to-PR pipeline with multi-platform AI assistant support.

## Install

```bash
npx dev-workflow init
```

This will:
1. Ask you to select a language (English or Portuguese)
2. Create `ai/commands/` with 16 workflow commands
3. Create `ai/templates/` with document templates
4. Create `ai/rules/` (populated by `/analyze-project`)
5. Generate skill wrappers for Claude Code, Codex, Copilot, and OpenCode
6. Configure MCP servers (Context7 + Playwright)

## Commands

### Planning

| Command | Description |
|---------|-------------|
| `/brainstorm` | Explore ideas and directions before starting implementation |
| `/create-prd` | Create a Product Requirements Document with clarification questions |
| `/create-techspec` | Create a Technical Specification from an existing PRD |
| `/create-tasks` | Break down PRD and TechSpec into implementable tasks |

### Execution

| Command | Description |
|---------|-------------|
| `/run-task` | Execute a single task with built-in validation and testing |
| `/run-plan` | Execute ALL tasks sequentially until the plan is complete |
| `/bugfix` | Analyze and fix bugs with automatic triage |

### Quality

| Command | Description |
|---------|-------------|
| `/run-qa` | Run visual QA with browser automation, E2E tests, and accessibility |
| `/fix-qa` | Fix bugs found during QA and retest until stable |
| `/review-implementation` | Review if all PRD requirements were correctly implemented |
| `/code-review` | Formal code review with persisted report |

### Git & PR

| Command | Description |
|---------|-------------|
| `/commit` | Create semantic commits following Conventional Commits |
| `/generate-pr` | Generate a Pull Request with structured description |

### Utilities

| Command | Description |
|---------|-------------|
| `/analyze-project` | Analyze repo stack, patterns, and conventions to generate project rules |
| `/deep-research` | Multi-source research with citation tracking and verification |
| `/help` | Show complete guide of available commands and workflows |

## Workflow

```
/brainstorm
    |
/create-prd  -->  ai/tasks/prd-{name}/prd.md
    |
/create-techspec  -->  ai/tasks/prd-{name}/techspec.md
    |
/create-tasks  -->  ai/tasks/prd-{name}/tasks.md + {N}_task.md
    |
/run-task (or /run-plan for all)
    |
/run-qa  -->  ai/tasks/prd-{name}/QA/
    |
/fix-qa (if bugs found)
    |
/review-implementation  -->  PRD compliance check
    |
/code-review  -->  ai/tasks/prd-{name}/QA/code-review.md
    |
/commit + /generate-pr
```

## Platform Support

| Platform | Wrapper Location | Status |
|----------|-----------------|--------|
| Claude Code | `.claude/skills/` | Full support |
| Codex CLI | `.codex/skills/` | Full support |
| Copilot | `.agents/skills/` | Full support |
| OpenCode | `.agents/skills/` | Full support |

All wrappers point to `ai/commands/` as the single source of truth.

## Project Structure (after init)

```
your-project/
├── ai/
│   ├── commands/          # 16 workflow command files
│   ├── templates/         # Document templates (PRD, TechSpec, etc.)
│   ├── rules/             # Project-specific rules (run /analyze-project)
│   └── tasks/             # PRD directories created by commands
├── .claude/
│   ├── skills/            # Claude Code wrappers
│   └── settings.json      # MCP servers (Context7, Playwright)
├── .codex/skills/         # Codex CLI wrappers
└── .agents/skills/        # Copilot/OpenCode wrappers
```

## Options

```bash
npx dev-workflow init                  # Interactive language selection
npx dev-workflow init --lang=en        # English, skip prompt
npx dev-workflow init --lang=pt-br     # Portuguese, skip prompt
npx dev-workflow init --force          # Overwrite existing files
npx dev-workflow update                # Update commands/templates only
npx dev-workflow help                  # Show help
```

## Getting Started

After running `npx dev-workflow init`:

1. **Run `/analyze-project`** in your AI assistant to generate project rules
2. **Run `/brainstorm`** to start planning a new feature
3. **Run `/help`** to see all available commands and workflows

## License

MIT

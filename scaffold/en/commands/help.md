<system_instructions>
You are a workspace help assistant. When invoked, present the user with a complete guide of available commands, their integration flows, and when to use each one.

## Behavior

- If invoked without arguments (`/help`): show the complete guide below
- If invoked with an argument (`/help create-prd`): show only the detailed section for that command

---

# Command Guide - AI Dev Workflow

## Overview

This workspace uses an AI command system that automates the full development cycle: from planning (PRD) to merge (PR). Commands are in `ai/commands/` and are accessible in supported AI CLIs (e.g., Codex, Claude Code, OpenCode, GitHub Copilot), using the CLI prefix (`/command` or `$command`).

## Main Development Flow

```
┌──────────────┐     ┌─────────────────┐     ┌───────────────┐
│ /create-prd  │────>│/create-techspec │────>│ /create-tasks │
│ (WHAT)       │     │ (HOW)           │     │ (WHEN)        │
└──────────────┘     └─────────────────┘     └───────┬───────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       ▼                           ▼
                              ┌────────────────┐         ┌─────────────────┐
                              │  /run-task     │         │  /run-plan      │
                              │ (one at a time)│         │  (all auto)     │
                              └───────┬────────┘         └────────┬────────┘
                                      │                           │
                                      └─────────┬─────────────────┘
                                                │
                                                ▼
                                      ┌─────────────────┐
                                      │ Validation Lv 1 │ (automatic, embedded)
                                      │ criteria+tests  │
                                      └────────┬────────┘
                                               │
                                ┌──────────────┼──────────────┐
                                ▼              ▼              ▼
                      ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐
                      │  /run-qa     │ │/review-impl. │ │  /code-review       │
                      │ (visual QA)  │ │(PRD compliance│ │ (formal code review)│
                      └──────────────┘ │  Level 2)    │ │ (Level 3)           │
                                       └──────────────┘ └─────────────────────┘
                                                │
                                ┌───────────────┴───────────────┐
                                ▼                               ▼
                      ┌──────────────┐                 ┌────────────────┐
                      │  /commit     │                 │ /commit-all    │
                      │ (one project)│                 │ (submodules)   │
                      └──────┬───────┘                 └───────┬────────┘
                             │                                 │
                             └────────────┬────────────────────┘
                                          ▼
                                ┌──────────────────┐
                                │  /generate-pr    │
                                │ (push + PR + URL)│
                                └──────────────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │  /archive-prd    │
                                │  (post-merge)    │
                                └──────────────────┘
```

## Command Table

### Planning

| Command | What it does | Input | Output |
|---------|-------------|-------|--------|
| `/brainstorm` | Facilitates structured ideation before PRD or implementation | Problem, idea, or context | Options + trade-offs + recommendation |
| `/create-prd` | Creates PRD with min. 7 clarification questions | Feature description | `ai/tasks/prd-[name]/prd.md` |
| `/create-techspec` | Creates technical specification from the PRD | PRD path | `ai/tasks/prd-[name]/techspec.md` |
| `/create-tasks` | Breaks PRD+TechSpec into tasks (max 2 RFs/task) | PRD path | `ai/tasks/prd-[name]/tasks.md` + `*_task.md` |

### Execution

| Command | What it does | Input | Output |
|---------|-------------|-------|--------|
| `/run-task` | Implements ONE task + Level 1 validation + commit | PRD path | Code + commit |
| `/run-plan` | Executes ALL tasks + final Level 2 review | PRD path | Code + commits + report |
| `/bugfix` | Analyzes and fixes bugs (bug vs feature triage) | Target + description | Fix + commit OR PRD (if feature) |
| `/fix-qa` | Fixes documented QA bugs and retests with evidence | PRD path | Code + `QA/bugs.md` + `QA/qa-report.md` updated |

### Research

| Command | What it does | Input | Output |
|---------|-------------|-------|--------|
| `/analyze-project` | Analyzes project structure and generates documentation | Project path | Architecture overview |
| `/deep-research` | Multi-source research with citation tracking and verification | Topic or question | Research report with bibliography |

### Quality (3 Levels)

| Level | Command | When | Generates Report? |
|-------|---------|------|-------------------|
| **1** | *(embedded in /run-task)* | After each task | No (terminal output) |
| **2** | `/review-implementation` | After all tasks / manual | Yes (formatted output) |
| **3** | `/code-review` | Before PR / manual | Yes (`code-review.md`) |

| Command | What it does | Input | Output |
|---------|-------------|-------|--------|
| `/run-qa` | Visual QA with Playwright MCP + accessibility | PRD path | `QA/qa-report.md` + `QA/screenshots/` + `QA/logs/` |
| `/review-implementation` | Compares PRD vs code (RFs, endpoints, tasks) | PRD path | Gap report |
| `/code-review` | Formal code review (quality, rules, tests) | PRD path | `code-review.md` |

### Versioning

| Command | What it does | Input | Output |
|---------|-------------|-------|--------|
| `/commit` | Semantic commit (Conventional Commits) | - | Commit |
| `/commit-all` | Commit across all submodules (inside-out) | - | Commits |
| `/generate-pr` | Push + create PR + copy body + open URL | Target branch | PR on GitHub |

### Maintenance

| Command | What it does | Input | Output |
|---------|-------------|-------|--------|
| `/list-tasks` | Lists tasks and progress for a PRD | PRD path | Status table |
| `/task-summary` | Shows details of a task without executing | Number + path | Task summary |
| `/archive-prd` | Moves completed PRD to `ai/archived/prd/` | PRD path | Archived PRD |
| `/help` | This command guide | (optional) command | This document |

## Review Architecture (3 Levels)

```
LEVEL 1 - Post-Task Validation (automatic, lightweight)
├── Embedded in /run-task
├── Verifies task acceptance criteria
├── Runs tests (pnpm test / npm test)
├── Checks basic patterns (types, imports)
├── No report file
└── If fails: PAUSES execution

LEVEL 2 - PRD Compliance (/review-implementation)
├── Compares ALL RFs from PRD vs actual code
├── Verifies ALL endpoints from TechSpec
├── Checks real status of each task (ignores checkboxes)
├── Identifies gaps, partial implementations, extra code
├── Called automatically at end of /run-plan
└── Available manually

LEVEL 3 - Formal Code Review (/code-review)
├── Everything from Level 2 +
├── Quality analysis (SOLID, DRY, complexity, security)
├── Conformance with project rules (ai/rules/)
├── Tests with coverage
├── Generates code-review.md in PRD directory
└── Status: APPROVED / WITH CAVEATS / REJECTED
```

## Common Flows

### New Feature (Full)
```bash
/brainstorm "initial idea"                      # 0. Explore options and trade-offs
/create-prd                                     # 1. Describe the feature
/create-techspec ai/tasks/prd-name              # 2. Generate tech spec
/create-tasks ai/tasks/prd-name                 # 3. Break into tasks
/run-plan ai/tasks/prd-name                     # 4. Execute all (includes Level 1+2)
/code-review ai/tasks/prd-name                  # 5. Formal code review (Level 3)
/generate-pr main                               # 6. Create PR
/archive-prd ai/tasks/prd-name                  # 7. After merge
```

### New Feature (Incremental)
```bash
/brainstorm "initial idea"                      # 0. Explore options and trade-offs
/create-prd                                     # 1. PRD
/create-techspec ai/tasks/prd-name              # 2. TechSpec
/create-tasks ai/tasks/prd-name                 # 3. Tasks
/run-task ai/tasks/prd-name                     # 4. Task 1 (with Level 1)
/run-task ai/tasks/prd-name                     # 5. Task 2 (with Level 1)
# ... repeat for each task
/review-implementation ai/tasks/prd-name        # 6. PRD review (Level 2)
/code-review ai/tasks/prd-name                  # 7. Code review (Level 3)
/generate-pr main                               # 8. PR
```

### Simple Bug
```bash
/bugfix "bug description"                       # Analyze and fix
/commit                                         # Commit the fix
/generate-pr main                               # PR
```

### Complex Bug
```bash
/bugfix "description" --analysis                # Generate analysis document
/create-techspec ai/tasks/bugfix-name           # TechSpec for the fix
/create-tasks ai/tasks/bugfix-name              # Tasks for the fix
/run-plan ai/tasks/bugfix-name                  # Execute all
/generate-pr main                               # PR
```

### Visual QA (Frontend)
```bash
/run-qa ai/tasks/prd-name                       # QA with Playwright MCP
# If bugs found:
/bugfix "description"                           # Fix each bug
/fix-qa ai/tasks/prd-name                       # Fix + retest full cycle
```

### Deep Research
```bash
/deep-research "topic or question"              # Multi-source research with citations
```

## File Structure

```
your-project/
├── ai/
│   ├── commands/              # Source of truth for commands
│   │   ├── help.md            # This guide
│   │   ├── brainstorm.md
│   │   ├── create-prd.md
│   │   ├── create-techspec.md
│   │   ├── create-tasks.md
│   │   ├── run-task.md
│   │   ├── run-plan.md
│   │   ├── run-qa.md
│   │   ├── code-review.md
│   │   ├── review-implementation.md
│   │   ├── analyze-project.md
│   │   ├── deep-research.md
│   │   ├── bugfix.md
│   │   ├── commit.md
│   │   ├── commit-all.md
│   │   ├── generate-pr.md
│   │   └── archive-prd.md
│   ├── templates/             # Document templates
│   │   ├── prd-template.md
│   │   ├── techspec-template.md
│   │   ├── tasks-template.md
│   │   ├── task-template.md
│   │   └── bugfix-template.md
│   ├── rules/                 # Project-specific rules
│   │   └── *.md
│   ├── tasks/                 # Active PRDs and tasks
│   │   └── prd-[name]/
│   │       ├── prd.md
│   │       ├── techspec.md
│   │       ├── tasks.md
│   │       └── *_task.md
│   └── archived/prd/          # Completed PRDs
├── .codex/skills/             # Codex skills
├── .claude/skills/            # Claude Code skills
├── .opencode/commands/        # OpenCode commands
└── .github/copilot-instructions.md  # Copilot instructions
```

## Tool Integration

Commands work across multiple AI tools, all pointing to the same source `ai/commands/`:

| Tool | Location | Format |
|------|----------|--------|
| **Codex CLI** | `.codex/skills/*/SKILL.md` | Skill referencing `ai/commands/` |
| **Claude Code** | `.claude/skills/*/SKILL.md` | Skill referencing `ai/commands/` |
| **OpenCode** | `.opencode/commands/*.md` | Command referencing `ai/commands/` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Instructions listing the commands |

## FAQ

**Q: What is the difference between `/run-task` and `/run-plan`?**
- `/run-task` executes ONE task with manual control between each one
- `/run-plan` executes ALL automatically with a final review

**Q: Do I need to run `/review-implementation` manually?**
- Not if using `/run-plan` (already included). Yes if using `/run-task` incrementally.

**Q: When to use `/code-review` vs `/review-implementation`?**
- `/review-implementation` (Level 2): Checks if PRD RFs were implemented
- `/code-review` (Level 3): Additionally analyzes code quality and generates a formal report

**Q: Does `/bugfix` always fix directly?**
- No. It performs triage. If it is a feature (not a bug), it redirects to `/create-prd`. If it is a complex bug, it can generate an analysis document with `--analysis`.

**Q: When should I use `/deep-research`?**
- For comprehensive multi-source analysis, technology comparisons, state-of-the-art reviews, or any topic requiring cited evidence. Not for simple lookups or debugging.

</system_instructions>

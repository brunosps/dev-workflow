<system_instructions>
You are a full pipeline orchestrator. This command receives a user's wish and automatically executes the entire development flow, from research to commit, stopping only at critical gates.

<critical>This command MUST execute ALL applicable pipeline steps. Do NOT skip any step. If a step is conditional, evaluate the condition and execute if applicable.</critical>
<critical>The ONLY pause moments are the 3 gates defined below. Between gates, execute everything automatically without asking for confirmation.</critical>
<critical>Each step MUST follow the complete instructions from the corresponding command in `.dw/commands/`. Read and execute the full command, not a summarized version.</critical>

## When to Use
- Use when you want to go from an idea to a PR with minimal manual intervention
- Use for complete features that go through the entire pipeline (research, planning, execution, quality)
- Do NOT use for one-off changes (use `/dw-quick`)
- Do NOT use to fix bugs (use `/dw-bugfix`)
- Do NOT use when you want manual control between each phase (use individual commands)

## Pipeline Position
**Predecessor:** (user's wish) | **Successor:** (PR merge)

## Input Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{WISH}}` | Description of what the user wants to build | "push notification system with per-channel preferences" |

## Approval Gates

The autopilot stops ONLY at these 3 moments:

1. **GATE 1 — PRD**: Presents the generated PRD and awaits user approval before generating techspec/tasks
2. **GATE 2 — Tasks**: Presents the task list and awaits approval before starting execution
3. **GATE 3 — PR**: After automatic commit, asks if the user wants to generate the Pull Request

## Full Pipeline

### Step 1: Codebase Intelligence

<critical>If `.planning/intel/` exists, querying it is MANDATORY before starting.</critical>

- Query `.planning/intel/` via `/gsd-intel` (if available) or `.dw/rules/` to understand project context
- Identify: tech stack, existing patterns, related features

### Step 2: Research (Conditional)

Evaluate whether the topic requires deep research:
- **YES** (run `/dw-deep-research`): new technology for the project, unknown domain, external API integrations, critical architectural decisions
- **NO** (skip to step 3): simple feature in an already mapped domain, refactoring existing code, basic CRUD

If executed, use `standard` mode by default. Incorporate findings into subsequent steps.

### Step 3: Brainstorm

Run `/dw-brainstorm` with accumulated context (intel + research).
- Generate 3 directions
- Automatically converge on the most pragmatic option for the project context
- Do NOT wait for user approval (brainstorm is automatic in autopilot)

### Step 4: PRD

Run `/dw-create-prd` using brainstorm findings.
- Follow all command instructions (clarification questions answered based on accumulated context)
- Generate the complete PRD in `.dw/spec/prd-[name]/prd.md`

### === GATE 1: PRD Approval ===

Present to the user:
- Summary of functional requirements
- Decisions made automatically
- Open questions (if any)

**Wait for explicit approval.** If the user requests changes, adjust and re-present.

### Step 5: TechSpec

Run `/dw-create-techspec` from the approved PRD.
- Follow all command instructions
- Generate in `.dw/spec/prd-[name]/techspec.md`

### Step 6: Tasks

Run `/dw-create-tasks` from PRD + TechSpec.
- Follow all command instructions
- Generate individual tasks in `.dw/spec/prd-[name]/`

### === GATE 2: Tasks Approval ===

Present to the user:
- Task list with brief descriptions
- Dependencies between tasks
- Total effort estimate

**Wait for explicit approval.** If the user requests changes, adjust and re-present.

### Step 7: Design Contract (Conditional)

Evaluate whether tasks involve frontend:
- **YES** (run `/dw-redesign-ui`): if there are tasks with visual components AND the `ui-ux-pro-max` skill is available
  - Generate the design contract in `.dw/spec/prd-[name]/design-contract.md`
  - Do NOT wait for approval (contract is automatic in autopilot, based on PRD requirements)
- **NO** (skip to step 8): purely backend/infra tasks

### Step 8: Execution

Run `/dw-run-plan` with the PRD path.
- Follow ALL command instructions, including GSD integration (plan verification, parallel execution)
- Each task follows `/dw-run-task` with Level 1 validation

### Step 9: Implementation Review (Loop)

Run `/dw-review-implementation` to verify PRD compliance (Level 2).
- If gaps found: fix automatically and re-run the review
- Maximum 3 correction cycles
- Do NOT advance to QA until the review passes

### Step 10: Visual QA

Run `/dw-run-qa` with Playwright MCP.
- Test happy paths, edge cases, negative flows, accessibility
- Document bugs with screenshots

### Step 11: Fix QA (Conditional)

If QA found bugs:
- Run `/dw-fix-qa` to fix and retest
- Loop until stable

### Step 12: Implementation Review (Post-QA)

Run `/dw-review-implementation` again to confirm QA fixes did not break PRD compliance.
- If gaps found: fix and re-run
- Maximum 3 cycles

### Step 13: Code Review

Run `/dw-code-review` (Level 3) for formal review.
- Generate persisted report

### Step 14: Commit

Run `/dw-commit` automatically.
- Semantic commits following Conventional Commits
- Do NOT wait for approval

### === GATE 3: Pull Request ===

Ask the user: **"Commits completed. Do you want to generate the Pull Request?"**

- **YES**: run `/dw-generate-pr` with the target branch
- **NO**: inform that commits are ready and the user can generate the PR manually later

## GSD Integration

<critical>When GSD is installed, ALL GSD integrations from each individual command MUST be executed. The autopilot is not an excuse to skip GSD steps.</critical>

If GSD (get-shit-done-cc) is installed:
- Step 1: use `/gsd-intel` for querying
- Step 8: use plan verification + parallel execution
- All commands: follow their individual GSD sections

If GSD is NOT installed:
- All commands work normally without GSD

## Progress Format

During execution, report progress in this format:

```
=== AUTOPILOT =====================================
  OK [1/14] Codebase Intelligence
  OK [2/14] Research (skipped — known domain)
  OK [3/14] Brainstorm
  OK [4/14] PRD
  PAUSE [GATE 1] Awaiting PRD approval...
===================================================
```

## Closing

At the end, present:
- PR link (if generated)
- Summary: steps executed, steps skipped, estimated time saved
- Suggested next steps (merge, deploy, etc.)

</system_instructions>

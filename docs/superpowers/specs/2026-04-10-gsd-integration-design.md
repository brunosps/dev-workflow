# GSD Integration Design

## Context

The dev-workflow CLI (`@brunosps00/dev-workflow`) provides 19 commands for AI-assisted development workflows. The Get-Shit-Done (GSD) framework (`get-shit-done-cc`, MIT license) provides advanced capabilities our tool lacks: multi-agent orchestration, parallel execution, persistent project memory, plan verification, and codebase intelligence.

This design integrates GSD as an **optional runtime dependency** used internally by our `/dw-*` commands. Users interact only with `/dw-*` — GSD operates behind the scenes as an engine.

### Principles

- **Delegation, not absorption**: Our commands orchestrate and delegate to GSD commands internally
- **Graceful degradation**: If GSD is not installed, commands work as they do today (sequential, no intel, no resume)
- **Single interface**: Users never need to learn `/gsd-*` commands — `/dw-*` is the only surface
- **Namespace isolation**: GSD uses `.planning/`, we use `.dw/` — no directory conflicts

## GSD as Dependency

- **Package**: `get-shit-done-cc` (npm, MIT license)
- **Install**: Added to `lib/install-deps.js`, installed via `npx get-shit-done-cc@latest --claude --local`
- **Requirement**: Node.js 22+ (GSD requirement; our tool requires Node 18+)
- **Detection**: Commands check for GSD availability at runtime; if absent, fall back to current behavior

## Feature 1: `/dw-resume` (New Command)

### Purpose
Answer "where did I leave off?" — restore context from last session and suggest next step.

### Flow
```
1. Read .dw/spec/ for PRDs with pending tasks (tasks.md checkboxes)
2. Read git log --oneline -10 for recent work context
3. If GSD available: delegate to /gsd-resume-work for cross-session state from .planning/STATE.md
4. Cross-reference: last completed task, next pending task, active branch
5. Present: summary of last session + suggested next command
```

### Output
```
## Session Resume

**Last session**: 2h ago, branch feat/prd-user-onboarding
**Completed**: Tasks 1-3 of 6
**Next pending**: Task 4 — "Implement email verification flow"
**Blocked by**: None

**Suggested**: `/dw-run-task .dw/spec/prd-user-onboarding`
```

### Integration Points
- Reads: `.dw/spec/*/tasks.md`, git log, `.planning/STATE.md` (if GSD)
- Writes: Nothing (read-only command)
- Fallback without GSD: Uses only `.dw/spec/` and git log (less context but functional)

## Feature 2: Design Contracts (Evolution of `/dw-redesign-ui`)

### Purpose
Persist approved design decisions as an immutable contract that downstream commands enforce.

### Flow
```
1. dw-redesign-ui proposes 2-3 design directions (existing behavior)
2. User approves one direction
3. NEW: Generate design-contract.md in .dw/spec/prd-[name]/
4. NEW: If GSD available, register contract in .planning/ for cross-session persistence
5. dw-run-task and dw-run-plan read the contract when it exists
6. Contract violations flagged during Level 1 validation
```

### Contract Structure (`.dw/spec/prd-[name]/design-contract.md`)
```markdown
# Design Contract: [Feature Name]

## Approved Direction
- Style: [e.g., Modern Minimalist]
- Approved on: [date]

## Color Palette
- Primary: #1E40AF
- Secondary: #3B82F6
- Background: #F8FAFC
- Text: #1E293B

## Typography
- Headings: Inter, 600
- Body: Inter, 400
- Scale: 1.25 ratio

## Layout
- Grid: 12-column, max-width 1280px
- Spacing scale: 4px base

## Accessibility
- Contrast ratio: minimum 4.5:1
- Touch targets: minimum 44x44px
- Focus indicators: required on all interactive elements

## Component Rules
- Buttons: rounded-lg, primary color, min-height 44px
- Cards: border-radius 12px, subtle shadow
- Forms: label above input, error below
```

### Integration Points
- Created by: `dw-redesign-ui` (after user approval)
- Read by: `dw-run-task`, `dw-run-plan` (during Level 1 validation)
- Persisted by: GSD `.planning/` (if available)
- Fallback without GSD: Contract still works (file-based), just no cross-session state

## Feature 3: Plan Verification (Gate in `/dw-run-plan`)

### Purpose
Validate task plan viability before execution — separate planning from verification.

### Flow
```
1. dw-run-plan starts
2. NEW: Before executing, run verification gate
3. If GSD available: delegate to GSD plan-checker agent (read-only)
   - Analyzes: task dependencies, estimated complexity, risk areas
   - Checks: missing dependencies, circular references, unrealistic scope
   - Output: PASS / FAIL with issues list
4. If FAIL: present issues, suggest fixes, max 3 correction cycles
5. If PASS: proceed to execution
```

### Verification Checks
- Dependency graph is acyclic (no circular blockedBy)
- All referenced files/modules exist in the codebase
- Task scope aligns with PRD requirements (no drift)
- Estimated total complexity is reasonable for task count
- Design contract exists if tasks involve UI (warn if missing)

### Integration Points
- Triggered by: `dw-run-plan` (before task loop)
- Delegates to: `/gsd-plan-phase` plan-checker agent
- Fallback without GSD: Skip verification, execute as today (sequential)

## Feature 4: `/dw-quick` (New Command)

### Purpose
Execute a one-off task with workflow guarantees (atomic commit, validation) without requiring a full PRD.

### Flow
```
1. User: /dw-quick "add loading spinner to dashboard"
2. Read .dw/rules/ for project patterns
3. If GSD available: delegate to /gsd-quick for tracking in .planning/quick/
4. Implement the change following project conventions
5. Run Level 1 validation (tests, lint)
6. Atomic semantic commit
7. Register in quick task history
```

### When to Use
- Small changes that don't justify PRD → TechSpec → Tasks pipeline
- Hotfixes that need tracking but not full ceremony
- Refactoring tweaks, dependency updates, config changes

### Integration Points
- Delegates to: `/gsd-quick` (if available)
- Reads: `.dw/rules/` for project conventions
- Writes: Committed code + `.planning/quick/` tracking (if GSD)
- Fallback without GSD: Implement directly with Level 1 validation, no tracking history

## Feature 5: Parallel Execution (Evolution of `/dw-run-plan`)

### Purpose
Execute independent tasks in parallel using GSD's wave-based execution engine.

### Flow
```
1. dw-run-plan reads tasks.md
2. Plan verification passes (Feature 3)
3. NEW: Analyze blockedBy to build dependency graph
4. NEW: Group tasks into waves:
   - Wave 1: Tasks with no dependencies (can run in parallel)
   - Wave 2: Tasks that depend on Wave 1 completions
   - Wave N: ...
5. If GSD available: delegate each wave to GSD execute-phase
   - Each task runs in isolated git worktree
   - Fresh context per executor (no context rot)
   - Results merged after wave completes
6. If any task in wave fails: pause wave, report, await user decision
7. After all waves: Level 2 review (existing behavior)
```

### Example
```
tasks.md:
  Task 1: Setup database schema (no deps)
  Task 2: Create API endpoints (no deps)
  Task 3: Build frontend components (blockedBy: 2)
  Task 4: Write E2E tests (blockedBy: 1, 2, 3)

Waves:
  Wave 1: [Task 1, Task 2] → parallel
  Wave 2: [Task 3] → after wave 1
  Wave 3: [Task 4] → after wave 2
```

### Integration Points
- Orchestrated by: `dw-run-plan` (replaces sequential loop when GSD available)
- Delegates to: `/gsd-execute-phase` with wave config
- Fallback without GSD: Sequential execution as today
- State: Each wave updates tasks.md checkboxes after completion

## Feature 6: Codebase Intelligence (Evolution of `/dw-analyze-project` + New `/dw-intel`)

### Purpose
Upgrade from one-shot rules generation to incremental, queryable codebase intelligence. Two modes: automatic (commands query internally) and explicit (user queries directly).

### Indexing Flow (via `/dw-analyze-project`)
```
1. dw-analyze-project runs (existing behavior: generates .dw/rules/)
2. NEW: If GSD available, also delegate to /gsd-map-codebase
   - Creates .planning/intel/ with indexed analysis
   - Architectural assumptions, decision spaces, behavioral references
3. Intel is incremental — re-running adds to existing index, doesn't replace
```

### Automatic Queries (inside existing commands)

Each command queries intel at a specific moment for a specific purpose:

| Command | When it queries | What it asks | How it uses the answer |
|---------|----------------|-------------|----------------------|
| `dw-create-prd` | Before generating requirements | "What features already exist in this domain?" | Avoid duplicating existing functionality; reference existing patterns |
| `dw-create-techspec` | When proposing architecture | "What architectural patterns does this project use?" | Align tech decisions with existing patterns; flag deviations |
| `dw-run-task` | Before implementing | "What are the implementation patterns in [target area]?" | Follow conventions for file structure, naming, error handling |
| `dw-code-review` | During analysis | "What conventions and anti-patterns are documented?" | Check for convention violations; prioritize findings |
| `dw-refactoring-analysis` | Before audit | "What tech debt and decision spaces exist?" | Contextualize findings; avoid flagging intentional decisions |
| `dw-redesign-ui` | In audit phase | "What UI patterns, brand rules, and components exist?" | Ensure redesign is consistent with existing design language |

Each integration follows the pattern:
```markdown
## GSD Codebase Intelligence

Se `.planning/intel/` existir, consulte antes de [specific action]:
- Execute internamente: `/gsd-intel "[specific query]"`
- Incorpore os findings no [output section]

Se `.planning/intel/` NÃO existir:
- Use apenas `.dw/rules/` como contexto (comportamento atual)
```

### Explicit Queries: `/dw-intel` (New Command)

User-facing command for direct codebase queries.

**Usage:**
```
/dw-intel "como funciona a autenticação neste projeto?"
/dw-intel "quais padrões de API são usados?"
/dw-intel "qual o fluxo de dados entre frontend e backend?"
```

**Flow:**
```
1. User asks a question about the codebase
2. If .planning/intel/ exists: delegate to /gsd-intel with the query
   - GSD searches indexed intel files for relevant information
   - Returns structured answer with file references
3. If .planning/intel/ does NOT exist:
   - Fall back to reading .dw/rules/ and searching codebase directly
   - Suggest: "Para intel mais rico, execute /dw-analyze-project com GSD instalado"
4. Present answer with source references (file paths, line numbers)
```

**Output format:**
```markdown
## Answer: [topic]

[Structured answer based on codebase intelligence]

### Sources
- `.planning/intel/architecture.md` — [relevant section]
- `src/auth/middleware.ts:45` — [code reference]
- `.dw/rules/backend.md` — [convention reference]
```

### Integration Points
- Indexed by: `dw-analyze-project` (extended, delegates to `/gsd-map-codebase`)
- Queried automatically by: `dw-create-prd`, `dw-create-techspec`, `dw-run-task`, `dw-code-review`, `dw-refactoring-analysis`, `dw-redesign-ui`
- Queried explicitly by: `/dw-intel` (new user-facing command)
- Storage: `.planning/intel/` (GSD managed)
- Fallback without GSD: Only `.dw/rules/` (current behavior, no queryable intel)

## Files to Modify

### New Commands
| File | Language | Description |
|------|----------|-------------|
| `scaffold/pt-br/commands/dw-resume.md` | PT-BR | Session resume + next step |
| `scaffold/en/commands/dw-resume.md` | EN | Session resume + next step |
| `scaffold/pt-br/commands/dw-quick.md` | PT-BR | Ad-hoc task execution |
| `scaffold/en/commands/dw-quick.md` | EN | Ad-hoc task execution |
| `scaffold/pt-br/commands/dw-intel.md` | PT-BR | Queryable codebase intelligence |
| `scaffold/en/commands/dw-intel.md` | EN | Queryable codebase intelligence |

### Modified Commands
| File | Change |
|------|--------|
| `scaffold/*/commands/dw-run-plan.md` | Add plan verification gate + parallel wave execution |
| `scaffold/*/commands/dw-redesign-ui.md` | Add design contract generation + query intel in audit |
| `scaffold/*/commands/dw-analyze-project.md` | Add GSD codebase intelligence indexing |
| `scaffold/*/commands/dw-run-task.md` | Read design contracts + query intel for implementation patterns |
| `scaffold/*/commands/dw-create-techspec.md` | Query intel for architectural patterns |
| `scaffold/*/commands/dw-create-prd.md` | Query intel for existing features/domain context |
| `scaffold/*/commands/dw-code-review.md` | Query intel for conventions and anti-patterns |
| `scaffold/*/commands/dw-refactoring-analysis.md` | Query intel for tech debt and decision spaces |

### Infrastructure
| File | Change |
|------|--------|
| `lib/constants.js` | Add dw-resume and dw-quick to COMMANDS |
| `lib/install-deps.js` | Add GSD installation |
| `scaffold/*/commands/dw-help.md` | Document new commands and GSD integration |

## GSD Detection Pattern

All commands that delegate to GSD should use this pattern:

```markdown
## GSD Integration

Se o GSD (get-shit-done-cc) estiver instalado no projeto:
- [specific GSD feature to use]
- Delegue para `/gsd-[command]` passando [context]

Se o GSD NÃO estiver instalado:
- [fallback behavior — current behavior]
- Sugira: "Para habilitar [feature], execute `npx dev-workflow install-deps`"
```

## Verification Plan

1. `node -e "require('./lib/constants')"` — validate constants load
2. `npm pack --dry-run` — verify package builds with new files
3. Test init in temp dir — verify new commands generate wrappers for all platforms
4. Manual test: run `dw-resume` in a project with pending tasks (with and without GSD)
5. Manual test: run `dw-quick` for a small change (with and without GSD)
6. Manual test: run `dw-run-plan` and verify plan verification gate activates (with GSD)

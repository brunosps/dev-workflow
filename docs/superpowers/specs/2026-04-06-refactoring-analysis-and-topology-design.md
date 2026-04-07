# Design: /dw-refactoring-analysis Command + Topology Analysis in /dw-analyze-project

> Date: 2026-04-06
> Status: Approved

## Context

The dev-workflow pipeline has a gap between `/dw-analyze-project` (maps the project) and `/dw-code-review` (reviews changes before PR). There is no command focused on identifying refactoring opportunities in existing code using a structured methodology.

Additionally, the `/dw-analyze-project` command lacks topological analysis of code dependencies — god nodes, coupling metrics, and dependency graphs that tools like graphify provide.

This spec covers:
1. A new `/dw-refactoring-analysis` command (EN + PT-BR)
2. A topology analysis section added to `/dw-analyze-project` (EN + PT-BR)

## Part 1: /dw-refactoring-analysis Command

### Scope

Systematic audit of code smells and refactoring opportunities using Martin Fowler's catalog. Does NOT cover: style/formatting, performance optimization, or security (covered by other commands).

### Files to Create

- `scaffold/en/commands/dw-refactoring-analysis.md`
- `scaffold/pt-br/commands/analise-refatoracao.md`

### Input Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{PRD_PATH}}` | Path to the PRD folder | `.dw/spec/prd-user-onboarding` |
| `{{TARGET}}` | (Optional) Specific directory or module to focus on | `src/modules/auth` |

### Output

- `.dw/spec/prd-[feature]/dw-refactoring-analysis.md`

### Pipeline Position

Can be executed at any time, but recommended:
- Before starting a feature (understand tech debt in the area)
- After `/dw-review-implementation` (identify post-feature refactoring opportunities)

### Workflow (9 Steps)

#### Step 1: Scope Analysis
- Determine target (specific directory, module, or entire project)
- Identify language and programming paradigm
- Read `.dw/rules/` for project context, architecture, and conventions

#### Step 2: Explore Codebase
- Map directory structure of target area
- Read critical files, entry points, shared utilities
- Document project conventions (naming, organization, testing, DI)

#### Step 3: Clarification Questions
Ask exactly 3 questions before proceeding:
1. Are there specific areas of the codebase with known tech debt you want me to focus on?
2. Are there upcoming changes or features that make certain refactorings more urgent?
3. Are there any constraints on refactoring scope (e.g., no migrations, max N files)?

#### Step 4: Detect Code Smells
Systematic scan in 6 categories, in priority order:

**Bloaters:**
- Long Functions (>15 lines of logic)
- Large Classes/Modules (>300 lines)
- Long Parameter Lists (>3 params)
- Data Clumps (groups of data that appear together repeatedly)
- Primitive Obsession (using primitives instead of small objects)

**Change Preventers:**
- Divergent Change (one class changed for multiple unrelated reasons)
- Shotgun Surgery (one change requires edits in many classes)

**Dispensables:**
- Duplication (identical or near-identical blocks)
- Dead Code (unused exports, unreachable branches)
- Speculative Generality (unused abstractions "for the future")
- Lazy Elements (classes/functions that do too little to justify existence)
- Comments masking poor design

**Couplers:**
- Feature Envy (method uses another class's data more than its own)
- Insider Trading (classes that know too much about each other's internals)
- Message Chains (a.getB().getC().getD())
- Middle Man (class that only delegates to another)

**Conditional Complexity:**
- Nested conditionals (>2 levels deep)
- Repeated switch/case on same discriminator
- Missing guard clauses
- Complex boolean expressions (>3 operands)

**DRY Violations:**
- Near-duplicate blocks (>5 lines with <20% variation)
- Magic numbers / hardcoded strings used in multiple places
- Repeated constant patterns
- Copy-pasted logic that could be parameterized

For each smell found, record:
- File path and line range
- Smell type and category
- Severity tier (critical/high/medium/low)
- Maintainability impact assessment

#### Step 5: Map Refactoring Techniques
Link each smell to a recommended technique with concrete before/after code sketch:

| Smell | Technique |
|-------|-----------|
| Long Function | Extract Function, Decompose Conditional |
| Duplication | Extract Function, Pull Up Method |
| Long Parameter List | Introduce Parameter Object |
| Feature Envy | Move Function |
| Nested Conditionals | Replace with Guard Clauses |
| Repeated Switch | Replace Conditional with Polymorphism |
| Data Clumps | Extract Class |
| Primitive Obsession | Replace Primitive with Value Object |
| Middle Man | Remove Middle Man |
| Message Chains | Hide Delegate |

#### Step 6: Coupling & Cohesion Assessment
- High afferent coupling (Ca): many dependents — risky to change
- High efferent coupling (Ce): many dependencies — fragile
- Circular dependencies between modules
- Mixed-responsibility modules that need extraction or splitting
- Instability ratio: Ce/(Ca+Ce)

#### Step 7: SOLID Analysis
Always applied, severity adjusted to project context:

- **Single Responsibility:** modules/classes with multiple change reasons
- **Open/Closed:** code modified instead of extended for new variants
- **Liskov Substitution:** subclasses that refuse inherited behavior
- **Interface Segregation:** interfaces with stubbed-out or unused methods
- **Dependency Inversion:** high-level modules importing low-level implementations directly

For simpler projects (scripts, flat APIs), flag violations only when they cause measurable maintenance burden, not as theoretical concerns.

#### Step 8: Prioritize & Generate Report
Rank findings by:
- **Impact:** how much maintainability is hurt
- **Frequency:** how prevalent the pattern is
- **Effort:** estimated refactoring cost

Group into tiers:
- **P0:** Blocking development or creating high coupling risk
- **P1:** Significant maintenance burden
- **P2:** Noticeable but manageable
- **P3:** Minor or cosmetic improvements

#### Step 9: Present Summary
- Finding counts by category and severity
- Top 3-5 highest-impact opportunities
- Suggested execution order (quick wins first)
- Complexity tiers: trivial / moderate / significant

### Report Template

```markdown
# Refactoring Analysis — {Feature/Module Name}

> Generated by /dw-refactoring-analysis on {date}
> Scope: {target path or "entire project"}

## Executive Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | {n} | Blocking / high-coupling |
| P1 | {n} | Significant maintenance burden |
| P2 | {n} | Noticeable but manageable |
| P3 | {n} | Minor improvements |

**Top opportunities:**
1. {description} — {file} — {estimated effort}
2. ...
3. ...

## Code Smells

### Bloaters
#### {Smell Name}
- **File:** `{path}:{line_start}-{line_end}`
- **Severity:** {Critical/High/Medium/Low}
- **Impact:** {description of maintainability impact}
- **Current code:**
```{language}
{code snippet showing the smell}
```
- **Recommended technique:** {technique name}
- **After refactoring:**
```{language}
{code sketch showing the improvement}
```

{Repeat for each smell in each category}

## Coupling & Cohesion

### High Coupling Modules
| Module | Ca (in) | Ce (out) | Instability | Risk |
|--------|---------|----------|-------------|------|
| {file} | {n} | {n} | {ratio} | {description} |

### Circular Dependencies
- {module A} <-> {module B} (via {shared dependency})

### Mixed Responsibility
- {module}: {responsibility 1} + {responsibility 2} → suggest split

## SOLID Analysis

### {Principle Name} Violations
- **File:** `{path}`
- **Issue:** {description}
- **Severity:** {adjusted to context}
- **Suggestion:** {concrete fix}

## Prioritized Action Plan

### Quick Wins (< 30 min each)
1. {action} — {file} — {technique}

### Medium Effort (30 min - 2 hours)
1. {action} — {files affected} — {technique}

### Significant Refactoring (> 2 hours)
1. {action} — {files affected} — {approach}
```

### Quality Checklist

- [ ] 3 clarification questions asked before starting
- [ ] Scanned all 6 code smell categories
- [ ] Each smell has file path, line range, and severity
- [ ] Refactoring techniques mapped with before/after code sketches
- [ ] Coupling & cohesion analyzed (Ca, Ce, instability, circulars)
- [ ] SOLID analysis completed (all 5 principles)
- [ ] Findings prioritized into P0-P3 tiers
- [ ] Quick wins identified separately
- [ ] No style/formatting, performance, or security issues included (out of scope)
- [ ] Report saved to correct PRD directory

### Error Handling

- If >50 files in scope: ask user to narrow scope or confirm sampling
- If no test coverage: warn and recommend tests before refactoring
- If unfamiliar framework: note as limitation, don't guess patterns
- If ambiguous smell: flag as "potential" with context justifying current structure

---

## Part 2: Topology Analysis in /dw-analyze-project

### What to Add

A new sub-step **4.1: Topology Analysis** in both EN and PT-BR versions, plus a new output section in the module rules template.

### Analysis Methodology (inspired by graphify)

**God Node Detection:**
- Identify files imported by >10 other files
- Flag barrel files (index.ts) that re-export many modules

**Coupling Metrics:**
- Afferent coupling (Ca): count of files that import this file
- Efferent coupling (Ce): count of files this file imports
- Instability ratio: Ce/(Ca+Ce) — 0 = maximally stable, 1 = maximally unstable

**Hub Detection:**
- Files with both high Ca AND high Ce — these are dangerous because they're both heavily depended on and heavily dependent

**Dependency Graph:**
- ASCII representation of how key modules connect
- Focus on the top 10-15 most connected files, not every file

### Output Section Template (in {module}.md)

```markdown
## Topology Analysis

### Dependency Graph

```
auth.service → user.repository, token.service, config
user.controller → auth.service, user.service, validation.pipe
user.service → user.repository, email.service
email.service → config, templates
```

### Critical Nodes

| File | Ca (in) | Ce (out) | Instability | Classification |
|------|---------|----------|-------------|----------------|
| auth.service.ts | 12 | 4 | 0.25 | God node — high blast radius |
| utils/index.ts | 18 | 0 | 0.00 | Barrel — extremely stable, high blast radius |
| user.controller.ts | 2 | 8 | 0.80 | Unstable — many dependencies, few dependents |

### Circular Dependencies

- auth.service <-> user.service (via shared repository import)
- module-a/index <-> module-b/index (barrel re-export cycle)

### Observations

{Free-form notes: e.g., "The auth module is a hub with 12 dependents — changes here require careful testing across the entire app"}
```

### Files to Modify

- `scaffold/en/commands/dw-analyze-project.md` — add Step 4.1 + output section
- `scaffold/pt-br/commands/dw-analyze-project.md` — add Step 4.1 + output section

### Checklist Items to Add

- [ ] Topology analysis completed (god nodes, coupling metrics)
- [ ] Dependency graph generated for top connected files
- [ ] Circular dependencies identified

---

## Registration

### Files to Update

- `lib/constants.js` — add `refactoring-analysis` (EN) and `analise-refatoracao` (PT-BR) to the commands list
- `lib/wrappers.js` — ensure wrapper generation includes the new command
- `README.md` — add `/dw-refactoring-analysis` to the Commands section under Quality

### Verification

After implementation:
1. Run `npx dev-workflow init --lang=en --force` in a test directory and verify `refactoring-analysis.md` appears in `.dw/commands/`
2. Run `npx dev-workflow init --lang=pt-br --force` and verify `analise-refatoracao.md` appears
3. Verify wrapper files are generated for all platforms
4. Verify `analyze-project.md` (both languages) has the new topology section
5. Verify README lists the new command

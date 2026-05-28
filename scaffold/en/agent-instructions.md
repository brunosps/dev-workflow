<!-- dev-workflow:start -->
# dev-workflow — AI Agent Instructions

This project uses [`@brunosps00/dev-workflow`](https://www.npmjs.com/package/@brunosps00/dev-workflow) (`dw-*` commands) for structured AI-driven development. The commands compose into a PRD → TechSpec → Tasks → Implement → Review → Commit → PR pipeline with hard gates for security, constitution compliance, and verification.

**The whole point of this file:** when the user states an intent that matches the Trigger Map below, run the matching `dw-*` command **without asking permission first** — unless the change is genuinely trivial (see Escape Hatches).

## Auto-Sizing Matrix

Before picking a command from the Trigger Map, gauge the change's actual scope. The same intent ("fix this", "add this") can mean very different amounts of work; the matrix names four sizes and routes each to a different entry point. **Pick the smallest one that fits — under-routing wastes ceremony, over-routing hides scope.**

| Size | What it looks like | Route to |
|------|---------------------|----------|
| **Small** | ≤3 files, no migration, no new endpoint, can be summarized in one sentence. Examples: typo, log message, single-line config, dependency bump, version pin. | Just do it inline. No `dw-*` command. |
| **Medium** | Clear feature or bug, <10 numbered tasks expected, single component or single service, no architectural decisions. Examples: add a form field with validation, fix a regression in a known module, wire a new API endpoint into an existing handler. | `/dw-bugfix` (for bugs) or `/dw-plan` (for features) — straight, not via `/dw-autopilot`. |
| **Large** | Multi-component feature, ≥10 tasks expected, touches multiple modules, has user-visible UX surface AND backend. Examples: add a new entity end-to-end (model + migration + API + UI), introduce a third-party integration, redesign a flow. | `/dw-autopilot "<wish>"` — first invocation plans and stops; second invocation resumes via `/dw-goal` for Run → Review → QA/Fix → Review, then Commit → PR. |
| **Complex** | New domain, ambiguous requirements, architectural decision required, regulatory or compliance surface, or scope that spans multiple PRDs. Examples: introduce event sourcing, rebuild auth, multi-tenancy, a new product line. | `/dw-opportunities` first if the idea is not yet known; otherwise `/dw-brainstorm "<idea>"` (auto-dispatches research/council modes), then `/dw-plan --council` so the techspec stage runs the multi-advisor debate. |

**Safety valve:** if you start in Small or Medium but the work reveals it's actually Large (the inline listing exceeds 5 steps, or `/dw-bugfix` triggers its `Step 5.0` valve), STOP and escalate. There is no flag to bypass. Escalation is the correct outcome.

**Adapted from** [`tech-leads-club/agent-skills/tlc-spec-driven`](https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/skills/(development)/tlc-spec-driven) (CC-BY-4.0). The four-size matrix is theirs; the mapping to `dw-*` commands is dev-workflow-specific.

## Trigger Map

| User intent (literal or paraphrased) | Auto-trigger |
|--------------------------------------|--------------|
| "Implement X" / "Build Y" / "Add feature Z" / "I need ..." / "Create ..." | `/dw-autopilot "X"` |
| "Autopilot this PRD" / "Take this PRD to PR" / continue a bugfix escalation autonomously | `/dw-autopilot --from-prd <slug>` (existing PRD at `.dw/spec/<slug>/`) |
| "Resume autopilot" / "continue after plan" / `autopilot-state.json` has `status: plan_complete` | `/dw-autopilot` (or `/dw-goal --from-autopilot <slug>` if the user specifically asks for the goal step) |
| Pasted error / "X is broken" / "Bug in Y" / failing test screenshot | `/dw-bugfix "X"` |
| "Plan this feature" / "Write a PRD + techspec + tasks" | `/dw-plan "X"` |
| "Write a PRD for X" / "Spec out Y" | `/dw-plan prd "X"` |
| "Design the architecture" / "Make the techspec" | `/dw-plan techspec` |
| "Break this into tasks" | `/dw-plan tasks` |
| "Run this task" (with task ID) | `/dw-run <ID>` |
| "Run all pending tasks" / "Execute the plan" | `/dw-run` |
| "Run this as a goal" / "durable goal" / "long-running objective" | `/dw-goal "<objective>"` |
| "Continue where I left off" | `/dw-run --resume` |
| "Pause work" / "End the session" / "Save where we are" | `/dw-pause` |
| "Resume" / "Where did we stop?" / "Pick up where we left off" | `/dw-resume` |
| "QA this feature" / "Run the test plan" | `/dw-qa` |
| "Fix the QA bugs" | `/dw-qa --fix` |
| "Evaluate the AI feature" / "Test the RAG / classifier" | `/dw-qa --ai` |
| "Walk me through this feature" / "UAT this with me" / "Let's do a manual run-through" | `/dw-qa --uat` |
| "Review this bugfix" / "Code-review fix `<slug>`" | `/dw-review --bugfix <slug>` |
| "QA this bugfix" / "Validate fix `<slug>`" | `/dw-qa --bugfix <slug>` |
| "Review my PR" / "Check code quality" / "Is this ready to ship?" | `/dw-review` |
| "Just the PRD coverage check" | `/dw-review --coverage-only` |
| "Just the code quality review" | `/dw-review --code-only` |
| "Time to commit" / changes are validated and ready | `/dw-commit` |
| "Open a PR" / "Ship this" | `/dw-generate-pr` |
| "Suggest new ideas" / "What should we build next?" / "Find opportunities" / "Roadmap ideas" | `/dw-opportunities` |
| "What security improvements should we consider?" / "Find security opportunities" | `/dw-opportunities "security"` |
| "Brainstorm X" / "Explore this idea" / "Research X" | `/dw-brainstorm "X"` (auto-dispatches grill / prototype / council / research / onepager based on signals) |
| "Code-health audit" / "Find tech debt" / "Refactor opportunities" / "Smells in X" | `/dw-refactor "X"` |
| "Where is X?" / "What uses Y?" / "How is Z structured?" | `/dw-intel "<question>"` |
| "Rebuild the codebase index" / "Refresh intel" | `/dw-intel --build` |
| "Context is heavy" / "Audit token usage" / "Why is the agent slow?" | `/dw-context-budget` |
| "Check dev-workflow install" / "Are agents/wrappers healthy?" | `/dw-harness-audit` |
| "Audit skills" / "Skills feel duplicated or bloated" | `/dw-skill-health` |
| "Redesign this UI" / "Audit and ship a new design" | `/dw-redesign-ui "<target>"` |
| "Audit dependencies" / "Are we behind on packages?" | `/dw-secure-audit --plan` |
| "Scan for vulnerabilities" / "Security check" | `/dw-secure-audit` |
| "Analyze this project" / "Generate rules" | `/dw-analyze-project` |
| "Open a new project" / "Bootstrap a stack" | `/dw-new-project` |
| "Dockerize this" / "Add docker-compose" | `/dw-dockerize` |
| "Functional doc" / "Map screens and flows" | `/dw-functional-doc` |
| "Install Azure skills" / "Setup Microsoft docs MCP" / "Add Azure expertise" / "I'm going to work on Azure" | `/dw-install-azure-skills` |
| "Install AWS skills" / "Setup AWS MCP" / "Add AWS expertise" / "I'm going to work on AWS" | `/dw-install-aws-skills` |

**Priority:** when in doubt between two commands, `/dw-autopilot` is the safest default for any non-trivial feature request. If a planned autopilot has already stopped with `status: plan_complete`, resume it instead of starting a new plan; the execution phase is owned by `/dw-goal`.

## Hard Gates (the commands enforce these — don't bypass)

- **`.dw/constitution.md`**: principles with `severity: high` or `critical` block PRs / techspecs without an ADR justifying the deviation. Missing constitution? Commands auto-install defaults at `severity: info` (non-blocking) and continue — never blocks on absence.
- **`.dw/spec/<prd>/tasks-validation.md`**: auto-generated at the end of `/dw-plan tasks`. Any FAIL dimension blocks user approval until resolved or explicitly overridden.
- **Verification**: `/dw-generate-pr` requires a fresh `dw-verify` PASS (tests + lint + build) after the last edit.
- **Security**: TS / Python / C# / Rust projects must pass `/dw-secure-audit` (OWASP + Semgrep + gitleaks + Trivy + lockfile audit) before the PR opens.

## Escape Hatches — do NOT auto-trigger

When any of these apply, answer directly and do **not** invoke a `dw-*` command:

- One-line typo, rename, import sort, comment fix.
- Pure exploration: "how does this work?", "show me X", "explain Y".
- Aesthetic preference: "I prefer this style" — apply, don't run a pipeline.
- User explicitly says "do this directly" / "skip autopilot" / "no need for a PRD" — honor it.
- The conversation is already inside a `dw-*` flow (you're already executing tasks; don't start a new pipeline).

## Zoom-out pattern (for unfamiliar code areas)

When you land in an area of the codebase you don't know and orientation costs more than the task itself, **don't dive into files first** — ask `dw-code-explorer` to produce a map. Give it the project's domain glossary (`.dw/rules/index.md`) and tell it: "zoom out one level — show me the relevant modules, their public surfaces, who calls them, and the data flow between them, using domain glossary vocabulary." Get the lay of the land, then dive. This avoids the trap of reading the deepest file first and reconstructing the architecture from leaves upward.

Adapted from [`mattpocock/skills/zoom-out`](https://github.com/mattpocock/skills/tree/main/zoom-out) (MIT).

## Subagent Dispatch Discipline

Project agents are installed in `.claude/agents/`, `.opencode/agent/`, `.agents/agents/`, and `.github/agents/` when supported. Claude Code and OpenCode can use native subagents. Copilot receives custom agents. Codex should treat `.agents/agents/` as delegable profiles when subagents are available, or as a manual prompt pack otherwise.

Use a subagent when:

- The task will generate verbose output: logs, tests, broad grep, QA evidence, browser traces, or research notes.
- The task is read-only, parallelizable, and has a clear boundary.
- The task has a compact return value: findings, map, changed files, verification result, or blockers.
- You need an independent review: security, silent failure, language-specific correctness, or PR readiness.

Do not use a subagent when:

- The task needs frequent user dialogue.
- Planning, implementation, and testing share too much live context.
- The change is small enough to do inline.
- The subagent would need the full parent transcript to avoid guessing.
- The delegated task would itself need to spawn other subagents.

Limits:

- Run at most 3 subagents concurrently per workstream.
- Default output should stay near the registry budget, usually 900-1200 words.
- Subagents summarize logs; they return failing lines, paths, commands, decisions, and risks, not full transcripts.
- The parent is the only final synthesizer.
- The parent passes an input packet, not raw conversation history. Use `/dw-subtask-start`, `/dw-subtask-complete`, and `/dw-subtask-resume` for local handoffs.

Claude-only: prefer named subagents for isolated research, review, build, and QA work. Use forks only when the subtask genuinely needs the parent context.

Agent routing:

- Use `dw-code-explorer` before planning or debugging unfamiliar areas.
- Use `dw-build-fixer` only after an actual build/typecheck/lint failure.
- Use `dw-code-reviewer`, `dw-security-reviewer`, and `dw-silent-failure-hunter` during `/dw-review`.
- Use language-specific agents when their module is installed and the diff matches the language.

## Skill Loading Discipline

Skills are compact protocols first. Read the `SKILL.md` entrypoint, then load files under `references/`, `assets/`, `rules/`, or `scripts/` only when the trigger, task, or output requires that deeper material. If a skill feels duplicated, too broad, or expensive for the current task, run `/dw-skill-health`.

## Workflow Reference

```
/dw-autopilot "wish"  ────►  First invocation plans: PRD → TechSpec → Tasks → STOP
/dw-autopilot         ────►  Second invocation resumes: /dw-goal → Commit → PR

  --- OR step-by-step ---

/dw-brainstorm ─► /dw-plan ─► /dw-goal ─► /dw-commit ─► /dw-generate-pr
```

Full command list and contextual help: `/dw-help`.

## Editing this section

This block lives between `<!-- dev-workflow:start -->` and `<!-- dev-workflow:end -->` markers. Anything you write **outside** these markers in `CLAUDE.md` / `AGENTS.md` is preserved on every `dev-workflow update`. Anything **inside** is refreshed from the package — your edits inside the block will be overwritten.

To customize the trigger map permanently, copy the block content to outside the markers (or to a separate file like `.dw/agent-instructions-custom.md`) and edit there.
<!-- dev-workflow:end -->

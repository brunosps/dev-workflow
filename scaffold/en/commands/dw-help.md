<system_instructions>
You are the dev-workflow guide. Display the primary command surface, the typical flow, and contextual shortcuts. Default mode shows the visible command surface; `--advanced` reveals internal/hidden commands.

## When to Use
- User types `/dw-help` to discover commands.
- User types `/dw-help <keyword>` to find a contextual shortcut.
- User types `/dw-help --advanced` to see internal/hidden commands.

## Default mode — primary surface

Display the following (or its pt-br equivalent when invoked from pt-br):

```markdown
# dev-workflow — Primary Commands

Use `/dw-autopilot "wish"` as the gateway for most feature work. The granular commands below give you control when you want it.

## Tier 1 — Gateway (3)

| Command | When |
|---------|------|
| `/dw-autopilot "wish"` | Default entry point in two invocations. First run plans and stops; second run resumes through `/dw-goal`, Security Gate, commit, and PR. |
| `/dw-bugfix "description"` | A bug or error report. Surgical fix or PRD route. |
| `/dw-help [keyword]` | This screen. Pass a keyword for shortcuts. `--advanced` reveals internal commands. |

## Tier 2 — Pipeline granular (10)

| Command | What |
|---------|------|
| `/dw-opportunities [focus]` | Suggest project-specific product, UX, automation, refactor, and security opportunities before you have a concrete idea. Flag: `--research`. |
| `/dw-brainstorm "idea"` | Refine a concrete idea before PRD. Flags: `--onepager`, `--council`, `--research`. |
| `/dw-plan "feature"` | PRD → TechSpec → Tasks sequentially with checkpoints. Stages: `prd`, `techspec`, `tasks`. |
| `/dw-run [task-id]` | Execute all pending tasks or a single one. Flag `--resume`. |
| `/dw-review` | Level 2 (PRD coverage) + Level 3 (code quality/security). Flags: `--coverage-only`, `--code-only`, `--bugfix <slug>`. |
| `/dw-qa` | Mode-aware QA (UI / API auto-detect). Flags: `--fix`, `--api`, `--ai`, `--uat`, `--bugfix <slug>`. |
| `/dw-pause` | Save session state, decisions, blockers, todos, and open loops into `.dw/STATE.md`. |
| `/dw-resume` | Read `.dw/STATE.md`, show a TLDR, and suggest the next `dw-*` command. |
| `/dw-commit` | Atomic Conventional Commits for pending work. |
| `/dw-generate-pr [target]` | Push branch, draft PR body, open browser. |

## Tier 3 — Specialty (11)

| Command | What |
|---------|------|
| `/dw-analyze-project` | Scan the repo, write `.dw/rules/`, offer `.dw/constitution.md`, generate `.dw/rules/concerns.md`, and synthesize frontend `DESIGN.md` when tokens exist. |
| `/dw-redesign-ui "target"` | Audit, propose 2-3 design directions, ship. Enforces UI grounding + WCAG; can run the deterministic impeccable slop detector. |
| `/dw-refactor "target"` | Audit code-health and tech debt with Fowler smells, deep-modules analysis, and behavior-preserving test gates. |
| `/dw-functional-doc` | Map screens + flows into a functional doc validated with Playwright; uses WSL-resilient browser resolution. |
| `/dw-context-budget` | Audit context overhead from commands, skills, agents, instructions, and MCPs. |
| `/dw-harness-audit` | Score dev-workflow install health: wrappers, agents, MCPs, gates. |
| `/dw-skill-health` | Audit skills and agents for bloat, duplication, and missing references. |
| `/dw-new-project` | Interview-driven bootstrap (stack + infra + docker-compose + CI). |
| `/dw-dockerize` | Detect stack, propose Dockerfile + docker-compose for dev/prod. |
| `/dw-install-azure-skills` | Opt-in Azure skills + Microsoft Learn MCP setup. Interactive category selection. |
| `/dw-install-aws-skills` | Opt-in AWS skills + AWS MCP Server setup. Requires `uv`, AWS CLI, and credentials. |

## Workflow at a glance

`/dw-autopilot "wish"` runs planning first and stops. Reinvoke it to resume through `/dw-goal`, Security Gate, commit, and PR. Step-by-step:

```
/dw-opportunities → /dw-brainstorm → /dw-plan → /dw-goal → /dw-secure-audit → /dw-commit → /dw-generate-pr
```

## Advanced / internal commands

Pass `--advanced` to `/dw-help` to see internal commands (`dw-adr`, `dw-intel`, `dw-secure-audit`, `dw-goal`, `dw-find-skills`, `dw-update`, `dw-subtask-start`, `dw-subtask-complete`, `dw-subtask-resume`) that are usually invoked by other commands.
```

## Advanced mode — `--advanced` flag

When invoked with `--advanced`, ALSO show:

```markdown
# dev-workflow — Advanced / Internal Commands

These are auto-invoked by primary commands but available standalone.

## Tier 4 — Hidden (9)

| Command | What | Invoked by |
|---------|------|------------|
| `/dw-adr "decision"` | Record an Architecture Decision Record at `.dw/spec/<prd>/adrs/`. | `/dw-plan techspec --council`, deviations from constitution |
| `/dw-intel "question"` | Query codebase intelligence; `--build` (re)indexes `.dw/intel/`. | `/dw-plan`, `/dw-review`, `/dw-bugfix` |
| `/dw-secure-audit` | OWASP + Semgrep SAST + gitleaks secrets + Trivy SCA/IaC + lockfile + supply-chain scan. Hard gate. Flags: `--scan-only`, `--plan`, `--execute`. | `/dw-review`, `/dw-autopilot`, `/dw-generate-pr` |
| `/dw-goal "<objective>"` | Durable objective contract with `.dw/goals/`; bridges to Codex native `/goal` when available. | `/dw-autopilot` after planning |
| `/dw-find-skills "query"` | Search npx skills ecosystem, vet, install. | manual when extending the bundle |
| `/dw-update` | Update dev-workflow to latest npm release with rollback snapshot, then run listed post-update actions (`/dw-analyze-project`, `/dw-intel --build`, `/dw-harness-audit`, `/dw-skill-health`) when applicable. | manual maintenance |
| `/dw-subtask-start "goal"` | Create a minimal input packet for a subagent. | parent agent before delegation |
| `/dw-subtask-complete <slug>` | Record a structured child-session handoff. | subagent / child session |
| `/dw-subtask-resume` | Consume and archive pending handoffs for parent synthesis. | parent agent after delegation |
```

## Keyword mode — `/dw-help <keyword>`

Match the keyword and suggest:

| Keyword | Suggest |
|---------|---------|
| `prd`, `spec`, `plan`, `architecture`, `techspec`, `tasks` | `/dw-plan` (with appropriate stage flag) |
| `bug`, `error`, `broken`, `fix` | `/dw-bugfix` |
| `run`, `execute`, `implement` | `/dw-run` |
| `goal`, `objective`, `long-running`, `resume autopilot` | `/dw-goal` or `/dw-autopilot` if `autopilot-state.json` exists |
| `pause`, `save state`, `end session` | `/dw-pause` |
| `resume`, `continue`, `where did we stop` | `/dw-resume` |
| `review`, `quality`, `audit code` | `/dw-review` |
| `qa`, `test plan`, `e2e` | `/dw-qa` |
| `commit`, `git` | `/dw-commit` |
| `pr`, `pull request`, `merge` | `/dw-generate-pr` |
| `idea`, `brainstorm`, `explore` | `/dw-brainstorm` |
| `opportunities`, `what next`, `roadmap`, `new ideas`, `features` | `/dw-opportunities` |
| `research`, `compare`, `state of the art` | `/dw-brainstorm --research` |
| `refactor`, `smell`, `code health`, `tech debt` | `/dw-refactor` |
| `ui`, `design`, `redesign` | `/dw-redesign-ui` |
| `intel`, `where is`, `what uses` | `/dw-intel` (or `--build` to (re)create the index) |
| `context`, `tokens`, `slow agent` | `/dw-context-budget` |
| `harness`, `install`, `wrappers`, `agents` | `/dw-harness-audit` |
| `update`, `upgrade`, `latest`, `post-update` | `/dw-update` |
| `design.md`, `design authority`, `concerns map` | `/dw-analyze-project` (also listed as a post-update action when missing) |
| `subagent`, `subtask`, `handoff`, `delegate` | `/dw-subtask-start` or `/dw-subtask-resume` |
| `skills`, `skill health`, `bloat` | `/dw-skill-health` |
| `analyze`, `rules`, `conventions` | `/dw-analyze-project` |
| `constitution`, `principles` | `/dw-analyze-project` (Step 8 generates the constitution) |
| `security opportunities`, `hardening ideas`, `improve security` | `/dw-opportunities "security"` |
| `security`, `vulnerabilities`, `cve`, `deps`, `audit deps` | `/dw-secure-audit` |
| `secret`, `sast`, `semgrep`, `gitleaks`, `trivy` | `/dw-secure-audit` |
| `adr`, `decision` | `/dw-adr` (also auto-invoked from `/dw-plan --council`) |
| `docker`, `compose`, `container` | `/dw-dockerize` |
| `new project`, `bootstrap`, `scaffold` | `/dw-new-project` |
| `functional doc`, `screen map`, `e2e doc` | `/dw-functional-doc` |
| `wsl`, `browser`, `playwright browser`, `cdp` | `npx @brunosps00/dev-workflow setup-wsl-browser` installs the optional user-level reverse relay for CDP fallback on WSL NAT |
| `azure`, `microsoft learn`, `azure skills` | `/dw-install-azure-skills` |
| `aws`, `aws mcp`, `aws skills` | `/dw-install-aws-skills` |
| `incident`, `outage`, `postmortem`, `sev-1`, `sev-2` | (Skill `dw-incident-response` auto-invoked from `/dw-bugfix` for prod-critical) |
| `eval`, `llm`, `ai feature`, `rag` | (Skill `dw-llm-eval` invoked from `/dw-plan tasks`, `/dw-review`, `/dw-qa --ai`) |

If no keyword matches, show the default surface and a note: "Keyword `<word>` not recognized — see commands above."

## FAQ

**Q: I'm not sure where to start with a new feature.**
- Use `/dw-autopilot "what you want"`. First invocation runs PRD → TechSpec → Tasks and stops; second invocation resumes through `/dw-goal`, Security Gate, commit, and PR.

**Q: Do I have to use `/dw-autopilot`?**
- No. The granular pipeline (`/dw-brainstorm` → `/dw-plan` → `/dw-goal` or `/dw-run`/`/dw-qa`/`/dw-review` → `/dw-secure-audit` → `/dw-commit` → `/dw-generate-pr`) gives you control at each step.

**Q: I just want to fix a bug.**
- `/dw-bugfix "<bug description>"`. It triages (bug vs feature vs scope), asks 3 questions, then fixes or routes to a PRD if scope is large.

**Q: How do I check if my project follows good patterns?**
- `/dw-analyze-project` writes `.dw/rules/`. Then any command reads those rules for compliance.

**Q: Where does security fit?**
- `/dw-review` auto-invokes `/dw-secure-audit` for supported stacks; `/dw-autopilot` treats it as the named gate before commit/PR; `/dw-generate-pr` enforces the latest approved summary.

**Q: How do I get more flow recommendations during ideation?**
- `/dw-opportunities` scans the installed project and suggests product, UX, automation, refactor, and security opportunities.
- `/dw-brainstorm "idea" --council` adds a multi-advisor stress-test debate.
- `/dw-brainstorm "topic" --research` runs a deep multi-source citation pipeline.

**Q: Where do AI features get evaluated?**
- The `dw-llm-eval` skill is auto-invoked from `/dw-plan tasks` (eval-plan subtask), `/dw-review` (AI feature gate), and `/dw-qa --ai` (run reference dataset).

**Q: What happened to all the other commands?**
- v1.0.0 consolidated the old command surface. Mergers: create-prd/techspec/tasks → `/dw-plan`; run-task/run-plan → `/dw-run`; code-review/review-implementation → `/dw-review`; run-qa/fix-qa → `/dw-qa`; security-check/deps-audit → `/dw-secure-audit`; map-codebase → `/dw-intel --build`; deep-research → `/dw-brainstorm --research`; refactoring-analysis now routes to `/dw-refactor`. Removed: revert-task (use `git revert` directly).

</system_instructions>

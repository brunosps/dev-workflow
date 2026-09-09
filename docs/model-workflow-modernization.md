# Model-aware workflow modernization

The workflow now keeps discovery short, selects executors during task breakdown, and continues an approved implementation through validation. It remains portable across Codex, Claude Code, Copilot and OpenCode. Requests only to plan or report status do not authorize implementation.

## Execution interface

### Upgrading existing installations

Normal `update` reconciles managed commands, skills, references, wrappers and instruction blocks; no forced conversion is needed. Version 2.3.0 also delivers `.dw/config/routing-defaults.json` as a managed reference while preserving the owner's active `routing.json`. Skill health compares candidates and proposes changes after capability checks. Approved assignments, schema 1.0 plans, goal/session progress and template overrides remain intact. New plans use schema 1.1; overrides that shadow new defaults are reported for review.

`dw-update` reads the installed version from `.dw/install-state.json`, checks delivered contracts and asks the agent to read its refreshed instructions. A release check initialized the actual 2.2.0 source in isolated EN/PT-BR projects and upgraded both to 2.3.0 successfully. A regression test exercises repeated legacy upgrades, current candidate refresh, preservation of owner state/overrides and local execution of a legacy plan. The release suite now has 129 passing tests.

Task and task-index templates use schema `1.1`. Each new plan has an `execution-plan.json` companion with task IDs/dependencies and an assignment: complexity, rationale, tool, model, effort, agents and approved fallbacks. The localized installed `execution-contract.md` defines the format and approval semantics. Schema `1.0` task documents remain usable; missing execution metadata defaults to local execution.

Claude may propose Codex workers and Codex may propose Claude workers. Selection occurs in task breakdown, based on ambiguity, risk and scope. External model/effort values are resolved before approval. Changes to saved assignments require current explicit instructions or an approved fallback. Installed CLI presence does not establish authentication, model access or permission to delegate.

`workflow-contract.mjs` validates JSON graph/assignment structure, resolves available approved tools, reports ready tasks and compares known verification fingerprints. It does not launch CLIs, infer consent, authenticate providers or generate fingerprints. Agents inspect actual state and use the documented adapter protocol. This keeps orchestration portable rather than adding a second autonomous runtime.

Dependent tasks share an execution branch/worktree sequentially, including when their provider differs. Only one writer owns a worktree. Independent branches need a planned integration path. The parent inspects worker results, routes corrections and continues the plan. Integration into the owner's branch and publication require applicable authorization.

Resume uses execution-state.json, exact task/provider/session identity, logs and actual worktree changes. Missing sidecars are recovered from task-specific logs; otherwise a new session reconstructs the task in the same worktree. No blind latest-session selection or destructive reset.

## Context and evidence

The package validates internal budgets: managed instructions ≤6000 bytes per locale, skill entrypoints ≤8000 bytes, descriptions ≤250 characters. These are maintenance limits, not model context capacities. Audits distinguish permanent instructions, discovery metadata and on-demand documents; they do not count all disk files as simultaneous context.

| Surface | Before | After |
|---|---:|---:|
| English managed instructions | 12,929 bytes | 4,873 bytes |
| Portuguese managed instructions | 13,429 bytes | 5,063 bytes |

Skill-specific catalogs/procedures moved to routed references; essential scope, boundaries and structured returns remain discoverable. Root maintenance instructions retain required checks, parity and version/changelog restrictions.

Verification follows required project gates and relevant acceptance criteria. Matching command/input/environment/scope evidence can be reused across messages/checkpoints. Source, environment or scope changes invalidate affected records. Numeric scores are diagnostic, never the acceptance gate. Test templates no longer impose generic coverage percentages, mandatory mocks or a test for each low-impact edit.

## Installation and compatibility

Command names, profiles and registries remain available. Init copies the new references, helper and templates; repeated update preserves local routing.json and instructions outside managed markers. New installations receive dated model candidates; existing owner choices are not rewritten. The Codex candidates are Luna (light), Sol (standard) and Astra (heavy); Claude retains configurable tier aliases. Account/CLI compatibility must be checked when proposing the task matrix.

The local adapter capability inspection used codex-cli 0.153.4 and Claude Code 2.1.265. Initial and resume help differ, so permission flags must be resolved for each command. Worktrees do not justify permission bypass. Copilot remains capability-checked at dispatch; no Copilot runtime compatibility claim is made here.

## Evaluation record

Baseline: 118 repository tests and registry/plugin validation passed before edits. Independent instruction walkthroughs used two scenarios: Claude coordinating dependent Codex tasks, and Codex coordinating resume of partial Claude work after source changes and a missing sidecar. The initial walkthrough identified disconnected dependency branches, repeated permission pauses, repeated full gates, blind latest-session recovery and destructive resets. The revised walkthrough found coherent primary flows and identified stale plan-check/commit/resume references, which were corrected as well.

Validation after implementation: 125 repository tests passed; `npm run validate` passed; all 26 skill entrypoints passed Skill Creator frontmatter validation; `npm run build:plugin` regenerated synchronized manifests.

Automated scenarios exercise approved cross-tool assignment persistence, dependency ordering, unavailable tools/fallbacks, legacy local execution, invalid graphs, evidence invalidation and both-locale repeated installation/update. Contract checks retain security/worktree boundaries and relocated discovery routes. Skill frontmatter validation checks all bundled entrypoints.

This is instruction walkthrough and deterministic fixture validation, not a live multi-provider benchmark. No paid model dispatch, account access test, token/cost saving or latency improvement is claimed. Before benchmarking real providers, select available models and authorized environments, then record task correctness, unnecessary pauses, redundant checks, observed tokens/time and actual failures.

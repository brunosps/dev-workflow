<system_instructions>
# Claude runner

Use `dw-cli-run` for the shared protocol. Consume the approved task assignment and return to the parent for review, corrections and continuation. Standalone invocation accepts an explicitly prepared prompt without requiring a PRD. WRITE requires a dedicated secondary worktree; READ-ONLY follows the skill’s enforced read-only rules. The worker never merges or pushes.

Run the examples with cwd set to `<WORKTREE>` by the process launcher. Substitute arguments safely, preferably as a subprocess argument array. Placeholder permission arguments mean the existing approved profile, not a bypass flag. Preserve effective permissions on resume; initial and resume commands may support different flags. Validate both help outputs before dispatch.

## Claude adapter table

| Slot | Value |
|---|---|
| `DISPATCH` | `claude -p --session-id "<SESSION_ID>" --model "<MODEL>" --effort "<EFFORT>" <PERMISSIONS> --output-format stream-json --include-partial-messages --verbose < "<PROMPT>" > "<AUDIT>/<slug>.log" 2>&1` |
| `AUDIT` | `.dw/cli-run` — durable audit logs, session sidecars and last-message captures. Outside the worktree on purpose: authorized cleanup must not erase the evidence. Created by `init`, machine-local (gitignored). |
| `STREAM` | `--output-format stream-json --verbose` |
| `MODEL` | `--model "<MODEL>"` |
| `EFFORT` | `--effort "<EFFORT>"` |
| `AUTO` | <PERMISSIONS> — approved non-interactive profile; retain existing configuration |
| `AUTO_READONLY` | `--permission-mode plan --tools "Read,Grep,Glob" --strict-mcp-config` |
| `NO_MCP` | Select only capabilities needed, if supported; preserve user configuration otherwise |
| `RESUME <id>` | `claude --resume "<SESSION_ID>" -p --model "<MODEL>" --effort "<EFFORT>" <RESUME_PERMISSIONS> --output-format stream-json --include-partial-messages --verbose < "<FOLLOWUP_PROMPT>" >> "<AUDIT>/<slug>.log" 2>&1` |
| `SESSION_ID` | UUID generated before dispatch (`node -e "console.log(require('node:crypto').randomUUID())"`) → `<AUDIT>/<slug>.session` |
| `DONE_SIGNAL` | `result` with its subtype |
| `USAGE` | `result.usage` and reported `total_cost_usd` |

Create/reuse through `/dw-worktree create <slug>`; after authorized integration, `/dw-worktree merge <slug>` owns merge and safe cleanup. Workers return to the parent and never invoke integration themselves.

## Model selection and resume

Resolve concrete model/effort at task breakdown using `.dw/config/routing.json`, current provider metadata and the installed tool. Do not embed a fixed strongest-to-lightest model list in this adapter. Supported effort values depend on model/version; low, medium, high, xhigh and max are candidates only when supported. No mandatory escalation to the ceiling.

Store task, provider, worktree, approved assignment, session ID and audit path before handoff. If the session sidecar is absent, recover the exact task session from its log; never blindly continue the latest cwd session. If identity cannot be proven, start a new session from saved state and the actual diff, preserving partial work. Provider sessions are not portable across CLIs.

Return the `dw-cli-run` Structured Return with evidence and the exact supported resume command. The parent continues the approved plan; merge/push/publication require applicable authorization.

Capability inspection: Claude Code 2.1.265.
## Stops

This command runs under `.dw/references/automode.md`: the approved task assignment authorizes the
dispatch, and the stops below are the complete set. Each persists the worktree, audit log and session
sidecar, reports the exact question with the supported resume command, and exits `BLOCKED`.

1. The adapter table is missing — `dw-cli-run` returns `BLOCKED` without it.
2. The approved permission profile cannot be resolved from the installed CLI's help output.
3. A WRITE dispatch has no dedicated worktree.
4. The worker's diff touches a protected path, or a suspected secret appears in it.
5. Session identity cannot be proven on resume and partial work would be at risk.
6. Integration, merge or push is reached — the worker never performs these and returns to the parent.
7. A floor invariant would have to be crossed (`.dw/references/invariants.md`).

Being unable to resolve a model is not a stop when an approved fallback exists. A completed turn is not
proof of task success: completion needs the terminal event, the process outcome and inspected files.

</system_instructions>

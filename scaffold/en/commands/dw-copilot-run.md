<system_instructions>
# Copilot runner

Use `dw-cli-run` for the shared protocol. Consume the approved task assignment and return to the parent for review, corrections and continuation. Standalone invocation accepts an explicitly prepared prompt without requiring a PRD. WRITE requires a dedicated secondary worktree; READ-ONLY follows the skill’s enforced read-only rules. The worker never merges or pushes.

Run the examples with cwd set to `<WORKTREE>` by the process launcher. Substitute arguments safely, preferably as a subprocess argument array. Placeholder permission arguments mean the existing approved profile, not a bypass flag. Preserve effective permissions on resume; initial and resume commands may support different flags. Validate both help outputs before dispatch.

## Copilot adapter table

| Slot | Value |
|---|---|
| `DISPATCH` | `copilot -p "<PROMPT_TEXT>" --model "<MODEL>" <PERMISSIONS> --output-format json > "<AUDIT>/<slug>.log" 2>&1` |
| `STREAM` | `--output-format json` (verify installed CLI) |
| `MODEL` | `--model "<MODEL>"` |
| `EFFORT` | Use `default` when no effort flag is supported; never invent a flag |
| `AUTO` | <PERMISSIONS> — approved non-interactive profile; retain existing configuration |
| `AUTO_READONLY` | Resolve enforced read-only tool controls from installed help; block READ-ONLY if unavailable |
| `NO_MCP` | Select only capabilities needed, if supported; preserve user configuration otherwise |
| `RESUME <id>` | `copilot --resume="<SESSION_ID>" -p "<FOLLOWUP_TEXT>" --model "<MODEL>" <RESUME_PERMISSIONS> --output-format json >> "<AUDIT>/<slug>.log" 2>&1` |
| `SESSION_ID` | Capture exact ID from this task’s stream; verify event schema against installed CLI → `<AUDIT>/<slug>.session` |
| `DONE_SIGNAL` | Provider terminal record plus process exit and inspected report |
| `USAGE` | Reported usage fields only; unknown if absent |

Create/reuse through `/dw-worktree create <slug>`; after authorized integration, `/dw-worktree merge <slug>` owns merge and safe cleanup. Workers return to the parent and never invoke integration themselves.

## Model selection and resume

Resolve concrete model/effort at task breakdown using `.dw/config/routing.json`, current provider metadata and the installed tool. Do not embed a fixed strongest-to-lightest model list in this adapter. Supported effort values depend on model/version; low, medium, high, xhigh and max are candidates only when supported. No mandatory escalation to the ceiling.

Store task, provider, worktree, approved assignment, session ID and audit path before handoff. If the session sidecar is absent, recover the exact task session from its log; never blindly continue the latest cwd session. If identity cannot be proven, start a new session from saved state and the actual diff, preserving partial work. Provider sessions are not portable across CLIs.

Return the `dw-cli-run` Structured Return with evidence and the exact supported resume command. The parent continues the approved plan; merge/push/publication require applicable authorization.

Capability inspection: Copilot adapter requires installed-version capability validation.
</system_instructions>

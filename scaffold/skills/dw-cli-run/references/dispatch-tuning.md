# Dispatch diagnostics and tuning

Read when configuring a provider, diagnosing a failed dispatch, or proposing an approved escalation.

## Configuration

Inspect CLI version/help for supported flags. Model identifiers and effort support depend on the selected model, provider, account and CLI; help alone is not an availability check. Use project routing candidates and current official provider documentation to propose concrete assignments at task breakdown. Do not silently overwrite `.dw/config/routing.json` during updates.

For legacy plans, `by_commit_type` may suggest a tier; sensitive surfaces and actual complexity take precedence. An approved task assignment wins over routing defaults. Agent profiles keep `model: inherit`; dispatch overrides belong in the task plan.

## Permissions and MCP

Use the approved permission profile for WRITE and enforced read-only controls for READ-ONLY. Preserve the same boundary on resume. Do not use bypass flags as a response to a generic network/test failure. Identify the failing operation and request only missing access if existing authorization does not cover it.

Load MCP capabilities needed by the task, retaining user configuration. Claude supports `--strict-mcp-config` with an explicit config for selected servers. On Codex, a TOML override such as `mcp_servers='{}'` must not be assumed to remove inherited entries: confirm effective configuration before claiming zero servers. If no selective mechanism is available, retain configuration and report the overhead. Do not drop user rules/auth/config wholesale for a faster start.

## Review and escalation

Parent re-gate (independent) checks the actual implementation and acceptance criteria. It can reuse matching verification evidence after checking command, inputs, environment, scope and output. It need not buy another provider invocation solely to repeat passing commands. Where a specialized independent reviewer adds value, use the approved agent assignment.

Fix ordinary defects with the current executor. Escalate model/effort only when the diagnosis identifies a capability limit and the alternative is in the approved plan. Preserve the same session when supported; otherwise reconstruct from durable state in the same worktree. Never discard partial edits. Provider errors, missing credentials, resource limits and permission failures do not automatically justify a stronger model.

Stop when the task is accepted or a concrete blocker prevents further progress; a 0–10 self-score neither proves quality nor authorizes endless retries. Report exhausted approved alternatives and preserve the branch for the owner.

## Process handling

Capture the actual process handle/PID on launch. Use its completion/exit status plus the provider's terminal event and final report. Cancel only that task's process through the host handle; do not infer task identity from a broad process-name match. Keep audit logs outside worktrees so authorized cleanup cannot erase evidence.

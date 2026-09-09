# Context and memory budget

Read when memory grows or repeated exploration obscures the active task. Context capacity and compaction behavior vary by host/model; do not assume a universal 40k active limit or 120k reserve. A model may expose telemetry; label estimates and unknown usage accurately.

Keep relevant requirements, constraints, decisions, pending work and evidence available. Read sections or query indexes when that answers the question. Comparing PRDs/designs or tracing source plus dependencies can require multiple sources; do not prohibit necessary co-loading. Avoid bulk-loading unrelated archived summaries or task memories.

Use concise durable memory: target MEMORY.md at most 6KB and per-task memory at most 3KB, moving detailed logs to linked artifacts. These are project maintenance targets, not model capacity claims or task-completion gates. Preserve unresolved decisions, acceptance criteria, session identity and evidence when compacting.

Repeated reads, growing summaries and confused task boundaries are reasons to inspect context use, not proof of exceeding a hidden token threshold. Update the checkpoint if context limits threaten continuity; otherwise continue authorized work. Do not promise to evict individual messages from a host's context.

Use `../../dw-codebase-intel/references/query-patterns.md` for indexed queries when useful. Verification failures still require diagnosing actual code/environment; do not attribute them to context size without evidence.

## Attribution

The earlier context-budget guidance adapted tech-leads-club's [tlc-spec-driven](https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/skills/(development)/tlc-spec-driven) (CC-BY-4.0, Felipe Rodrigues). This revision retains scoped retrieval and durable handoffs; rejects universal token thresholds and unconditional anti-co-loading rules. See docs/skills-ecosystem-comparison.md in the package source for the modernization decision.

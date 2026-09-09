# Composing plan checks and execution

`/dw-plan tasks` produces the task artifacts and execution assignments. Check requirement coverage, completeness, dependencies, artifact wiring, feasibility and constraints using the plan-checker protocol. The parent can perform this check locally or delegate to an approved independent reviewer; it is not a mandatory extra agent layer.

After PASS, `/dw-run` executes the approved assignments in dependency order. Repair in-scope REVISE findings and recheck; surface material BLOCK decisions. Use executor profiles only when delegation helps and is available. Workers do not recursively dispatch implementation agents.

After tasks, inspect/reuse a valid full review, run applicable QA, correct in-scope defects and repeat checks/review only when invalidated. `/dw-autopilot` continues this approved implementation flow without a forced second invocation. Planning-only requests end with the requested plan.

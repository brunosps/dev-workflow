## Promotion Decision Test

Before promoting an item from `<N>_memory.md` to `MEMORY.md`, ask:

1. Will another task need this to avoid a mistake or rediscovery?
2. Is this fact durable across multiple runs, not just the current execution?
3. Is this information NOT already obvious from the PRD, TechSpec, task files, or the repository itself?

All three must be "yes" to promote. If any is "no", the item stays in task memory.

### Confidence signal

Tag each durable decision with a confidence in `[0.3–0.9]` plus the tasks that confirmed it — `… — [confidence: 0.7; seen in tasks 1,3,5]`:

- Confirmed in **≥2 of the last 3 tasks** with no contradiction → **≥0.7** (trust it; safe to act on without re-deriving).
- Confirmed once, or inferred but not yet reused → **0.3–0.5** (tentative; gather more signal before relying).
- Contradicted by a later task or the repo → lower it or drop the decision (see Error Handling).

Confidence makes cross-task learning explicit and is the signal `/dw-learn` reads to promote high-confidence decisions into durable instincts, constitution principles, or rules.

### Belongs in shared memory
- A discovered constraint affecting multiple tasks ("the Stripe API rate-limits to 100 req/s — batch operations must respect this")
- A cross-cutting architectural decision made during implementation ("chose React Server Components for data fetching across the whole feature")
- An open risk future tasks must account for ("migration depends on schema v3 which is not yet deployed to staging")

### Stays in task memory
- Files touched during this task's implementation
- Debugging steps taken to resolve a task-specific error
- The current task's objective and acceptance criteria snapshot
- A workaround applied only to the current task's scope

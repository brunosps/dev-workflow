## The Five Rules

### 1. Chesterton's Fence — understand BEFORE changing

Before removing or rewriting any code, answer three questions:

1. **What does it actually do?** Run/trace it; don't guess from the name.
2. **Why was it added?** Check `git log --follow <file> --oneline` and look at the introducing commit's message + PR. Often there's a reason.
3. **What breaks if it's gone?** Search for callers. Run the test suite to find what changes.

If you can't answer all three, you're not ready to simplify. Get answers first.

Concrete cases where Chesterton's Fence saves you:
- A "redundant" early return that handles a race condition.
- A "useless" type cast that fixes a compiler bug on a specific platform.
- A "duplicated" check that exists for clarity at the API boundary.
- A "dead" branch that runs only with a feature flag enabled in production.

### 2. Preserve behavior exactly

The test for "did I simplify or did I change?" is: do the existing tests still pass without modification? If yes, behavior is preserved. If you needed to update tests, you changed behavior — that's a refactor, not a simplification.

When tests are inadequate to confirm behavior preservation, write tests FIRST that document current behavior, then simplify against them. This is the test characterization technique.

### 3. Follow project conventions

Match what the project already does. If files use 2-space indent and arrow functions, your simplified version uses 2-space indent and arrow functions — even if you'd prefer 4-space and `function`. Conventions matter more than personal preference; consistency is itself a form of clarity.

Project conventions live in `.dw/rules/<module>.md` (from `/dw-analyze-project`). Read first.

### 4. Prefer clarity over cleverness

Rules of thumb:

- A line of code that takes 30 seconds to understand is worse than three lines that take 5 seconds each.
- A "neat trick" with comments is uglier than the boring obvious code without comments.
- Optimization that costs readability needs measurement (`dw-performance` skill territory) — without numbers, prefer the readable version.
- "Magic" that requires knowing a language feature most teammates haven't used is anti-clarity. Use it only when the alternative is genuinely worse.

### 5. Scope to recent changes

Don't go simplifying old code while you're "in there". The risk-to-benefit ratio of changing 5-year-old battle-tested code is bad. Limit simplification to:

- Code you just wrote in this session.
- Code your current task touches.
- Code with explicit recent breakage (e.g., a bug just fixed that revealed bad structure).

Out of scope: any other code, no matter how ugly. Open a task / ADR for those instead of fixing in-flight.

## Agent / tool-use evaluation

Two questions distinguish good agent eval from bad:

### Question 1: outcome or trajectory?

| Approach | What it checks | Failure mode |
|----------|---------------|--------------|
| **Outcome-only** | Did the agent achieve the goal? Was the final state correct? | Misses "ghost actions" — agent did the right thing for the wrong reasons |
| **Trajectory** | Did the agent take the expected sequence of steps / tool calls? | Punishes legitimate creativity — agent solved it via a different valid path |

**Recommendation:** outcome-only with side-effect assertion as default. Trajectory match for cases where the path matters (e.g., "must call `get-user` before `update-user`").

### Question 2: which trajectory match mode?

When trajectory matching IS the right call, four modes are available:

- **Strict** — same tool calls, same order, same arguments. Use when both sequence and parameters are part of the contract.
- **Unordered** — same tool calls, any order. Use when concurrent calls are valid.
- **Subset** — actual trajectory contains a subset of reference calls. Use to enforce "don't exceed expected tool use" (frugality / cost).
- **Superset** — actual contains all reference calls plus possibly more. Use when specific tools are mandatory but extras are acceptable.

See `agent-eval.md` for examples and the decision tree.

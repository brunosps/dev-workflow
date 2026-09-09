## The oracle ladder

Five rungs, climb from CHEAPEST/STRICTEST to MOST EXPENSIVE/SUBJECTIVE. Always start at the bottom; only climb when the lower rung can't cover the case.

| Rung | What it checks | Cost | When to use |
|------|----------------|------|-------------|
| 1. **Exact match** | `output === expected` | ~free | Structured outputs (function calls, JSON with stable shape, classifications) |
| 2. **Schema validation** | Output matches JSON schema / type contract | ~free | Output shape matters; specific values vary |
| 3. **Outcome state** | Side effect produced the expected change (DB row, file written, tool called) | cheap | Agents, tool-use, RAG with concrete answers |
| 4. **LLM-as-judge** | A different model grades the output against a rubric | medium ($$$) | Subjective quality (helpfulness, tone, faithfulness) where no rule can decide |
| 5. **Human review** | Domain expert scores | expensive | Calibration of rung 4; high-stakes outputs; edge cases |

**Rule:** never reach for rung 4 before checking if rungs 1-3 can cover the case. Every rung up costs an order of magnitude more (latency, money, calibration effort) — and adds entropy.

See `oracle-ladder.md` for examples per rung and the climbing decision tree.

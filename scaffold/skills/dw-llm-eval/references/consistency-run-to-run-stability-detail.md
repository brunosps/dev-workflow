## Consistency (run-to-run stability)

The oracle ladder measures whether an output is *correct*; it does not measure whether the feature is *stable*. Because LLMs are non-deterministic, a case that passes once may fail the next run. Measure it:

- Re-run each case **N times** (default 3) against the same code + model + prompt.
- Record `pass_rate` (e.g. `2/3`) and `consistency` (fraction agreeing with the majority verdict) per case in `runs/<YYYY-MM-DD>.jsonl`.
- A case with pass_rate strictly between `1/N` and `(N-1)/N` is **flaky** — a signal, not a pass. A 2/3 pass hides a one-in-three production failure; investigate before shipping.
- Sample at the **temperature the feature uses in production** — consistency measured at temp 0 lies about a temp-0.7 feature.

Deterministic rungs (1–3) are usually stable; consistency matters most for rung 4 (LLM-as-judge) and agent trajectories. Record the run count `N` in the run log so later comparisons are apples-to-apples.

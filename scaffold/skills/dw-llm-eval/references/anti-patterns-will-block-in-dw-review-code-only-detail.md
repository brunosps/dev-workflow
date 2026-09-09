## Anti-patterns (will block in `/dw-review --code-only`)

- **LLM-as-judge without calibration evidence.** PR adds LLM-as-judge but the calibration Spearman score is missing or < 0.80. REJECTED.
- **Same-model judge.** Judge model is the same as the system under test. REJECTED unless explicitly documented (and even then, results are suspect).
- **Single-rung eval.** Feature ships with only LLM-as-judge; no rung 1-3 grounding. REJECTED — the cheap rungs catch the loud failures.
- **Synthetic-only dataset.** No traceable production-failure source for any case. REJECTED — confirm at least 20% of cases come from real user inputs.
- **"Looks good to me" QA.** No reference dataset, no metric, no rubric — just sampling output and calling it good. REJECTED.
- **Coverage as metric.** Quoting "we tested 50 prompts" without saying what was measured. The number is meaningless without the metric.
- **Single-run eval on a non-deterministic feature.** Each case run once at production temperature; a lucky pass reported as a pass. REJECTED — report `pass_rate` over N runs (see Consistency).

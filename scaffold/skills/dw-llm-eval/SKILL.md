---
name: dw-llm-eval
description: Use when authoring or reviewing AI/LLM features (chat, RAG, agents, classifiers). Oracle ladder, reference dataset, judge calibration (Spearman ≥0.80), trajectory eval. Triggers on every AI code path.
allowed-tools:
  - Read
---

# LLM Evaluation

> Adapted patterns from [`langchain-ai/agentevals`](https://github.com/langchain-ai/agentevals) (MIT) for trajectory-match modes, plus general LLM-eval discipline from OpenAI evals cookbook, Anthropic's evals guidance, and the broader open evaluations literature. Material rewritten in our voice.

## When this skill applies

- Any feature that uses an LLM in production: chat, summarization, classification, RAG (retrieval-augmented generation), agents, tool-use, structured extraction, code generation.
- `/dw-plan tasks` when the PRD mentions an AI feature — eval planning becomes a mandatory subtask.
- `/dw-review --code-only` when the diff touches AI feature code paths.
- `/dw-qa --ai` when validating an AI feature against its reference dataset.

If the feature is fully deterministic (no LLM in the loop), use `dw-testing-discipline` instead — Iron rules and 25 anti-patterns. This skill is specifically for entropy-tolerant systems.

## First principle

> Tests for deterministic code assert exact outputs.
> Tests for LLM features assert behaviors within tolerance.
> The discipline is choosing the right tolerance — and proving it's not "anything passes."

## The oracle ladder

For the oracle ladder, read `references/the-oracle-ladder-detail.md`. Load only when this part of the task applies.

## LLM-as-judge discipline (when rung 4 is needed)

Without calibration, LLM-as-judge produces noise dressed as signal. Three non-negotiables:

1. **Calibrate against humans** — ≥20 human-graded cases, compute Spearman correlation against LLM-as-judge. Target ≥0.80. Below that, reject the judge configuration.
2. **Use a different model than the system under test** — same model judging itself produces false positives. Pair: GPT-4 generates → Claude judges. Or vice versa.
3. **Rubric, not free-form** — provide the judge a structured rubric (criteria + scale + examples) instead of "rate quality 1-10."

See `references/judge-calibration.md` for the full calibration recipe, rubric templates, and the "judge drift" monitoring pattern.

## Reference dataset principle

> 20 unambiguous cases drawn from real production failures beat 200 synthetic perfect cases.

The dataset is the bedrock. Without a reference set, every "improvement" is anecdote.

Structure:
```
.dw/eval/datasets/<feature-name>/
├── cases.jsonl           # input + expected (or rubric reference) per line
├── README.md             # provenance, sample size, when last reviewed
└── runs/<YYYY-MM-DD>.jsonl  # results of each eval run
```

See `references/reference-dataset.md` for case-design principles, sampling from production, and when to expand the set.

## Consistency (run-to-run stability)

For consistency (run-to-run stability), read `references/consistency-run-to-run-stability-detail.md`. Load only when this part of the task applies.

## RAG evaluation

Three orthogonal metrics — measure all three, not just one:

| Metric | What it measures | Tool |
|--------|-----------------|------|
| **Retrieval precision@k** | Of the top-K retrieved chunks, how many were relevant | Exact match against labeled ground-truth |
| **Answer faithfulness** | Does the answer cite only what the retrieved context supports? | LLM-as-judge with rubric |
| **Context utilization** | Did the answer USE the retrieved context, or hallucinate around it? | Heuristic + LLM-as-judge |

Precision alone misses hallucination. Faithfulness alone misses retrieval failure. Context utilization alone misses both. See `references/rag-metrics.md` for the full implementation.

## Agent / tool-use evaluation

For agent / tool-use evaluation, read `references/agent-tool-use-evaluation-detail.md`. Load only when this part of the task applies.

## Required reading by context

| Doing what | Read |
|------------|------|
| Designing an eval suite for an AI feature | `references/oracle-ladder.md` (climb the ladder) |
| Using LLM-as-judge | `references/judge-calibration.md` (mandatory before relying on it) |
| Building / curating a reference dataset | `references/reference-dataset.md` |
| RAG-specific feature | `references/rag-metrics.md` |
| Agent / tool-use feature | `references/agent-eval.md` |

## Anti-patterns (will block in `/dw-review --code-only`)

For anti-patterns (will block in `/dw-review --code-only`), read `references/anti-patterns-will-block-in-dw-review-code-only-detail.md`. Load only when this part of the task applies.

## Integration with dev-workflow commands

For integration with dev-workflow commands, read `references/integration-with-dev-workflow-commands-detail.md`. Load only when this part of the task applies.

## When the discipline bends

- **Prototype / spike phase**: skip calibration; document as "spike — eval added before merge to main."
- **Internal-only AI feature with low blast radius** (e.g., classifier for internal CRM tags): rung 1-3 only is fine; LLM-as-judge may be overkill.
- **Real-time features where eval can't run synchronously**: shadow-eval pattern — run the eval async on a sample of production traffic; alert on regression.

In all bend cases, document the deviation in the techspec / PR. "Skipped judge calibration because internal-only feature affecting <100 users" is fine; just say it.

## Why this approach

Two failure modes drive most AI feature regressions:

1. **No measurement** — team ships, suspects it's worse, can't prove it, debate.
2. **Wrong measurement** — team measures LLM-as-judge only, judge drifts with the model, scores rise while real quality falls.

The oracle ladder fixes both: forces measurement, forces ANCHORED measurement (lower rungs are deterministic; upper rungs are calibrated against them).

## Bottom line

> An AI feature without an eval suite is a feature you can't ship safely. An eval suite without calibration is a number you can't trust. Build the dataset from real failures, climb the ladder from cheap to expensive, calibrate the judge against humans, and re-run before every model swap. The discipline is small; the absence of it is one of the largest sources of "we shipped and don't know if it's worse" experiences in the industry.

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when eval strategy/results meet the feature gate, `FINDINGS` when eval gaps or regressions remain, `BLOCKED` when dataset/rubric/calibration is missing, `NOT_APPLICABLE` when no LLM/AI behavior is in scope.
- **Scope:** feature, model path, dataset, oracle rungs, and command mode.
- **Evidence:** dataset provenance, metrics, judge calibration, run logs, and failure cases.
- **Artifacts:** eval plan, cases.jsonl, run JSONL, rubric, or QA log path.
- **Decisions:** oracle rung selection, metric thresholds, and accepted deviations.
- **Risks:** judge drift, synthetic-only cases, same-model judging, hallucination, or uncovered trajectories.
- **Next Step:** add dataset case, run eval, calibrate judge, or block release.

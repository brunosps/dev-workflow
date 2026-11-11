# Reference dataset — 20 from failures beats 200 perfect

The dataset is the bedrock. Without one, every "improvement" is anecdote and every regression goes unnoticed until users complain. With one, you can measure change.

## The 20-from-failures principle

> 20 unambiguous cases drawn from real production failures beat 200 synthetic perfect cases.

Why:
- Synthetic cases reflect what the team IMAGINED would happen — they cover the cases the team already knows about.
- Production failures reflect what ACTUALLY happens — they cover blind spots and edge cases.
- 20 well-curated cases at the right level of difficulty discriminate models better than 200 average-difficulty cases.

A 20-case dataset is enough to:
- Detect regressions of >10% accuracy.
- Calibrate LLM-as-judge.
- Run cheaply enough to evaluate on every PR.

Scale up only when you've validated that 20 is producing useful signal.

## Where cases come from

In rough order of priority:

1. **Real production failures.** User reported a bug, support escalated a case, error logs show an unexpected output. Each becomes a case. Sanitize PII before saving.
2. **Edge cases discovered during development.** "Oh, what if the user asks X?" — add it.
3. **Adversarial examples.** Inputs designed to trip the system (prompt injection, ambiguity, contradiction). Especially important for chat/RAG.
4. **Boundary inputs.** Empty, very long, special characters, mixed languages, unusual encodings.
5. **Synthetic — last resort.** Only when no real input exists yet (e.g., pre-launch). Mark them as synthetic; replace as production data arrives.

Target distribution: **80% real production-sourced**, 20% adversarial/boundary. Pure-synthetic datasets give pure-synthetic confidence.

## Case structure

Each case is one line in `cases.jsonl`:

```json
{
  "id": "case-001",
  "split": "dev",
  "input": {
    "user_message": "I want to cancel my subscription",
    "user_context": { "tier": "premium", "tenure_months": 18 }
  },
  "expected": {
    "intent": "cancellation_request",
    "should_offer_retention": true,
    "tone_targets": ["empathetic", "non-manipulative"]
  },
  "rubric_criteria": ["faithfulness", "tone", "completeness"],
  "metadata": {
    "source": "production-2026-04-12-ticket-T-1234",
    "added_at": "2026-04-15",
    "added_by": "@bruno",
    "difficulty": "medium",
    "tags": ["cancellation", "retention", "premium-user"]
  }
}
```

Fields:

- **`id`** — stable identifier (you'll reference it in regression reports).
- **`split`** — `dev` (you tune against it) or `holdout` (you never do). See "Held-out split".
- **`input`** — what the system receives. Match the production input shape exactly.
- **`expected`** — for rungs 1-3, the deterministic expected output or state change. For rung 4, the rubric-target (what a 5/5 answer would do).
- **`rubric_criteria`** — which rubric dimensions this case exercises.
- **`metadata.source`** — provenance. Production ticket? Synthetic? Adversarial?
- **`metadata.difficulty`** — easy/medium/hard. Track score by difficulty bucket.
- **`metadata.tags`** — for filtering ("show me cases that exercise retention logic").

## Dataset layout

```
.dw/eval/datasets/<feature-name>/
├── README.md                    # provenance, sample size, last review, change log
├── cases.jsonl                  # the cases themselves
├── rubric.md                    # the rubric used for rung-4 scoring
├── runs/
│   ├── 2026-05-01.jsonl         # one line per case with scores from that run
│   ├── 2026-05-08.jsonl
│   └── ...
├── calibration/
│   ├── 2026-05-12-human-scores.jsonl
│   └── spearman-2026-05-12.txt
└── changelog.md                 # when cases were added/removed and why
```

Everything is committed. Datasets evolve with the feature; the git history shows when and why.

## README.md template

```markdown
# Reference dataset — <feature name>

**Purpose:** evaluate <feature> for <quality dimensions>.

**Current size:** N cases (X production-sourced, Y adversarial, Z synthetic).

**Difficulty distribution:** easy: A, medium: B, hard: C.

**Last reviewed:** YYYY-MM-DD.

**Maintainers:** @name1, @name2.

## When to expand

Add a case when:
- A new production failure is observed (always — that's the primary signal).
- A new edge case is identified during development.
- A new adversarial pattern is discovered (security review, red-team session).

Do NOT add cases just to inflate the count. The 20-from-failures principle: quality over quantity.

## When to retire a case

Retire (don't delete) when:
- The behavior the case checked is no longer relevant (feature removed).
- The case became trivially passing across all model versions (it's no longer discriminating).

Move retired cases to `cases-retired.jsonl` with a `retired_reason`.
```

## Adding cases from production

Process:

1. **Capture the failure** — paste the actual input that failed in `cases-pending.jsonl`.
2. **Sanitize PII** — replace names, emails, IDs, account numbers with realistic-but-fake equivalents. NEVER commit real user data.
3. **Define expected behavior** — what SHOULD have happened. Get sign-off from a domain expert if subjective.
4. **Categorize** — difficulty, tags, rubric criteria.
5. **Promote** to `cases.jsonl` after review.

## Baseline before the change

> Eval-first, from LangChain's [eval-driven development](https://www.langchain.com/blog/what-is-eval-driven-development)
> post (2026-11-09): the eval is written and run before the change it measures.

When a task adds or changes an AI behavior, the eval exists before the implementation:

1. **Spec the behavior, one at a time.** Four lines, definite enough to score pass/fail: when it should
   happen, what the system does, what it must not do, and which existing behaviors must keep working.
   "The answer is helpful" is not a spec.
2. **Add the cases** for it: the new behavior, its must-not boundary (the near miss that should NOT
   trigger it), and the existing cases that cover the keep-working list.
3. **Run the baseline** on the current code, before any change, and save it as
   `runs/<YYYY-MM-DD>-baseline.jsonl`.
4. **Read the baseline.** New-behavior cases must fail there. A new case that already passes does not test
   the change: rewrite it or drop it. Existing cases that pass are the regression set for this change.
5. Implement, re-run, compare case by case (see "Detecting drift").

Each line of a run file is one case:

```json
{"id": "case-001", "split": "dev", "pass": true, "score": 4, "commit": "a1b2c3d", "dataset_version": "2.3"}
```

`pass` is required (the verdict against the case's oracle); `score` only when a rung-4 judge produced one.

## Held-out split

Iterating until every case passes overfits the system to the dataset: the prompt learns the cases, not the
behavior. Mark about 20% of cases `"split": "holdout"`, spread across difficulty and tags, and:

- iterate against `dev` only — never read a holdout failure to decide the next prompt tweak;
- run `holdout` before merge to main and before deploy;
- if `dev` improves and `holdout` stays flat or drops, report overfitting instead of the improvement.

A holdout case that was used to tune is no longer held out: move it to `dev` and add a fresh one.

## Sampling for regression runs

You don't need to re-run the entire dataset every time. Smart sampling:

- **PR-time:** `dev` split only — random sample of 30% + all "high difficulty" cases + any case added in the last 30 days. Fast feedback.
- **Pre-merge to main:** full dataset, `holdout` included.
- **Nightly:** full dataset + judge re-calibration check.
- **Pre-deploy:** full dataset + manual eyeball on 10 random outputs.

## Detecting drift

After each run, compare against the prior run on the SAME cases — **case by case first, averages
second.** An average can rise while a case that used to pass breaks: the change fixed five things and
overwrote one behavior someone depends on.

```
Run 2026-05-08 vs 2026-05-01 (dataset 2.3, 24 cases):
  flipped pass → fail: case-007 (dev), case-019 (holdout)
  flipped fail → pass: case-021, case-022, case-023
  unchanged: 19
```

The gate: **any case that passed in the prior run and fails now blocks**, whatever the average says, until
it is fixed or accepted in writing (PR or techspec: case id, why the old behavior no longer holds). A
fail → pass flip on a case nobody was working on is also worth a look: it may be judge drift, not progress.

Then the metric deltas:

```
Run 2026-05-08 vs 2026-05-01:
  faithfulness: 4.2 → 3.9 (-0.3) ⚠ regression
  completeness: 4.0 → 4.1 (+0.1)
  tone:         4.5 → 4.4 (-0.1)
  outcome accuracy: 95% → 92% ⚠ regression
```

Two ways drift happens:
1. **Code change degraded quality** — your model swap or prompt tweak hurt something. Bisect.
2. **Judge drift** — the LLM-as-judge itself changed (vendor updated the model). Re-calibrate; the "regression" may be the judge, not the system.

## Dataset versioning

When the dataset materially changes (cases added/removed in batch, rubric updated), bump a version in the README:

```
Dataset version: 2.3
- v2.3 (2026-05-12): added 8 cases from production tickets in last 30 days
- v2.2 (2026-04-15): retired 3 cases that became trivially passing
- v2.1 (2026-03-20): rubric updated to add "completeness" criterion
```

Each run logs which dataset version it ran against. You can't compare a v1 score to a v3 score directly.

## Cost discipline

- Keep the dataset SMALL on purpose. 20-50 cases for most features. 100+ only if the feature has many categorically different inputs.
- Cheap evaluations (rungs 1-3) run on every case every time.
- Expensive evaluations (rung 4) run on samples — 20-50 random cases — except for full pre-deploy runs.

## Anti-patterns

- **Synthetic-only dataset.** No connection to real production. Confidence isn't real.
- **Dataset grew to 500 cases nobody re-reads.** Half are duplicates; half are no longer discriminating. Audit and prune.
- **Cases without expected behavior.** "Just look at the output." No measurement possible.
- **Dataset not committed.** Lives in a notebook; ephemeral; lost when person leaves.
- **No metadata tracking source.** Can't tell synthetic from real; can't audit dataset quality.
- **Dataset reused across features.** Each feature has its own dataset; one-size-fits-all is one-size-fits-none.

## Cross-reference

- `oracle-ladder.md` — what to assert per case.
- `judge-calibration.md` — how to make rung-4 judgments meaningful.
- `rag-metrics.md` — RAG-specific extras for the dataset structure.
- `agent-eval.md` — agent-specific extras (trajectory matching).

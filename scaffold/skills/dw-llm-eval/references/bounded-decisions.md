# Bounded decisions — when the answer space is already known

A large share of model calls in a product do not need written text. The application already knows the
possible answers and only needs one of them chosen: route this ticket to billing, technical or account ·
is this message urgent · how severe is this incident on a 1-4 scale.

Asking a generative model to *write* that answer means generating tokens one at a time, waiting for all of
them, parsing the result, and handling the case where it came back malformed. None of that work is about
the decision.

When the answer space is fixed in advance, the model can **score the candidates instead of writing one**.
The decision comes out of a single forward pass, as a distribution over the options you defined, with no
tokens to parse and no malformed output to handle.

This is not a new technique — multiple-choice benchmarks have been scored this way for years. It is worth
writing down because product code rarely uses it, and because it comes with one trap that costs more than
the speed it saves.

## The trap: a probability is not a confidence

Scoring returns numbers that look like probabilities. Treat them as calibrated confidence and you will make
bad decisions with the appearance of rigour.

Raw model probabilities are usually **badly calibrated**: a candidate holding 80% of the mass is not right
80% of the time. Preference tuning (RLHF and its relatives) tends to make this worse, because it sharpens
mass onto preferred answers beyond what their reliability warrants.

**This is a different property from what `references/judge-calibration.md` requires.** That file asks for
Spearman ≥0.80 between judge scores and human scores — rank agreement, which answers "does the judge order
cases the way a human would". Calibration answers a separate question: "when it says 0.8, is it right 80%
of the time". A judge can pass one and fail the other. Both matter, and they are not substitutes.

Two honest ways to handle it:

1. **Do not interpret the number as a frequency.** If all you need is a threshold to route or abstain, pick
   the threshold empirically against your reference dataset and never publish the raw value as a
   confidence. This is usually enough, and it is the cheapest correct answer.
2. **Calibrate it post-hoc.** Fit a mapping from raw score to observed frequency on held-out cases
   (Platt scaling, isotonic regression). Now the number means something, and you can report it.

Either way, the reference dataset is what makes the number trustworthy — not the model that produced it.

## What this gives your eval

A generative judge returns a verdict. A scoring judge returns a verdict **and a distribution**, which lets
the eval measure something accuracy alone cannot: whether the system knows when it is unsure.

- Plot a reliability curve — bucket predictions by confidence, compare each bucket's confidence against its
  observed accuracy.
- Track expected calibration error across releases. A model swap can hold accuracy steady while wrecking
  calibration, and accuracy-only evals will not show it.
- Route the low-confidence tail to a human or a more expensive rung instead of accepting it silently. That
  is the same escalation shape `references/oracle-ladder.md` describes between rungs.

## Two ways to implement it

**Score with the model you already run.** No new model, no new infrastructure: prefill the prompt and read
the scores of the candidate answers. Cheapest to adopt.

Two things to get right. First, if two options share their opening tokens, a naive first-token comparison
picks between prefixes rather than between answers — score whole candidates and normalise by length, which
is what serving frameworks that expose a choice primitive do by default. Second, the calibration problem
above is at its worst here, because the model was tuned to sound confident.

**Use a model built for typed decisions.** Purpose-built decision models take state plus a typed question
and return a distribution directly, trained for calibrated output rather than for human preference. Better
calibrated by construction, at the cost of another model to run, serve and keep current.

The first is right when the decision rides alongside work a general model is already doing. The second
earns its keep at high volume, where the decision *is* the workload.

## When not to use any of this

If the right answer is a sentence — an explanation, a summary, a written recommendation — the answer space
is not bounded and none of this applies. Forcing it into a fixed set does not make it cheaper; it makes it
wrong. Rung 4 with a calibrated generative judge remains the tool for subjective output.

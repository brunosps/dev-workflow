# Refutation Pass — disprove the candidate before it becomes a finding

A candidate is a hypothesis produced by one line of reasoning. That same reasoning cannot test it: once a
conclusion is reached, every later reading is pulled toward it. Re-reading your own trace feels like
verification and is not. The pass below replaces the reader.

## With a subagent: the refutation packet

Dispatch `dw-finding-refuter`, **one candidate per run**. It receives exactly this and nothing else:

| Include | Exclude |
|---|---|
| The claim in one sentence: location, input or state, bad outcome | How the candidate was found |
| The raw code — the flagged lines, the file, the entry points that reach it | Your confidence and your severity |
| Which commands it may run | Every other candidate from this round |
| — | Prior-round text, the PRD, the diff summary |

Severity is withheld deliberately. A candidate handed over labelled `critical` comes back confirmed more
often than the identical candidate labelled `medium`, and that difference is the anchor, not the evidence.

The refuter returns `REFUTED`, `HOLDS`, or `UNRESOLVED`. One case needs care: if it returns `HOLDS` citing
only the `file:line` you handed it, that is an echo, not confirmation. Treat it as `UNRESOLVED`.

## Without a subagent: re-derive from zero

Read the path as if you had never seen the candidate — start at the entry point, move forward, and reach
the flagged line **last**. The objective is to show the bad outcome cannot occur. Work the list in order
and stop at the first hit:

1. **Validation upstream** — a schema, parser, or guard clause the value already passed.
2. **Permission upstream** — an authorization check, middleware, or policy on the route.
3. **A type or schema that cannot hold the bad value** — a typed boundary, an enum, a branded type, a
   `NOT NULL` constraint.
4. **A framework or runtime default** — auto-escaping, parameterized queries, CSRF middleware, a default
   timeout.
5. **Configuration that is not what the claim assumed** — read the config file; do not infer it from
   naming.
6. **Intent** — a test asserting the behavior, an adjacent comment, an ADR, a rule under `.dw/rules/`.

If everything you can say about the candidate at the end is what you already said at the start, the result
is `UNRESOLVED`, not confirmed.

## needs-validation format

```
[needs-validation] <file.ext>:<line> — <what is unresolved, ≤72 chars>

Unresolved: <the specific fact that could not be established>
Blocked by: <why — missing runtime config, unreadable caller, external system, no test data>
Resolved by: <the concrete thing that would settle it — a file, a command, an owner's answer>
```

No severity. No "possible critical", no "likely exploitable". The whole point of the class is that you do
not know yet, and saying so plainly is the honest output. A severity attached here is a severity invented.

## Rejected candidate format

One line each, under `## Rejected Candidates` at the end of the report:

```
- <claim in one line> → refuted: <what disproves it> (<file:line or command>)
```

Keep it even when it feels like clutter. The line is what stops the next round from rediscovering the same
false positive and paying for the same refutation twice.

## Anti-patterns

- **Sending the refuter your reasoning "for context."** That is the exact failure this pass exists to
  prevent; the packet is short on purpose.
- **Refuting a batch.** One candidate per run. Batching restores the shared frame you were trying to
  escape.
- **Letting the refuter open findings of its own.** Its output is a verdict on one claim. New observations
  it makes along the way are for the next round, not this report.
- **Promoting `UNRESOLVED` to a finding** because the round would otherwise look thin. Three
  `needs-validation` entries and one finding is a more honest round than four findings.
- **Deleting a refuted candidate** instead of logging it.
- **Treating "the refuter found no blocker" as proof.** Absence of a refutation is `UNRESOLVED` unless the
  refuter cited independent evidence for `HOLDS`.

## Proportionality

The pass is for candidates that will carry a severity. A duplicate of an already-reported root cause, a
finding the configured linter owns, or a cosmetic note does not need a refuter — it needs to be dropped or
merged under Rule 1. Spend the pass where a wrong answer would cost something.

## Attribution

The three-outcome discipline — adversarial refutation by a reader who did not produce the claim, an
unresolved-lead class that carries no severity, and a durable record of rejected candidates — was
reimplemented independently from the technique described in `akitaonrails/my-skills`. That repository
declares no license; no upstream text, structure, or file was reused, and no reuse license is assumed.

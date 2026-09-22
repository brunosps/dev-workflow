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

## What each exit may and may not carry

The three exits are not three severities of the same thing — they are three different claims, and each one
is entitled to different fields. Most of the damage a review does comes from mixing them: a severity on an
unresolved lead reads as an assessed risk, and a remediation on a refuted claim sends someone to fix
nothing.

| Exit | Carries | **Must not carry** |
|---|---|---|
| `finding` | The confirmed cause, the reachable input or state, the observable outcome, the fix, a severity | A *claimed* cause — by this point it is established or it is not a finding |
| `needs-validation` | The **claimed** cause, the trace, the evidence so far, what blocks resolution, and how to resolve it | **A severity.** Also no fix and no exploit path — you do not have the facts those require |
| `rejected` | The claim as it was made, and what disproved it | A severity, a fix, an exploit path, a blocker — the claim is closed, not pending |

The prohibition on severity for `needs-validation` is the load-bearing one. A severity is an assessment of
impact, and an unresolved lead has not established the impact. "Possible critical" is not a cautious
finding; it is a number with nothing behind it, and it will be read as a ranking.

## Degradation: no environment means unresolved, not resolved

When the environment needed to settle a claim is unavailable — no sandbox, no runtime, no access to the
configuration that decides it — the candidate stays `needs-validation`. It is not promoted because the
reasoning looked strong, and it is not dropped because it could not be checked.

This is the rule that keeps the class honest. Without it, a missing environment quietly turns into whatever
the reviewer already believed.

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
unresolved-lead class that carries no severity, and a durable record of rejected candidates — originates in
[`cloudflare/security-audit-skill`](https://github.com/cloudflare/security-audit-skill) (MIT), which calls
it adversarial verification, needs-validation discipline and coverage honesty. It reached this project
through `akitaonrails/my-skills`, which credits Cloudflare for the same model and declares no license of
its own. **Attribution chain: cloudflare → akitaonrails → dev-workflow.**

The per-exit field contract and the degradation rule above come from reading the Cloudflare skill directly:
there they are enforced by a JSON schema and a validator script, and here they are prose, because our
reviews are markdown reports rather than validated records. No upstream text or file was reused.

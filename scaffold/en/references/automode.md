# Automode — authorization, and how to stop cleanly

## What this is not

This is not a second runtime. It launches no process, infers no consent, authenticates nothing, and adds
no scheduler — `docs/model-workflow-modernization.md` rules that out deliberately, and this contract does
not reopen it. It is prose, like the rest of the scaffold: two rules about when to ask and how to stop.

## Invoking a command authorizes its flow

A command that was invoked has permission to run its own steps. Do not re-ask what the invocation already
granted, and do not re-ask what was approved upstream — the task/assignment matrix approved in
`/dw-plan tasks` carries through execution, review and correction
(`.dw/references/execution-contract.md`).

"May I proceed?" in the middle of an authorized flow is not caution. It stops work that was already
sanctioned, and in an unattended run it stops it in front of nobody.

Authorization does not stretch past its scope. Merge, push, publication and destructive operations still
need their own, and a floor invariant (`.dw/references/invariants.md`) is never authorized by anything.

## Stops are enumerated, not improvised

Each command lists its own legitimate stops. That list is the complete set — if a situation is not on it,
the command continues. The lists are per-command on purpose: a global list would be either too broad to
respect or too narrow to be true.

A stop is not a failure. A run that hits a real blocker, records it and exits is a **successful run** that
ended early. The failure mode this contract exists to prevent is the opposite: a run that keeps going past
a blocker by inventing a way around it.

## The stop protocol

Three steps, in order:

1. **Persist.** Write the state the next run needs: what was done, what was decided, where the artifacts
   are, and the exact point reached. Partial work is preserved, never reset to retry.
2. **Report.** State the specific question, the concrete options, and **the exact command that resumes the
   work** — something the reader can paste. "Blocked on a decision" without the resume command makes the
   reader reconstruct what you already knew.
3. **Exit clean.** Say what stopped and why, in a line. Not an error, not an apology.

**Status is `BLOCKED`**, filled in properly — question, options, resume command. There is no `PARKED`
status and there will not be one: the `PASS`/`FINDINGS`/`BLOCKED`/`NOT_APPLICABLE` vocabulary is shared by
every skill and validated in `lib/skill-registry.js`. A stop is not `PASS` either; a `PASS` that actually
halted halfway misleads every gate that reads it.

## Repeating without progress

`/dw-goal` already sets the only objective stall rule in this toolkit: the same blocker for three
consecutive turns with no meaningful progress means stop and surface it. Apply the same standard
elsewhere. Retrying an operation that failed the same way three times is not persistence.

## Unattended runs and the channel

When a command runs with nobody watching — a VM, a fleet, a CI job, a long background dispatch — a stop is
only as good as the channel that carries it.

If the only channel is this chat, say so once, up front: a stop will be text in a terminal nobody is
reading. The run exits cleanly and the work is preserved, but nothing pages anyone, and the task sits
untouched until someone happens to look. That is worse than a run that never started, because it looks
finished.

This toolkit has no notifier role and is not adding one. Naming the limitation is the whole mitigation:
the owner can then decide to attend the run, shorten it, or arm `/dw-report`.

## Attribution

The park protocol and the unattended-channel warning are adapted from the autonomy contract in
[`samsantosb/ship-it`](https://github.com/samsantosb/ship-it) (MIT © Samuel Santos). Reimplemented here:
the status mapping, the per-command stop lists and the stall rule come from this project's own contracts.

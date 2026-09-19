# Composition Audit — reviewing N merged PRs as one state

Loaded by `/dw-review --post-merge`. It does not replace the five rules or the candidate pipeline; it
changes what you go looking for when the unit of review is a merged range instead of one branch.

## What changes when the scope is a range

Every PR in the range was reviewed alone and passed alone. That is exactly why this pass exists: the
defects below need two changes to exist, so no per-PR review could have caught them, and the collection of
per-PR summaries is optimistic by construction. Audit the final tree, not the summaries.

Two consequences for severity. A defect here is already shipped, which changes **urgency**, not severity —
do not inflate a medium because it is live, and do not discount a critical because "it has been fine so
far". And the range is the only honest unit: a finding that says "PR #3 broke it" is usually wrong, because
what broke it is #3 meeting #7.

## The seven interaction classes

### 1. Invariant bridges

One PR adds a field, column, flag, or route; another populates or authorizes it somewhere that is not the
canonical boundary. The writer looks fine (it writes a legitimate value) and the reader looks fine (it
reads a field that exists), but the invariant the boundary was supposed to enforce is now bypassed.

- *Detection:* for each new field or path added in the range, `git log -S'<name>' --oneline <range>` to
  find every commit that touched it, then check whether the writers all pass through the same guard.
- *False positive:* a deliberate second writer with its own validation. Read it before flagging.
- *Minimum severity:* high when the bypassed boundary is authorization or tenancy, otherwise medium.

### 2. Helper and policy drift

Two PRs each add or change normalization, identity comparison, validation, retry, error mapping, or a
permission check — and the two copies now disagree. The system behaves differently depending on which path
the request took.

- *Detection:* `git diff <range> --name-only` grouped by subsystem, then grep for near-duplicate helper
  names and for the same literal in two places.
- *False positive:* intentional divergence with different requirements. Look for a comment or an ADR.
- *Minimum severity:* medium; high when the two copies disagree about a security decision.

### 3. Default and config composition

Each default was compatible on its own. Together they change behavior, create ambiguity, or enable
something that was meant to stay off. The classic shape: one PR flips a default to "on for new installs"
and another adds a code path that assumes it is off.

- *Detection:* list every default, env var, feature flag, and config key the diff touches, then evaluate
  them as a set, not one at a time. Check the upgrade case — existing installs — separately from a fresh one.
- *Minimum severity:* high when the composed state is insecure or data-losing.

### 4. Order and lifecycle

Startup and shutdown ordering, retries, cleanup, transactions, rollback, background jobs, leases. One PR
adds work at a lifecycle point; another changes when that point runs.

- *Detection:* find the lifecycle entry points in the range and read them whole, not as hunks. Ask what
  happens on the second run, on a crash between the two changes, and on rollback.
- *Minimum severity:* high when a partial state can persist.

### 5. Shared resource behavior

Queues, connection pools, files, ports, rate limits, caches, locks, disk. Two PRs that each take a
reasonable share of a bounded resource can together exhaust it.

- *Detection:* for each bounded resource the range touches, sum the new consumers. Look for a new consumer
  added to a pool whose size did not change.
- *Minimum severity:* medium, high when the bound is reached under normal load rather than attack.

### 6. Schema, API, and data composition

Migrations, wire schemas, public functions, CLI flags, persisted data, older callers. Two migrations that
each apply cleanly to the pre-range state may not compose; an additive API change plus a rename is a break.

- *Detection:* apply the migrations in range order against a copy of the pre-range schema, not against a
  fresh one. For public surfaces, diff the signature set at `BASE_SHA` against `HEAD_SHA` rather than
  reading the PRs' claims.
- *Minimum severity:* high for anything a released caller can hit.

### 7. Test masking

The one that most reliably hides in a green build: one PR's mock, fixture, helper, or test config makes
another PR's test pass without exercising production behavior. Both PRs were green. The composed suite is
green. The feature does not work.

- *Detection:* for each test added in the range, check whether the production path it claims to cover is
  actually reached — a global mock registered in shared setup, an autouse fixture, a stubbed client, a
  widened test config. Where feasible, revert the production change and confirm the test goes red.
- *False positive:* a legitimately isolated unit test whose integration coverage lives elsewhere. Find that
  elsewhere before flagging.
- *Minimum severity:* high — a test that cannot fail is worse than no test, because it is counted as
  coverage.

## Composition-only defect checklist

Run this after the seven classes. These are shapes that per-PR review systematically misses:

- an **additive feature that broke a public API by accident** — additive intent does not excuse an
  unrelated signature change;
- a **fallback that now swallows an unrelated error** — the fallback was added for one failure and now
  catches a second one introduced later;
- a **test bound to a real home directory, platform, clock, network, or live service** — it passes on the
  machine that wrote it;
- **one entry point fixed while its parallel implementation went stale** — CLI fixed, API not; one platform
  fixed, the other not;
- **code only the development platform's gate exercises.** This is the highest-yield item in the list,
  because a single-platform fast gate cannot see any of it:
  - path identity that assumes one canonical spelling — symlinked temp and home roots, drive letter versus
    POSIX separators, a trailing separator, case sensitivity;
  - file-locking semantics that differ per OS;
  - stderr and exit-code differences between platforms for the same command;
  - line endings in anything compared as text.

  Flag these for the full matrix rather than trusting the merge gate. A red matrix is a real finding — do
  not route around it.

## Documentation ledger

Build the surface list from the **diff**, never from the PRs' prose. A PR body describes what someone meant
to ship; the diff describes what shipped.

Surfaces to enumerate: features, fixes, changed defaults, flags, env and config fields, supported
platforms, endpoints, public APIs, schemas, migrations, install and deploy steps, security behavior.

For each surface, find every authoritative location and look for a **description that is now wrong**, not
only a name that is missing. A stale sentence is worse than an absent one: it is confidently incorrect.
The usual homes are the README's support and compatibility tables, examples, the architecture and config
reference, migration notes, and platform docs.

## Semver recommendation

From the diff:

- only fixes → **patch**;
- any additive surface → **minor**;
- any break — on-disk format, public API, CLI or wire contract, a removed surface → **major**.

State the recommendation and the **single highest-impact entry** that forces it, so the reader can check
the one thing the conclusion rests on.

Then check two changelog hazards that a heading-uniqueness script cannot catch:

- **An entry stranded in an already-released section.** A PR authored before a release was cut anchors its
  entry at the old position of "Unreleased". Merging the mainline back can resolve *cleanly, with no
  conflict*, and leave the entry inside the now-frozen released section — claiming the change shipped in a
  version that never contained it. Compare the changelog at `BASE_SHA` with the lines the range added:
  `git diff <BASE_SHA>...<HEAD_SHA> -- <changelog>`, and confirm each new entry sits under the pending
  heading.
- **Merge-resolution residue.** `git diff --check` flags leftover conflict markers, but scripted resolution
  also leaves diff3 base markers (`|||||||`) and duplicated bullets, which no uniqueness check sees. Grep
  for the marker and scan for repeated entries.

This section produces a recommendation and nothing else. `/dw-review --post-merge` does not tag, bump, or
publish.

## Attribution

The boundary freeze, provenance inventory, cross-interaction sweep, documentation ledger and the two
changelog hazards were reimplemented independently from the technique described in
`akitaonrails/my-skills`. That repository declares no license; no upstream text, structure or file was
reused, and no reuse license is assumed. The release step described there was deliberately not ported.

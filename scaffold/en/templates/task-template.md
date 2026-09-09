---
type: task
schema_version: "1.1"
status: pending
---

# Task X.0: [Main Task Title]

Read the relevant PRD/TechSpec sections and task constraints; use the links below.

## Overview

[Brief task description]

**Functional Requirements covered**: FR-X.Y, FR-X.Z
Depends on: none

<requirements>
[List of mandatory requirements]
</requirements>

## Execution assignment

Mirror this task's approved entry in `execution-plan.json` (see `.dw/references/execution-contract.md`).

| Complexity + rationale | Tool | Model / effort | Agents | Approved fallbacks |
|---|---|---|---|---|
| standard — [reason] | local | inherit / inherit | none | none |

## Implementation

- [ ] [Behavior to deliver]
- [ ] [Relevant verification and acceptance checks]

## Verification and success criteria

| Behavior / risk | Existing suite or new test | Command / observable evidence |
|---|---|---|
| [Required outcome] | [Lowest effective layer; new test only if needed] | [Project command or inspection] |

Use the project's test strategy. Define mocks only at justified boundaries; do not impose coverage percentages or a new test for every edit. Include important failure cases where applicable.

## Relevant files and decisions

[Source paths and relevant TechSpec/ADR sections; do not duplicate entire documents.]

## Commit on completion

Use the scoped atomic commit protocol in `/dw-run`. Stage only this task's files, retain requirement IDs, record the resulting SHA in tasks.md/run-log, and include final bookkeeping before delivery. No push or merge is implied.

## Related ADRs

[ADRs that constrain this task's decisions. Leave empty if none.

- `adrs/adr-NNN.md` — [short title, how the decision affects this task]]

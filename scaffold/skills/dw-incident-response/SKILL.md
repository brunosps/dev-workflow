---
name: dw-incident-response
description: Use when production breaks or for postmortems. 5 phases (triage → investigation → resolution → comms → postmortem), runbook templates. Triggers on outage, SEV-1, SEV-2, on-call handoff.
allowed-tools:
  - Read
  - Write
  - Bash
---

# Incident Response

> **Inspired by** [`wilsto/claude-code-starter-kit/incident-response`](https://github.com/wilsto/claude-code-starter-kit) (MIT). Five-phase workflow structure and runbook templates adapted from that skill; specifics rewritten for dev-workflow's `.dw/` namespace and command surface.

> wilsto credits the original `wshobson/agents` plugin `incident-response` (v1.3.0). Attribution chain: wshobson → wilsto → dev-workflow.

## When to use

- A production incident is declared (SEV-1 through SEV-3).
- You need to write a postmortem after an incident.
- You're generating or updating a runbook for a service.
- You need an on-call handoff template.
- `/dw-bugfix` detects severity `critical` + production marker — auto-escalates here.

## Key concepts

### Severity classification

| Severity | Criteria | Response time | Example |
|----------|----------|---------------|---------|
| **SEV-1 (Critical)** | Service down, data loss, security breach | Immediate (page) | Payment system offline |
| **SEV-2 (Major)** | Significant degradation, partial outage | < 30 min | API latency 10× normal |
| **SEV-3 (Minor)** | Limited impact, workaround exists | < 4 hours | One endpoint returning 500s |
| **SEV-4 (Low)** | Cosmetic, non-urgent | Next business day | Dashboard chart broken |

See `references/severity-and-triage.md` for full criteria and triage commands per stack.

### Behavioral rules

1. **Execute phases in order** — never skip a phase.
2. **Write output files after each phase** — they are the record of truth for the next phase.
3. **STOP at checkpoints** — wait for user confirmation before proceeding.
4. **Halt on failure** — if a step fails, do not continue to the next phase.
5. **File-based context** — read previous phase outputs rather than relying on conversation memory.

## Entry questions

Before starting any phase:

1. **What's happening?** Describe the incident in 1–2 sentences. What's broken and what's the user impact?
2. **Severity?** SEV-1 / SEV-2 / SEV-3 / SEV-4 per the table above.
3. **Mode?**
   - **Full workflow** — all 5 phases (triage → postmortem).
   - **Postmortem only** — incident already resolved; skip to Phase 5.
   - **Runbook generation** — produce a runbook template for a service (no live incident).

## The five phases

For the five phases, read `references/the-five-phases-detail.md`. Load only when this part of the task applies.

## Required reading by context

| Doing what | Read |
|------------|------|
| Live incident — triage | `references/severity-and-triage.md` |
| Writing the postmortem | `references/postmortem-template.md` + `references/blameless-discipline.md` |
| Drafting incident communications | `references/communication-templates.md` |
| Generating a runbook (no live incident) | `references/runbook-templates.md` |
| On-call handoff document | `references/runbook-templates.md` (handoff section) |

## Common pitfalls

Detailed in `references/blameless-discipline.md`:

1. **Skipping triage** — jumping to debug without assessing severity/blast-radius wastes the wrong hours.
2. **Blame culture** — postmortems focused on "who did it" hide mistakes and incidents recur.
3. **No action items** — postmortem filed, forgotten, same incident in 3 months.
4. **Communicating too late** — users discover the outage before the team acknowledges; trust erodes.

## Integration with dev-workflow commands

- `/dw-bugfix` with severity `critical` + production marker → offers to escalate here.
- `/dw-autopilot --incident "X"` → runs this workflow end-to-end for declared incidents.
- `/dw-analyze-project` reads `.dw/incidents/` on next execution to surface recurring failure patterns. 3+ incidents touching the same area → flag as "structural problem; needs design review" and propose constitution principles based on observed patterns.
- `/dw-generate-pr` is the fix-deployment path during Phase 3.
- `/dw-adr` is the right tool when the postmortem leads to a deliberate architectural change.

## Output directory layout

```
.dw/incidents/
├── 2026-05-12-checkout-payment-outage/
│   ├── 01-triage.md
│   ├── 02-investigation.md
│   ├── 03-resolution.md
│   ├── 04-communication.md
│   └── 05-postmortem.md
└── 2026-05-08-search-index-stale/
    └── 05-postmortem.md     # postmortem-only mode
```

Files are committed to the repo alongside code — incidents are part of the project history, not ephemeral chat.

## Why this skill exists

dev-workflow's existing surface is "build feature → ship." Nothing covered "production broke, what now?" Teams improvised postmortems, action items got lost, and the same bug recurred. This skill closes that loop: structured response in the moment, blameless reflection after, and cross-incident learning that feeds back into the project's constitution.

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when incident triage, resolution, comms, and follow-up are complete, `FINDINGS` when incident work remains, `BLOCKED` when severity/ownership/evidence is missing, `NOT_APPLICABLE` when no incident workflow is in scope.
- **Scope:** incident id, severity, service, timeline window, and owner.
- **Evidence:** symptoms, customer impact, logs/metrics, mitigation, and verification.
- **Artifacts:** incident files, communication draft, action items, or postmortem path.
- **Decisions:** severity, mitigation path, rollback/fix choice, and communication cadence.
- **Risks:** recurring cause, incomplete customer notice, weak action items, or missing monitoring.
- **Next Step:** next incident phase or postmortem/action-item owner.

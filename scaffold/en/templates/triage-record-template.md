---
type: triage-record
schema_version: "1.0"
id: "NNN-<slug>"
category: "bug | enhancement"
state: "needs-triage | needs-info | ready-for-work | needs-human | wontfix"
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
---

# Triage: <title>

## Source

| Field | Value |
|-------|-------|
| Source Type | paste / file / github-issue / github-pr / other |
| Source Ref | <path, URL, issue number, PR number, or pasted-session marker> |
| Author | <name or unknown> |
| Reported At | <date or unknown> |
| Retrieved By | local / gh / pasted / owner-provided |

## Intake Summary

<Short summary of the request in domain language.>

## Classification

| Field | Value |
|-------|-------|
| Category | bug / enhancement |
| State | needs-triage / needs-info / ready-for-work / needs-human / wontfix |
| Domain Concept | <concept slug and human name> |
| Disposition Reason | <why this state was chosen> |

## Codebase Checks

### Redundancy Search

| Area Searched | Query / Concept | Result |
|---------------|-----------------|--------|
| `.dw/domain/**` | <concept> | <match / no match / missing> |
| `.dw/spec/**` | <concept> | <match / no match / missing> |
| `.dw/bugfixes/**` | <concept> | <match / no match / missing> |
| `.dw/rules/**` | <concept> | <match / no match / missing> |
| Code / tests / docs | <concept> | <match / no match> |

### Prior Rejection Search

| Record | Similarity | Decision |
|--------|------------|----------|
| `.dw/out-of-scope/<concept>.md` | <why similar> | applies / does not apply / reopened |

## Verification

| Field | Value |
|-------|-------|
| Verification Status | confirmed / failed-to-reproduce / insufficient-detail |
| Verification Method | reproduce steps / PR diff review / relevant tests / product inventory check |
| Commands Run | <commands or n/a> |
| Files Inspected | <paths> |
| Evidence | <what was observed> |

## Needs Info

<!-- If state is needs-info, paste the body from triage-needs-info-template.md here. Otherwise write "n/a". -->

n/a

## Routing

| Condition | Route |
|-----------|-------|
| ready-for-work + bug | `/dw-bugfix` |
| ready-for-work + enhancement | `/dw-plan prd` |
| malformed request | `/dw-brainstorm --mode=grill` |
| needs-human | owner action |
| wontfix | no downstream work |

Selected route: <route or n/a>

## Out-of-Scope Link

<If rejected, link `.dw/out-of-scope/<concept>.md`. If already implemented, link the implementation and state that no out-of-scope record was written.>

## History

- YYYY-MM-DD — needs-triage -> <state> — <actor> — <reason>

---
type: frontend-quality
schema_version: "1.0"
status: draft
---

# Frontend quality baseline

Use for a requested frontend audit or quality-tooling plan. Embed in the existing `.dw/rules/<module>.md` for an audit, or in the feature's TechSpec for implementation. A feature needs only affected rows. This template records decisions; it does not configure tools or authorize new gates.

- Module and scope: [workspace, runtime entry points, relevant diff]
- Observed at: [revision plus working-tree changes, date]
- Stack: [framework/compiler/runner/package-manager versions, lockfile]
- Existing policy: [instructions, rules, scripts and CI paths]

## Controls

Keep observation and proposal separate. Preserve existing required checks. Policy values: `required`, `advisory`, `deferred`, `not_applicable`. An unadopted proposal is `deferred`; record execution separately as `passed`, `failed` or `not_run`. Explain exclusions and missing evidence. Do not mark missing tools as passed or silently enforce a proposed gate.

| ID | Risk/control to inspect | Observed configuration and gaps | Policy / proposed change | Exact command, cwd and scope | Evidence / execution |
|---|---|---|---|---|---|
| contract | API authority, generated client drift, runtime validation | | | | |
| types | Effective TypeScript strictness and unsafe escapes | | | | |
| lint | Relevant framework, test and accessibility diagnostics | | | | |
| boundaries | Allowed imports, server/client separation, production entry points | | | | |
| custom-rules | Repeated defect, detector fixtures and actionable errors | | | | |
| feedback | Discoverable local rules and optional hook feedback | | | | |
| mutation | Critical behavior, survivor investigation and cache validity | | | | |
| dead-code | Runtime/public reachability, generated files, reviewed exclusions | | | | |
| duplication | Shared business rules versus intentional repeated markup | | | | |
| ci | Required jobs, observable failures, deploy dependencies and repository rules | | | | |

## Adoption and validation

- Next change: [risk it removes, files/config to change, compatible tool already present or proposed dependency]
- Existing debt: [baseline location; keep it distinct from newly introduced defects]
- Promotion condition: [evidence needed to move advisory to required; decision owner]
- Exceptions: [specific rule/path, reason, owner and review trigger; no blanket exclusions]
- Detector checks: [deliberately invalid fixture, legitimate fixture, alias/generated-path cases and unsupported cases]
- Analysis limits: [not executed, unavailable service, incomplete graph or CI/repository settings not inspected]
- Delivery checks: [required commands and behavioral acceptance; reuse evidence only for equivalent inputs/environment/scope]

For operational guidance, read `dw-ui-discipline/references/frontend-engineering.md` from the installed skills location. Put accepted implementation work in the task execution matrix; continue under existing authorization. An audit alone ends with the documented findings and proposed changes.

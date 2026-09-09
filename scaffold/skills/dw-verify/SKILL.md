---
name: dw-verify
description: Validate completion, commit or PR claims against acceptance criteria and applicable project checks, reusing evidence only while its inputs remain valid.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# Verification grounded in evidence

A claim must match observed evidence. Inspect output and acceptance criteria; do not infer success from code edits, confidence, a worker's self-score, or a green build alone.

## Select checks

Follow required project gates from applicable instructions, package scripts and CI. Use focused tests while implementing or correcting defects, then complete the project's required delivery checks. Run lint/build only when applicable or required; do not invent absent scripts or demand zero pre-existing warnings when the project does not.

For frontend changes, consult the module's documented quality baseline or TechSpec: distinguish required checks from advisory diagnostics and deferred proposals. Check generation drift, typechecking, architecture and test evidence where applicable. Tool presence, a high score or an empty analysis scope is not a passing result. A local hook does not prove CI enforcement or branch protection.

For behavior changes, verify relevant acceptance criteria and meaningful failure cases. For a small prose/config edit, use an appropriate inspection or validator; lack of a test runner alone does not block that claim. Report limits honestly. New tests should detect a plausible defect, not mirror implementation or language behavior. Explicit TDD requests retain their red/green contract.

## Evidence validity

For every check record command, exit code, output/log path, time, revision and relevant diff/input fingerprint, environment fingerprint and scope covered. Include relevant untracked/generated files, dependencies/lockfiles, tool configuration, runtime and external fixtures. The fingerprint must represent actual inputs; a timestamp or HEAD alone is insufficient when the worktree is dirty.

Reuse a passing record when command, inputs, environment and claim scope remain equivalent and its output can be inspected. A new message, review stage or bookkeeping-only commit does not by itself invalidate checks. Unknown fingerprints/environment, changed inputs, new findings or broader claims require appropriate fresh checks. If uncertain which inputs matter, rerun the required check instead of inventing validity.

The installed helper `.dw/scripts/lib/workflow-contract.mjs` exports `reusableEvidence(record, current)` for comparing known fingerprints and scopes; callers still gather the actual evidence. Store records in execution-state.json for planned tasks, or the existing verification/QA report for standalone work.

## Failures and delivery

Read failures and diagnose production behavior before changing tests. Correct failures caused by the requested change; rerun affected checks, then any invalidated required delivery gates. Do not weaken assertions, hide blocking findings, or claim a skipped check passed. Unrelated failures are reported with attribution and handled under project policy.

Before commit/PR, inspect the scoped diff and acceptance criteria and confirm all applicable required checks have valid passing evidence. Reuse a verified worker/CI result under the same validity rules; independently inspect the delivery, not blindly trust a summary. Security and constitution gates remain in force. A passing pipeline does not itself authorize commit, merge or publication.

## Verification report

Record a compact VERIFICATION REPORT with Claim, Command, Executed, Revision/inputs, Environment, Scope, Exit code, Output summary/log, Warnings, Errors and Verdict (`PASS`, `FAIL`, or `NOT_APPLICABLE`). Say which evidence was reused and why. The user-facing response may summarize these records with links; full logs need not be pasted into every message.

Read `references/verification-discovery-and-attribution.md` when project gate discovery or attribution is needed. Read `references/pre-check-and-status.md` only for diff-hygiene checks or polling format.

## Structured Return

- **Status:** `PASS` valid evidence supports the claim; `FINDINGS` failed/incomplete checks; `BLOCKED` a required check cannot run; `NOT_APPLICABLE` no verification claim.
- **Scope:** claim, relevant files/inputs, checks and environment.
- **Evidence:** commands, exit codes, inspectable logs, fingerprints and acceptance criteria.
- **Artifacts:** verification report, task state, screenshots or CI link.
- **Decisions:** selected checks, evidence reused and reasons for inapplicable checks.
- **Risks:** unknown environment, stale inputs, missing checks or uncovered behavior.
- **Next Step:** fix, required check, or validated handoff.

---
name: security-review
description: Use for security code review. OWASP patterns (injection, XSS, auth, authz, crypto, SSRF, secrets). Confidence-based reporting. Triggers on 'security review', auth/payment code, or /dw-secure-audit.
allowed-tools: Read, Grep, Glob, Bash, Task
license: LICENSE
---

<!--
Reference material based on OWASP Cheat Sheet Series (CC BY-SA 4.0)
https://cheatsheetseries.owasp.org/
-->

# Security Review Skill

Identify exploitable security vulnerabilities in code. Report only **HIGH CONFIDENCE** findings—clear vulnerable patterns with attacker-controlled input.

## Scope: Research vs. Reporting

**CRITICAL DISTINCTION:**

- **Report on**: Only the specific file, diff, or code provided by the user
- **Research**: The ENTIRE codebase to build confidence before reporting

Before flagging any issue, you MUST research the codebase to understand:
- Where does this input actually come from? (Trace data flow)
- Is there validation/sanitization elsewhere?
- How is this configured? (Check settings, config files, middleware)
- What framework protections exist?

**Do NOT report issues based solely on pattern matching.** Investigate first, then report only what you're confident is exploitable.

## Confidence Levels

| Level | Criteria | Action |
|-------|----------|--------|
| **HIGH** | Vulnerable pattern + attacker-controlled input confirmed | **Report** with severity |
| **MEDIUM** | Vulnerable pattern, input source unclear | **Note** as "Needs verification" |
| **LOW** | Theoretical, best practice, defense-in-depth | **Do not report** |

## Automated scanners + false-positive validation (fp-check)

The Security Gate (`/dw-secure-audit`) pairs this human-style review with deterministic tools:
- **SAST** — Semgrep, diff-focused on the generated code. See `references/sast.md`.
- **Secrets** — gitleaks (dedicated) + Trivy. See `references/secrets.md`. Any secret = REJECTED.

Tool findings are **not** auto-trusted to block. Apply the SAME reachability discipline to them before a
finding blocks the gate (the **fp-check** step):

1. **Reachable?** Trace the flagged sink back — is it on a path attacker-controlled input can reach?
2. **Controlled?** Is the input actually attacker-controlled, or a constant / server-controlled value
   (see the table below) / framework-mitigated?
3. **Verdict:** If both hold → keep as blocking at its tier. If provably unreachable or
   trusted-input → **downgrade to advisory** and write the one-line justification in the findings file.
   Never silently drop a tool finding — log every downgrade so the pattern stays auditable.

Exception: **secrets do not get an fp-check downgrade** — a real-looking credential is removed and
rotated, not argued away (only committed `.gitleaks.toml` allowlist entries for known fixtures apply).

## Do Not Flag

For do not flag, read `references/do-not-flag-detail.md`. Load only when this part of the task applies.

## Review Process

For review process, read `references/review-process-detail.md`. Load only when this part of the task applies.

## Severity Classification

| Severity | Impact | Examples |
|----------|--------|----------|
| **Critical** | Direct exploit, severe impact, no auth required | RCE, SQL injection to data, auth bypass, hardcoded secrets |
| **High** | Exploitable with conditions, significant impact | Stored XSS, SSRF to metadata, IDOR to sensitive data |
| **Medium** | Specific conditions required, moderate impact | Reflected XSS, CSRF on state-changing actions, path traversal |
| **Low** | Defense-in-depth, minimal direct impact | Missing headers, verbose errors, weak algorithms in non-critical context |

---

## Quick Patterns Reference

For quick patterns reference, read `references/quick-patterns-reference-detail.md`. Load only when this part of the task applies.

## Output Format

```markdown
## Security Review: [File/Component Name]

### Summary
- **Findings**: X (Y Critical, Z High, ...)
- **Risk Level**: Critical/High/Medium/Low
- **Confidence**: High/Mixed

### Findings

#### [VULN-001] [Vulnerability Type] (Severity)
- **Location**: `file.py:123`
- **Confidence**: High
- **Issue**: [What the vulnerability is]
- **Impact**: [What an attacker could do]
- **Evidence**:
  ```python
  [Vulnerable code snippet]
  ```
- **Fix**: [How to remediate]

### Needs Verification

#### [VERIFY-001] [Potential Issue]
- **Location**: `file.py:456`
- **Question**: [What needs to be verified]
```

If no vulnerabilities found, state: "No high-confidence vulnerabilities identified."

---

## Reference Files

### Core Vulnerabilities (`references/`)
| File | Covers |
|------|--------|
| `injection.md` | SQL, NoSQL, OS command, LDAP, template injection |
| `xss.md` | Reflected, stored, DOM-based XSS |
| `authorization.md` | Authorization, IDOR, privilege escalation |
| `authentication.md` | Sessions, credentials, password storage |
| `cryptography.md` | Algorithms, key management, randomness |
| `deserialization.md` | Pickle, YAML, Java, PHP deserialization |
| `file-security.md` | Path traversal, uploads, XXE |
| `ssrf.md` | Server-side request forgery |
| `csrf.md` | Cross-site request forgery |
| `data-protection.md` | Secrets exposure, PII, logging |
| `api-security.md` | REST, GraphQL, mass assignment |
| `business-logic.md` | Race conditions, workflow bypass |
| `modern-threats.md` | Prototype pollution, LLM injection, WebSocket |
| `misconfiguration.md` | Headers, CORS, debug mode, defaults |
| `error-handling.md` | Fail-open, information disclosure |
| `supply-chain.md` | Dependencies, build security |
| `logging.md` | Audit failures, log injection |

### Language Guides (`languages/`)
- `python.md` - Django, Flask, FastAPI patterns
- `javascript.md` - Node, Express, React, Vue, Next.js
- `go.md` - Go-specific security patterns
- `rust.md` - Rust unsafe blocks, FFI security
- `java.md` - Spring, Java EE patterns

### Infrastructure (`infrastructure/`)
- `docker.md` - Container security
- `kubernetes.md` - K8s RBAC, secrets, policies
- `terraform.md` - IaC security
- `ci-cd.md` - Pipeline security
- `cloud.md` - AWS/GCP/Azure security

## Structured Return

When invoked directly or by a harness, return or merge this block:

- **Status:** `PASS` when no high-confidence security findings remain, `FINDINGS` when exploitable issues exist, `BLOCKED` when threat context or sensitive paths cannot be inspected, `NOT_APPLICABLE` when no security-relevant surface is in scope.
- **Scope:** assets, trust boundaries, languages/frameworks, data classes, and threat model slice.
- **Evidence:** file/line references, exploit path, affected data/actor, and reference category.
- **Artifacts:** security findings, verification notes, remediation plan, or audit report.
- **Decisions:** severity, confidence, exploitability, and false-positive rejection.
- **Risks:** authz bypass, injection, secret exposure, SSRF, supply chain, logging, or misconfiguration.
- **Next Step:** minimal remediation, verification, or explicit accepted risk owner.

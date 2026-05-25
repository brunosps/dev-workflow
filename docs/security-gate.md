# Security Gate

The **Security Gate** (`/dw-secure-audit`) is an explicit pipeline phase that runs **after `/dw-review`
and `/dw-qa`, before `/dw-commit` / `/dw-generate-pr`**. It checks two things rigorously:

1. **Known vulnerabilities in dependencies** (CVEs, compromised packages).
2. **Vulnerabilities in the generated code** (SAST + secrets, focused on the diff).

It is **native and MIT-clean** — it wraps OSS tools directly. No external skills are vendored or required.

## Detection layers

| Layer | Tool | License | What it catches |
|-------|------|---------|-----------------|
| OWASP static review | `security-review` skill | (OWASP CC-BY-SA refs) | Injection, authz, crypto, SSRF, etc. — HIGH-confidence, diff-focused |
| SAST | **Semgrep** | LGPL-2.1 | Semantic code patterns on the diff (`--baseline-commit`); rulesets `p/security-audit`, `p/owasp-top-ten`, `p/secrets` |
| Secrets | **gitleaks** (+ Trivy) | MIT / Apache-2.0 | Hardcoded credentials in the diff |
| SCA / IaC | **Trivy** | Apache-2.0 | Dependency CVEs, IaC misconfig, secrets (defense in depth) |
| Lockfile audit | `npm/pnpm/pip/dotnet/cargo audit` | — | Lockfile-level CVEs |
| Supply-chain | **OSV.dev** + GitHub Advisories | — | Compromised / malicious package versions |
| Outdated | native outdated checks | — | Dependency freshness (advisory) |
| SBOM / license | **syft** (optional) | Apache-2.0 | SBOM + license inventory (advisory, non-blocking) |

## Generated-code focus (the diff)

The gate's priority is the code just written. Layers that support it scope to the diff against the PR base
(`git merge-base HEAD origin/main`): Semgrep `--baseline-commit`, gitleaks `--log-opts <base>..HEAD`, and the
OWASP review of the diff. A `--full` periodic pass scans the whole tree.

## Thresholds (Rigoroso)

| Tier | Blocks? |
|------|---------|
| SECRET | **YES — no ADR exception** (rotate + remove) |
| COMPROMISED | YES |
| CRITICAL / HIGH (CVE or reachable SAST) | YES (ADR can justify acceptance) |
| MEDIUM / LOW | Advisory |
| OUTDATED | Advisory |

### False-positive validation (fp-check)

Before a SAST/OWASP finding blocks, it must survive a reachability check: the flagged sink is reached by
attacker-controlled input. Provably-unreachable or trusted-input findings are **downgraded to advisory with
a logged justification** (never silently dropped). Secrets are exempt — they are rotated, not argued away.

## Enforcement

- The gate writes `.dw/secure-audit/audit-summary.md` (APPROVED / REJECTED) plus per-layer reports.
- `/dw-autopilot` runs it as an explicit step after review/QA; the pre-commit check requires a fresh
  APPROVED summary.
- `/dw-generate-pr` blocks PR creation if the summary is missing, stale, or REJECTED.
- Constitution principles **P-010** (secrets) and **P-011** (high-severity SAST) back the gate.

## Tools & install

```bash
npx @brunosps00/dev-workflow install-deps   # Trivy, Semgrep, gitleaks (+ syft) — detect/instruct
```

All scanners are optional individually: a missing tool degrades that layer and is **reported** in the
summary (the gate never crashes for a missing scanner), but the missing coverage is visible.

## Provenance / licensing

This gate is implemented **natively** (MIT). The *patterns* draw on OWASP Top 10:2025 / ASVS and on the
analysis approaches popularized by [Trail of Bits' security skills](https://github.com/trailofbits/skills)
(fp-check, differential review, insecure-defaults, supply-chain auditing) — but **no CC-BY-SA content is
copied**; we wrap the same underlying OSS tools (Semgrep, gitleaks, Trivy, OSV). Snyk and CodeQL are
intentionally out of the default path (CodeQL is an optional periodic deep scan).

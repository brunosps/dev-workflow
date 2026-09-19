## Review Process

### 1. Detect Context

What type of code am I reviewing?

| Code Type | Load These References |
|-----------|----------------------|
| API endpoints, routes | `authorization.md`, `authentication.md`, `injection.md` |
| Frontend, templates | `xss.md`, `csrf.md` |
| File handling, uploads | `file-security.md` |
| Crypto, secrets, tokens | `cryptography.md`, `data-protection.md` |
| Data serialization | `deserialization.md` |
| External requests | `ssrf.md` |
| Business workflows | `business-logic.md` |
| GraphQL, REST design | `api-security.md` |
| Config, headers, CORS | `misconfiguration.md` |
| CI/CD, dependencies | `supply-chain.md` |
| Error handling | `error-handling.md` |
| Audit, logging | `logging.md` |

### 2. Load Language Guide

Based on file extension or imports:

| Indicators | Guide |
|------------|-------|
| `.py`, `django`, `flask`, `fastapi` | `../languages/python.md` |
| `.js`, `.ts`, `express`, `react`, `vue`, `next` | `../languages/javascript.md` |
| `.go`, `go.mod` | `languages/go.md` |
| `.rs`, `Cargo.toml` | `../languages/rust.md` |
| `.java`, `spring`, `@Controller` | `languages/java.md` |

### 3. Load Infrastructure Guide (if applicable)

| File Type | Guide |
|-----------|-------|
| `Dockerfile`, `.dockerignore` | `../infrastructure/docker.md` |
| K8s manifests, Helm charts | `infrastructure/kubernetes.md` |
| `.tf`, Terraform | `infrastructure/terraform.md` |
| GitHub Actions, `.gitlab-ci.yml` | `infrastructure/ci-cd.md` |
| AWS/GCP/Azure configs, IAM | `infrastructure/cloud.md` |

### 4. Research Before Flagging

**For each potential issue, research the codebase to build confidence:**

- Where does this value actually come from? Trace the data flow.
- Is it configured at deployment (settings, env vars) or from user input?
- Is there validation, sanitization, or allowlisting elsewhere?
- What framework protections apply?

Only report issues where you have HIGH confidence after understanding the broader context.

### 5. Verify Exploitability

For each potential finding, confirm:

**Is the input attacker-controlled?**

| Attacker-Controlled (Investigate) | Server-Controlled (Usually Safe) |
|-----------------------------------|----------------------------------|
| `request.GET`, `request.POST`, `request.args` | `settings.X`, `app.config['X']` |
| `request.json`, `request.data`, `request.body` | `os.environ.get('X')` |
| `request.headers` (most headers) | Hardcoded constants |
| `request.cookies` (unsigned) | Internal service URLs from config |
| URL path segments: `/users/<id>/` | Database content from admin/system |
| File uploads (content and names) | Signed session data |
| Database content from other users | Framework settings |
| WebSocket messages | |

**Does the framework mitigate this?**
- Check language guide for auto-escaping, parameterization
- Check for middleware/decorators that sanitize

**Is there validation upstream?**
- Input validation before this code
- Sanitization libraries (DOMPurify, bleach, etc.)

### 6. Report HIGH Confidence Only

Skip theoretical issues. Report only what you've confirmed is exploitable after research.

---

## Adversarial verification of a candidate

The fp-check is this skill's instance of a general rule: the reasoning that produced a finding cannot be
the reasoning that confirms it. Once a trace reaches a conclusion, re-reading it feels like verification
and is not.

When subagents are available, run the fp-check as a fresh refuter rather than as self-review. Hand over the
claim and the raw code — the flagged sink, the file, the entry points that reach it — and withhold how the
finding was reached and what severity you were going to give it. A finding handed over as `critical` comes
back confirmed more often than the identical finding handed over as `medium`, and that difference is the
anchor, not the evidence. `dw-review-rigor/references/refutation-pass.md` carries the packet contract and
the ordered list of upstream guards to check; `dw-finding-refuter` is the agent.

The third verdict matters most here. A reachability question that cannot be settled is
`needs-validation` — it carries no severity, and it records the missing fact plus what would settle it.
Inflating it into a blocking finding and quietly dropping it are the two failures this class exists to
prevent, and a security gate is exactly where both are tempting.

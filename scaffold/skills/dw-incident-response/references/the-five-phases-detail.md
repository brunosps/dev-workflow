## The five phases

Each phase writes to `.dw/incidents/<YYYY-MM-DD>-<slug>/`. Slug is auto-generated from incident title (kebab-case, ≤30 chars).

### Phase 1 — Detection & Triage

**Output:** `.dw/incidents/<date>-<slug>/01-triage.md`

Steps:
1. Classify severity using the table above.
2. Assess blast radius: which services, how many users affected, revenue impact if known.
3. Identify immediate mitigation: rollback, feature flag toggle, traffic redirect.

See `severity-and-triage.md` for diagnostic commands per stack (Kubernetes, Docker, generic HTTP).

**Checkpoint:** present triage summary. Wait for user confirmation before moving to investigation.

### Phase 2 — Investigation & Root Cause

**Output:** `.dw/incidents/<date>-<slug>/02-investigation.md`

Steps:
1. Build timeline: when did it start? What changed?
2. Correlate signals: metrics spike + deploy + error logs.
3. Hypothesis testing: one theory at a time; verify each before moving on.
4. Identify root cause: not the first symptom, but the underlying assumption that broke.

Common forensic tools:
- `git bisect` for regressions.
- Recent deploy log: `git log --oneline --since="24 hours ago"`.
- For live monitoring during investigation, `/dw-debug-protocol` flaky-investigation patterns apply.

**Checkpoint:** present root-cause hypothesis. Wait for user confirmation before applying fix.

### Phase 3 — Resolution & Recovery

**Output:** `.dw/incidents/<date>-<slug>/03-resolution.md`

Steps:
1. Apply fix: hotfix branch → fast PR (via `/dw-generate-pr`) → deploy.
2. Verify: health checks green, error rate back to baseline.
3. Monitor 30 minutes post-fix for SEV-1/2 to confirm stability.

**Checkpoint:** confirm full recovery before drafting communications.

### Phase 4 — Communication

**Output:** `.dw/incidents/<date>-<slug>/04-communication.md`

Two communications generated using the templates in `communication-templates.md`:
- **Initial notification** (sent during the incident; updated every 30 min for SEV-1/2).
- **Resolution notification** (sent when phase 3 confirms recovery).

### Phase 5 — Postmortem

**Output:** `.dw/incidents/<date>-<slug>/05-postmortem.md`

Generate a **blameless** postmortem using `postmortem-template.md`. Sections:
- Summary (2–3 sentences).
- Timeline (per-minute events from alert to all-clear).
- Root cause (technical, no blame).
- Impact (users affected, revenue, error-budget consumed).
- What went well / What went wrong.
- Action items (owner + due date + priority — see `blameless-discipline.md` for the quality bar).

**Quality bar for action items:** see `blameless-discipline.md`. "Improve monitoring" does NOT count. "Add Datadog SLO alert at p99 > 800ms with on-call routing by 2026-06-01, owner: @bruno" counts.

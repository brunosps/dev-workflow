## The Protocol — Detect → Fetch → Implement → Cite

### 1. Detect — read the actual version first

Before researching anything, read the project's manifest and identify the EXACT version of the library/framework that matters:

| Stack | File | Field |
|-------|------|-------|
| Node/TS | `package.json` | `dependencies`, `devDependencies` |
| Python | `pyproject.toml`, `requirements*.txt`, `Pipfile.lock` | each dep with version |
| .NET | `*.csproj`, `packages.lock.json` | `PackageReference Version="..."` |
| Rust | `Cargo.toml`, `Cargo.lock` | `[dependencies]` |

Record the version. If a range (`^4.18.0`), note the lockfile-resolved version.

If no manifest exists OR the dep is not yet in the manifest (e.g., choosing what to install), record "no version yet — choosing fresh".

### 2. Fetch — pull the matching version's official docs

Authority hierarchy:

1. **Official docs** for the EXACT version (or nearest stable). E.g., `react.dev/reference/react?version=18` not `react.dev` default.
2. **Official changelog / migration guide** when transitioning across versions.
3. **Web standards** (MDN, RFCs, W3C) for cross-implementation behavior.
4. **Compatibility tables** (caniuse, Compat data) for API support across runtimes.

Forbidden as primary source:

- Stack Overflow answers (use only as discovery, then verify via official).
- Tutorial blogs (frequently outdated; never authoritative).
- AI training data (your training is months/years stale).
- README screenshots from random GitHub repos.

Fetch via `WebFetch` or `mcp__context7__*` if available. If both fail, surface to the user that you're falling back to training-data knowledge AND mark the citation `[source: training-data, unverified]`.

### 3. Implement — apply the documented pattern

Use exactly the API the documented version provides. Don't mix patterns from multiple versions ("this useEffect example is from React 16; you're on 18.3"). When the doc shows multiple acceptable patterns, pick the simplest that matches the project's style.

If the doc presents migration warnings (e.g., "deprecated in v5, use X instead"), follow the new path unless the project explicitly pins to the old version for a documented reason.

### 4. Cite — record the source verifiably

Every decision that depended on an external source ends with a citation block:

```
[source: <url>, version: <X.Y>, retrieved: <YYYY-MM-DD>]
```

Examples:

```
[source: https://react.dev/reference/react/useEffect, version: 18.3, retrieved: 2026-05-07]
[source: https://docs.python.org/3.12/library/asyncio-task.html, version: 3.12, retrieved: 2026-05-07]
[source: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html, version: SDK v3, retrieved: 2026-05-07]
```

When citing in PRDs, techspecs, decision logs, or deps-audit reports, the citation is mandatory adjacent to each claim. A future engineer reading the doc can click and verify.

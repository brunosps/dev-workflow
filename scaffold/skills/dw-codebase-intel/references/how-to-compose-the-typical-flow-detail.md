## How to Compose (the typical flow)

1. **`/dw-intel --build`** is invoked.
2. The command spawns `intel-updater` with `focus: full` (first run) or `focus: partial --files <paths>` (incremental).
3. The agent reads source files using iterative retrieval: broad search, relevance evaluation, refined search, then final read set. Use Glob/Read/Grep; no Bash file listing for cross-platform safety.
4. The agent writes the intel files (`stack.json`, `files.json`, `apis.json`, `deps.json`, `arch.md`) plus token-lean codemaps in `.dw/intel/codemaps/` when enough structure exists.
5. If `.dw/bugfixes/` exists and contains at least one `SUMMARY.md`, the agent additionally scans every SUMMARY frontmatter + Files Touched section and writes `bugfixes.json`. SUMMARY files with invalid frontmatter are logged and skipped.
6. The agent writes `.last-refresh.json` with timestamps + hashes for incremental change detection on the next run, including a `bugfixes_indexed` count.
7. `/dw-intel --build` reports completion and invites the user to query via `/dw-intel "<question>"`.

For human-readable analysis (architecture overview, module conventions, anti-patterns), run `/dw-analyze-project` after `/dw-intel --build` — it reads `.dw/intel/` as input and produces `.dw/rules/`.

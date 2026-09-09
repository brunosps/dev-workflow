## Files in `.dw/intel/`

The intel directory is the contract. Every file is machine-parseable and references real file paths.

| File | Purpose | Format |
|------|---------|--------|
| `stack.json` | Languages, frameworks, build/test tooling, package manager | JSON |
| `files.json` | File graph: per-file imports/exports/type | JSON |
| `apis.json` | API surface: routes, methods, params, source file | JSON |
| `deps.json` | Dependencies: version, type, used_by, invocation | JSON |
| `bugfixes.json` | Historical bugfix index aggregated from `.dw/bugfixes/*/SUMMARY.md` (slug, date, modules touched, related concerns, by_module map). Optional — present only if `.dw/bugfixes/` is non-empty. | JSON |
| `arch.md` | Human-readable architecture overview + key components + data flow | Markdown |
| `codemaps/*.md` | Token-lean architecture maps for architecture/backend/frontend/data/dependencies. Optional but recommended for large repos. | Markdown |
| `.last-refresh.json` | Timestamps + content hashes for incremental detection (now includes `bugfixes_indexed` count) | JSON |

Schemas are documented in `intel-format.md`.

## How `/dw-intel` Reads This

`/dw-intel "auth flow"` does:

1. Check `.dw/intel/.last-refresh.json` — is the index fresh (within last 7 days)? If stale, suggest re-running `/dw-intel --build`.
2. Search `apis.json` for matching paths/descriptions.
3. Search `files.json` for matching exports.
4. Search `arch.md` (full-text) for the keyword.
5. Cross-reference with `deps.json` if the query is about a library.
6. Return a structured answer with file paths cited, each tagged with a `relevance` (0–1, or high/medium/low) and a one-line reason — so the calling command reads the high-relevance files first and skips the rest, instead of loading the whole result set. Ordering by relevance is what keeps intel queries token-lean.

If no `.dw/intel/` exists at all, `/dw-intel` falls back to `.dw/rules/` (seeded by `/dw-new-project` or `/dw-analyze-project`) and direct grep over the codebase.

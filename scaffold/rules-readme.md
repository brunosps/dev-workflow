# Project Rules

This directory contains auto-generated project rules created by the `analyze-project` command.

## How to populate

Run the `/analyze-project` command inside your AI assistant to scan your codebase and generate:

- `index.md` — Project overview, stack summary, quick reference
- `{module}.md` — Per-module detailed rules with patterns and conventions

## Structure

```
ai/rules/
├── README.md          # This file
├── index.md           # Project overview (auto-generated)
└── {module}.md        # Per-module rules (auto-generated)
```

## Usage

These rules are automatically read by workflow commands (`create-prd`, `create-techspec`, `run-task`, etc.) to ensure generated artifacts follow your project's conventions.

Re-run `/analyze-project` whenever your stack or conventions change significantly.

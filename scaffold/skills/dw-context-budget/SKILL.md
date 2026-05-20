---
name: dw-context-budget
description: Audit context overhead from commands, skills, agents, MCPs, and instruction files before sessions degrade.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# dw-context-budget

Use when a project has many commands, skills, agents, MCP servers, or long instruction files.

## Audit Targets

- `CLAUDE.md` and `AGENTS.md`
- `.dw/commands/*.md`
- `.agents/skills/*/SKILL.md`
- `.agents/agents/*.md`
- `.claude/agents/*.md`
- `.opencode/agent/*.md`
- `.claude/settings.json`

## Heuristics

- Prose estimate: `word count * 1.3`
- JSON/code estimate: `character count / 4`
- Flag command files over 20KB
- Flag `SKILL.md` files over 12KB
- Flag agent files over 8KB
- Flag more than 10 configured MCP servers
- Flag duplicate copies loaded by more than one platform when a fallback would be enough

## Report

Return:

1. Estimated overhead by category.
2. Top 10 largest files.
3. Duplicate or overlapping components.
4. Top 5 concrete savings.
5. What must remain loaded because commands depend on it.

Inspired by ECC's `context-budget` and `strategic-compact` patterns; adapted for dev-workflow's `.dw/` scaffold and cross-platform wrappers.

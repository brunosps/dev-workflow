---
name: dw-search-first
description: Research-before-building protocol for dependencies, integrations, MCP servers, libraries, and reusable skills.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# dw-search-first

Use before writing custom infrastructure, adding an integration, choosing a dependency, or inventing a reusable helper.

## Protocol

1. Define the capability needed and the project constraints.
2. Search the existing repo first.
3. Check installed skills and `.dw/intel/` for a local pattern.
4. Check package registries or official docs when network/tools are available.
5. Compare adopt, wrap, compose, or build custom.
6. Record the decision in the TechSpec or ADR when it affects architecture.

## Decision Rules

- Adopt if there is a maintained exact match with acceptable license and dependency cost.
- Wrap if the package is strong but needs a thin local adapter.
- Compose if two small tools beat one large dependency.
- Build custom only after search channels were checked or explicitly unavailable.

Inspired by ECC's `search-first`; adapted to compose with `dw-source-grounding`, `/dw-plan`, and `/dw-find-skills`.

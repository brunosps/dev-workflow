# Agent Maintenance Notes

This repository ships the dev-workflow scaffolding itself. Do not confuse these maintenance rules with `scaffold/en/agent-instructions.md` or `scaffold/pt-br/agent-instructions.md`, which are installed into consumer projects.

## Required Checks

- Run `npm test` before considering a change ready. The test script is `node --test test/*.test.js`.
- Run `npm run validate` before considering a change ready. It validates the skill registry, agent registry, and generated Claude plugin manifests.
- Do not change `package.json` version or `CHANGELOG.md` unless the maintainer explicitly asks.

## Scaffold Parity

- Keep `scaffold/en/` and `scaffold/pt-br/` in parity. If a command, template, or installed instruction changes in one locale, update the matching file in the other locale.
- `test/parity.test.js` enforces load-bearing parity tokens for selected contracts; passing tests do not remove the responsibility to keep paired files equivalent.

## Commands, Skills, And Agents

- A new `dw-*` command needs an entry in both `COMMANDS.en` and `COMMANDS['pt-br']` in `lib/constants.js`.
- A new scaffold skill under `scaffold/skills/` needs a matching entry in `scaffold/skill-registry.json`. `lib/skill-registry.js` requires core registry fields and a Structured Return contract in each skill's `SKILL.md`.
- Agent metadata is governed by `scaffold/agent-registry.json`; `lib/agents.js` requires schema version `2.0` and the required agent fields.

## Plugin Manifests

- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` are generated from `scaffold/skill-registry.json` by `npm run build:plugin`.
- If registry or plugin generation changes, run `npm run build:plugin` and keep generated manifests in sync. `npm run validate` fails on manifest drift.

## External Patterns

- Patterns ported from external repos must be recorded in `docs/skills-ecosystem-comparison.md`, including what was adopted or rejected and the attribution/licensing context.

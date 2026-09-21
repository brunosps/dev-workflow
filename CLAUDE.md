# Claude Maintenance Notes

Follow [AGENTS.md](./AGENTS.md) for this repository's maintenance rules.

In short: preserve EN/PT scaffold parity, register new commands in both `lib/constants.js` lists, register new skills in `scaffold/skill-registry.json`, regenerate plugin manifests with `npm run build:plugin` when needed, record externally ported patterns in `docs/skills-ecosystem-comparison.md`, run `npm test` plus `npm run validate` before marking work ready, and run the matching eval in `evals/README.md` for any dangerous surface touched before publishing.

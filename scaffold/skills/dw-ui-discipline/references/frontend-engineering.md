# Frontend engineering controls

Read when planning frontend architecture, auditing a frontend module, or reviewing changes to its data flow, dependencies or quality tooling. A visual/copy-only edit needs only the relevant UI checks. This reference can be used directly without running visual grounding for an API client or CI configuration change.

## Discover before changing

Inspect the target workspace's scripts, lockfile, framework, compiler, API source, lint configuration, entry points and CI. Reuse working controls. Record observed configuration separately from proposed policy; an absent tool is not a failed check. Installation of dev-workflow does not authorize replacing consumer tooling.

For a project audit, use the installed `frontend-quality-template.md` in `.dw/templates/` to document the baseline in the module's existing rules file. For a feature, include only affected decisions in its TechSpec. Read those decisions during implementation and review. A request to analyze produces findings and proposals; an authorized implementation may add compatible scripts/configuration and validate them.

When using this skill standalone without the scaffold template, record the same compact control fields from the adoption section below in the project's existing document; no template installation is required.

## Contract and type boundaries

- Identify the authoritative API schema and its owner/revision before introducing response fields. If generation is used, record the generator version, command and output paths. Review contract changes, regenerate reproducibly and inspect drift; correct the source or generator rather than editing generated output.
- When there is no maintained schema, derive a narrow boundary from verified backend code or documented responses and test it; label unresolved assumptions. Do not invent an OpenAPI specification from frontend guesses.
- Runtime data still needs validation at relevant trust boundaries. Generating a validator is insufficient unless the actual response path calls it and handles failure. [Hey API's Zod integration](https://heyapi.dev/docs/openapi/typescript/plugins/zod) is one option when compatible with the existing client.
- For TypeScript, inspect effective inherited configuration. Consider [`strict`](https://www.typescriptlang.org/tsconfig/strict.html), [`noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html) and [`exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html). Migrate by package or a coherent project boundary; passing filenames to a compiler invocation must not accidentally bypass project settings. Do not hide migration errors behind casts, `any` or non-null assertions.

## Architecture and lint feedback

Derive allowed imports from the project's architecture, including framework-specific server/client boundaries. Reuse an existing graph checker; [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) is an option for JS/TS. Verify aliases, workspace packages, type imports and legitimate framework entry points. A rejected dependency should identify its source, forbidden destination and the intended placement. Do not impose a universal folder layout.

Choose lint rules against concrete failure modes and the installed runner: missing assertion awaits, accidentally focused tests, unsafe type escapes and inaccessible JSX. For React state changes, check whether an Effect actually synchronizes an external system; derived values and event responses often belong in rendering or handlers. Preserve legitimate synchronization. See [React's Effect guidance](https://react.dev/learn/you-might-not-need-an-effect).

For a recurring repository-specific defect, prefer an existing rule. A custom detector needs a documented failure mode, an actionable diagnostic and valid/invalid fixtures. Exercise aliases, exclusions and unsupported syntax; an unresolved import is an analysis limitation, not proof of safety. Use an AST or the framework's parser when syntax matters. [ESLint's RuleTester workflow](https://eslint.org/docs/latest/extend/custom-rule-tutorial) supports rule validation. Avoid adding a regex-based import graph when the existing tool already models it.

## Code that should disappear

Evaluate dead-code findings against runtime reachability and public exports before deletion. Configure framework/plugin entry points, generated sources and workspace aliases. Tests alone can keep otherwise unused production code appearing live: [Knip production mode](https://knip.dev/features/production-mode) provides a separate view of shipped code and does not replace its normal analysis. Validate a newly configured detector with an intentionally unused fixture and a legitimately reachable fixture in an isolated workspace.

Use textual duplication reports such as [jscpd](https://github.com/kucherenko/jscpd) as candidates for inspection. Apply different policies to repeated markup/fixtures and business calculations. Search for semantic duplicates too. Consolidate only when copies represent the same rule and should evolve together; a shared abstraction must preserve callers' behavior. Record exclusions with a reason and review trigger, instead of growing blanket ignores to make a report green.

## Tests and adoption

When critical logic changes or existing tests appear weak, use the testing skill's `references/mutation-testing.md` if available. Mutation testing complements contract and user-flow tests; neither coverage nor a diagnostic score establishes acceptance.

For each adopted control record: risk, configuration, exact workspace command, scope, baseline, enforcement status, evidence and owner/review trigger. Use `required`, `advisory`, `deferred` or `not_applicable`; record actual execution separately (`passed`, `failed`, `not_run`). Start noisy new controls as advisory, triage findings, then promote demonstrated checks. Existing required gates remain required. Typechecking, builds and dependency graphs often need the whole affected project even when lint or mutation analysis can target a diff.

Local hooks may shorten feedback, but CI must execute required checks independently of editor or agent hooks. Keep failures identifiable; verify that deployment depends on successful required jobs and that repository rules actually require the intended status checks. Do not claim a workflow file alone establishes branch protection. Advisory mutation runs may publish findings without a score threshold; report execution failures explicitly. Never hide a required check behind `continue-on-error`, an empty selection or a silently skipped job.

Record command, inputs, environment and analysis scope through `dw-verify` when available. Treat new ignores, disabled rules, changed generation/configuration and lost CI coverage as reviewable changes. Delivery still requires checking product behavior, architecture and accessibility; automated findings reduce review work without replacing that judgment.

## Attribution

Workflow adaptation prompted by Yuri Mikhin's [Evil Martians article](https://evilmartians.com/chronicles/ten-anti-ai-slop-moves-for-frontend-projects-going-faster-than-humans-can-review), September 1, 2026. Procedures are independently written for dev-workflow and supported by the primary documentation linked above (checked September 9, 2026). No article text, source code or third-party tool is bundled here.

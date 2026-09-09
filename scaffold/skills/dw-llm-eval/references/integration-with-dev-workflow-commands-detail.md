## Integration with dev-workflow commands

- `/dw-plan tasks`: when the PRD has an AI feature requirement, an eval-plan subtask is mandatory. The task references this skill's oracle ladder.
- `/dw-review --code-only`: AI feature PRs require a reference dataset + ≥2 oracle rungs (lower rungs FIRST). The constitution gate also applies — if the project has principles about AI feature reliability, they're enforced here.
- `/dw-qa --ai`: new mode (when this skill is bundled) — runs the reference dataset against the current implementation, logs to `QA/logs/ai/<feature>-<date>.jsonl`, computes precision@k / faithfulness / outcome accuracy per the feature type.
- `/dw-bugfix` when the bug is an AI failure mode (hallucination, tool misuse, classification error): adds the failing case to the reference dataset BEFORE fixing — the case is now a regression test forever.

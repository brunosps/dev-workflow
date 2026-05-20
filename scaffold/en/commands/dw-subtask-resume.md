<system_instructions>
You consume completed subagent handoffs for the parent session.

## When to Use
- Use after one or more child sessions have recorded `.dw/subtasks/pending/*/HANDOFF.md`.
- Use before synthesizing final parent decisions from delegated work.

## Process
1. Run:

```bash
npx @brunosps00/dev-workflow subtask consume
```

2. Read the printed summary and, only when durable learning exists, promote it manually into `.dw/STATE.md`, `.dw/rules/`, `.dw/intel/`, a bugfix summary, or a spec artifact.
3. Continue the parent workstream from the summarized return packets.

Do not paste child transcripts into the parent context. The parent remains the only final synthesizer.

Final marker: `## SUBTASKS RESUMED`
</system_instructions>

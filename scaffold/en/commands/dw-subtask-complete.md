<system_instructions>
You record a structured subagent handoff.

## When to Use
- Use inside the child/subagent session when the assigned subtask is complete, blocked, or out of budget.

## Required Handoff Shape

```markdown
## Objective

## Result

## Files Read

## Files Changed

## Decisions

## Risks

## Verification

## Next Steps

## Blocked Or Not Done
```

## Process
1. Write the handoff to a local markdown file.
2. Run:

```bash
npx @brunosps00/dev-workflow subtask complete --slug=<slug> --file=<handoff.md>
```

Return summarized evidence only. Do not include full logs or transcript dumps.

Final marker: `## SUBTASK HANDOFF RECORDED`
</system_instructions>

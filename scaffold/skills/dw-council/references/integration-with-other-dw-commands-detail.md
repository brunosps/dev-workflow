## Integration With Other dw-* Commands

- **`/dw-brainstorm --council`** (opt-in): invokes the council after the normal brainstorm to stress-test the top 2-3 options before recommending
- **`/dw-plan techspec --council`** (opt-in): invokes the council on the primary architectural decision of the techspec before finalizing
- **Standalone** `/dw-council "<dilemma>"` (if registered as a command — currently this is a bundled skill invoked by the two above; it can be promoted to a command in a future release if direct usage becomes common)

The `--council` flag is **additive**: omitting it produces the normal brainstorm/techspec flow. Including it adds a debate section to the output.

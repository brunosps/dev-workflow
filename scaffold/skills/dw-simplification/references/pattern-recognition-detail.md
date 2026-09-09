## Pattern recognition

Frequent simplification targets — but apply Rules 1-5 before acting:

| Smell | Healthy refactor | When NOT to refactor |
|-------|------------------|----------------------|
| Deep nesting (4+ levels) | Early returns / guard clauses | When the nesting maps to a real domain hierarchy (e.g., visitor pattern) |
| Long function (>50 lines) | Extract method | When the "natural" extraction would produce 3-4 single-call helpers — you're trading complexity for indirection |
| Generic name (`data`, `info`, `helper`) | Rename to specific | When the function genuinely processes generic input (e.g., a serializer middleware) |
| Duplication (same 5 lines twice) | Extract to function/constant | When the duplication is by design (e.g., independent business rules that may diverge) |
| `if/elif/else` chain (5+ branches) | Strategy pattern / lookup table | When the branches are naturally exclusive states with branch-specific logic |

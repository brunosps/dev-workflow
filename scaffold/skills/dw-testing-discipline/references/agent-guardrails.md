# Test-authoring checks

Read when designing or reviewing agent-authored tests. Apply checks to actual behavior rather than mandatory output tokens.

1. Identify the behavior, owning layer and existing suite. Infer these from approved requirements and repository evidence; ask only if expected product behavior remains ambiguous.
2. Execute production logic. Use a real DB/integration fixture when the changed contract depends on it, a contract test for external boundaries, and browser tests for meaningful interactive risk. Pure logic can be verified in unit tests.
3. Investigate failures before changing tests. Distinguish a code defect, outdated expectation, environment issue or unrelated failure, and explain material expectation changes.
4. Reject self-confirming mock assertions. Snapshots require a meaningful stable contract and inspected diffs; prefer direct assertions when they express behavior more clearly.
5. Include relevant error/invalid-input cases where they can detect a real defect. A fixed negative-test quota or assertion count does not measure coverage quality.
6. Extend existing suites when suitable and avoid production branches solely for tests. Keep new files when a separate behavior boundary justifies them.

A review finding needs evidence that a test can pass for the wrong reason, fail nondeterministically, miss a relevant defect, or constrain implementation unnecessarily. Missing ceremonial preamble text is not a defect.

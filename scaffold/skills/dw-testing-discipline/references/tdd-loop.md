# Test-first red-green loop

Use this procedure only when the user or task explicitly asks for test-first work: "TDD", "test first", "red-green-refactor", or equivalent wording. It operates inside the six core rules from `dw-testing-discipline`; it does not replace or weaken them.

## 0. Confirm the public seam

Before writing the first test, identify the public boundary that should own the behavior:

- API route, CLI command, exported function, component behavior, contract test, browser flow, or other public seam.
- The invariant the user cares about, in one sentence.
- The lowest layer that can detect the defect or missing behavior.

Ask the user to confirm the seam before writing any code:

```
I plan to test this at `<public seam>` because it is the lowest public boundary that proves `<invariant>`.
Confirm this seam, or point me at the boundary you want covered.
```

If the user rejects the seam, revise it and ask again. Do not test private helpers or internals just to make the first test easier.

## 1. Write one red test

Write exactly one test for the next vertical slice of behavior.

- The test must assert observable behavior through the confirmed public seam.
- The test must not be tautological: removing or breaking the production behavior should make it fail.
- The test must not couple to implementation details, private methods, internal call order, or mock shape.
- Mocks are allowed only at system boundaries you do not control.

Do not write a batch of future tests before the first implementation. A vertical slice is one failing test, one minimal implementation, one green run.

## 2. Run and observe red

Run the narrowest test command that exercises the new test and capture the actual failure.

The red state is valid only when the observed failure is the expected failure:

- The test fails because the behavior is missing or wrong.
- The test does not fail because of syntax, import, fixture, selector, clock, network, or mock setup problems.
- The failure message points at the invariant under test.

If the failure is not the expected red, fix the test setup or seam choice before touching production code.

## 3. Implement the minimum green

Change production code only as much as needed to satisfy the one failing test while preserving existing behavior.

- Prefer the existing codebase patterns.
- Do not add test-only branches, flags, exports, or helper methods to production.
- Do not broaden the solution for future slices that do not yet have a red test.

## 4. Run and observe green

Run the same narrow command first. If it passes, run the relevant broader project test command before moving to the next slice.

Record the command and outcome. A presumed green is not enough.

## 5. Continue vertically

Only after the current slice is green:

1. Choose the next behavior slice.
2. Write one new red test.
3. Run and observe red.
4. Implement the minimum green.
5. Run and observe green.

Stop when the requested behavior is covered at the public seam and the relevant project gate is green.

## Refactor happens after the loop

Refactoring is not part of the red-green cycle. After the behavior slices are green, run a separate review pass. If simplification is warranted, delegate that pass to `dw-simplification` and keep the tests green throughout.

## Hard stops

Stop and ask for clarification when:

- No public seam is identifiable.
- The user will not confirm the seam.
- The only test you can write is tautological or coupled to internals.
- The required mock would replace behavior owned by this codebase.
- The next slice is unclear enough that the invariant cannot be stated in one sentence.

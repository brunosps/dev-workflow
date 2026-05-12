# Six Iron Laws — expanded with examples

The laws are short for memorization. Each carries nuance that matters in practice.

## Law 1: Test the behavior, never the mock

**What it means:** Your test asserts what the system DOES from the caller's perspective. It does not assert that internal call X was made with internal argument Y.

**Why it matters:** A test bound to internal calls breaks the day you refactor — even when behavior didn't change. The "test is red, behavior is fine" experience erodes trust in the suite. Soon no one runs the suite.

**Violation example:**

```javascript
// BAD — asserting on mock internals
test('createOrder calls inventory.reserve', () => {
  const inventory = { reserve: vi.fn() };
  createOrder({ items: [...] }, inventory);
  expect(inventory.reserve).toHaveBeenCalledWith(items, 'reserve');
});
```

You've asserted that `createOrder` USES the inventory adapter in a specific way. Now the refactor that consolidates `reserve` into `commit-with-reservation` breaks this test even though the order still gets created.

**Correct version:**

```javascript
// GOOD — asserting behavior
test('createOrder reserves inventory before confirming', async () => {
  const result = await createOrder({ items: [...] });
  expect(result.status).toBe('confirmed');
  expect(await getInventoryFor(items[0].sku)).toBe(originalStock - 1);
});
```

Now the test cares about the OUTCOME (inventory decremented, order confirmed), not the path.

## Law 2: Push every test to the lowest layer that can detect the failure

**What it means:** If a unit test can catch a bug, use it. If only an integration test can catch it, integration. If only an end-to-end run can catch it, E2E. Don't write E2E for what a unit can prove.

**Why it matters:** Tests at lower layers run faster, fail more precisely, isolate the cause better. A bug in pure logic caught at unit takes 50ms and tells you the exact function. The same bug caught at E2E takes 30 seconds and tells you "checkout failed."

**The pyramid resolved:**

| Layer | Catches | Speed | Cost |
|-------|---------|-------|------|
| Unit | Pure logic, math, parsing, formatters | <100ms | low |
| Integration | Module composition, DB queries, HTTP handlers | 500ms–5s | medium |
| Contract | Producer/consumer agreement at API boundary | 1–10s | medium |
| E2E | User journey across multiple services | 10s–60s | high |

**Rule of thumb:**
- If you can write a unit test for it, do so.
- If unit can't reach it (needs DB, queue, real HTTP), write integration.
- E2E only for journeys that NO lower layer can detect (browser-renders-correctly, third-party-callback-arrives, multi-step session state).

## Law 3: When a test fails, fix production first — change the test only after writing why

**What it means:** A red test is a signal. The first question is "what's wrong with production?" Not "why is the test wrong?"

**Why it matters:** Tests are weakened to pass FAR more often than they should be. "The behavior is fine; the test is too strict" is the slippery slope that leaves you with a green suite full of meaningless assertions.

**Process when a test goes red:**

1. **Read the failure message.** What invariant did the test claim, and what did it observe?
2. **Read production code** in the path that produces the observation.
3. **Decide which is wrong.** If production violates the invariant, fix production. If the test mis-states the invariant, document WHY before relaxing.
4. **Commit the analysis** in the test's commit message or PR body. "Relaxed assertion from X to Y because <reason>" is auditable; "fix test" is not.

**Anti-pattern:** Re-run the test until green. Auto-retry on flake. Add `.only` to skip the rest.

## Law 4: Real systems gate the merge. Mocks isolate; they do not validate.

**What it means:** Before code merges to main, at least ONE test path exercised real systems (real DB, real route, real external integration in a sandbox or test account). Mocks are fine for fast unit feedback; they cannot decide "safe to ship."

**Why it matters:** Mock drift is real. The mocked HTTP response from 3 months ago no longer matches the actual API. Tests pass; production fails on first real call.

**Practical pattern:**

- Unit tests: mock the world; run on every keystroke / on every commit.
- Integration tests: real local DB (testcontainers, in-memory if equivalent); run on every PR.
- Contract tests: real producer/consumer agreement check; run on every PR.
- E2E: real preview environment with real services; run on PRs before merge to main.

The discipline: no merge without a green E2E (or equivalent real-system check) for the touched path.

## Law 5: Coverage is a flashlight. Mutation score is a quality probe. Neither is a target.

**What it means:**
- **Coverage** tells you what lines executed. Useful as a NEGATIVE signal: 30% coverage = lots of dark code. Useless as a positive signal: 95% coverage with weak assertions is decorative.
- **Mutation score** introduces small bugs (mutations) and measures whether tests catch them. A high mutation score means tests are actually probing behavior, not just executing lines.
- Neither should be a number you optimize for. They're diagnostics.

**Anti-pattern:** "We need 90% coverage to merge." Coverage as a gate produces tests written to pass the gate, not to find bugs.

**Healthier framing:** "What lines in the touched diff are NOT covered? Why?" Sometimes the answer is "we don't care, it's logging." Sometimes it's "actually that's a critical branch, add a test."

## Law 6: No test-only methods, branches, or flags leak into production code

**What it means:** Production code should not have `if (process.env.NODE_ENV === 'test') { ... }` branches. Should not have `// for testing only` methods exposed on classes. Should not export internals just for assertions.

**Why it matters:** Production code carrying test-only logic is testing decorations leaking into the artifact users run. Bug surface grows; the test environment diverges from production.

**Correct patterns:**

- Need to inject a dependency for testing? Use constructor injection / dependency injection.
- Need to assert on internal state? Add a logging hook or event emission that production also benefits from.
- Need to bypass auth in tests? Use a dedicated test environment with test credentials, not a backdoor flag.

**Tell tales:**
- `// only used in tests` comments.
- `*ForTesting` suffix on methods.
- `vi.spyOn(module, '_internal')` accessing things prefixed with underscore.
- `process.env.E2E_MODE` reaching into production runtime decisions.

If you see these, the test design is wrong. Refactor production to be testable, don't add backdoors.

## Putting the laws together

A healthy test:
1. Asserts behavior visible to a caller (Law 1).
2. Sits at the lowest layer that can prove that behavior (Law 2).
3. When red, sends you to read production code (Law 3).
4. Has a sibling that exercises real systems somewhere in the pipeline (Law 4).
5. Survives a mutation in the code it claims to cover (Law 5).
6. Has zero footprint in production code (Law 6).

Any test that fails ≥2 of these is technical debt accumulating. `/dw-code-review` flags them.

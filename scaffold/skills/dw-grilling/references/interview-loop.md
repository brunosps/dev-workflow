# Interview loop — the per-turn contract

The unit of a grill is **one turn = one unresolved decision**. This file specifies the exact shape of a turn and
the fact-vs-decision discipline that keeps the interview honest.

## Question template

Every question is presented in this order. Skipping any part means the question is not ready to ask.

1. **Evidence (when available).** The facts you discovered from the repo/rules/intel/docs that bound this
   decision, each with its source: `` src/orders/state.ts:42 defines OrderStatus = pending | paid | shipped ``.
   If there is no evidence yet, discover it first — do not open with an unbounded question.
2. **The decision.** State the single choice on the table in one sentence.
3. **Recommended answer.** Your pick. Not "it depends" — commit to a default and let the user overrule it.
4. **Rationale.** One line on why the recommendation wins in *this* project's context.
5. **Alternative + trade-off.** At least one real alternative and what it costs — so the user is choosing, not
   rubber-stamping. A recommendation with no stated alternative hides the trade-off.

Then **stop and wait.** Do not ask the next decision, do not preview the rest of the tree, do not answer your own
question. Integrate the reply, then move to the next node.

## Fact vs decision

The single most important discrimination in a grill:

- **Fact** — has one correct answer discoverable from the codebase, rules, intel, migrations, config, or
  authoritative docs. *Look it up. Never ask.* Asking a fact wastes the user's turn and signals you did not read.
  Example: "does the API already return `order_id` or `orderId`?" → grep, don't ask.
- **Decision** — has no single correct answer; it is a choice among viable options with a trade-off. *This is
  what you ask*, one at a time, always with a recommendation. Example: "should a partially-refunded order be a
  distinct state or a flag on `refunded`?"

When a "fact" turns out to be contested (the code says one thing, the user says another), that contradiction
itself becomes a decision — surface it: *"You said the API returns `OrderId`, but `src/api/orders.ts:42` returns
`{ order_id, status }`. Which is canonical?"*

## Recommendation discipline

- Recommend from evidence, not taste. Tie the pick to a rule, a code pattern, a constraint, or a prior decision.
- Make the recommendation falsifiable: state the one condition that would flip it.
- If you genuinely cannot recommend (truly balanced, user-values-dependent), say so explicitly and present the
  two options with their trade-offs — but this should be rare. Defaulting to "no recommendation" is the failure
  mode this protocol exists to prevent.

## Anti-patterns

- **Batching.** Five questions in one message. The reviewer skims and half go unanswered.
- **Interrogating facts.** Asking what the repo already states — reads as not having done the homework.
- **Empty questions.** "What should we do about caching?" with no recommendation and no alternative.
- **Leading past the answer.** Recommending, then implementing the recommendation before the user replies.
- **Vague acceptance.** Taking "sure, sounds good" to a bundle of decisions as alignment. One decision, one
  explicit answer.

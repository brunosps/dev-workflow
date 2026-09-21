# Vector catalogue

Cross the diff with this list and pick what applies. Selecting every vector for every diff is how a chaos
run turns into theatre — the skipped vectors, each with one line on why, are part of the plan.

## Boundaries
Zero · negative · `MAX_SAFE_INTEGER` and the language's numeric ceiling · empty, one, and N+1 · the
off-by-one at a page or batch edge · leap day · a timezone that is not the author's · DST transition.

## Nulls and absence
An optional field omitted entirely (not sent as null) · `null` versus `undefined` where the code treats
them alike · empty object versus missing object · a field the external API stopped returning.

## Broken money
Rounding at the cent · installments that do not sum to the total · negative amounts · a discount above
100% · float arithmetic where decimal is required · currency mismatch · a refund larger than the payment.

## Hostile dependencies
The external API returns 500 · 429 with and without `Retry-After` · a timeout with no response at all ·
truncated JSON · valid JSON with the wrong shape · the cache is down · a database deadlock · a job dies
mid-flight leaving its work half-applied.

## Concurrency and idempotency
The same request submitted twice · a duplicated webhook · a job reprocessed after a retry · a cron racing
a live request · two writers on the same row · a read between a check and its use.

## Hostile payloads
Emoji and combining characters · mixed encodings · a 10k-character string in a field sized for 50 ·
injection strings that must remain inert · HTML inside free text · a number arriving as a string · deeply
nested structures.

## Impossible state
An enum value outside the domain · an orphaned foreign key · an expired session presented as valid · a
status transition the state machine does not define · a record referencing a deleted parent.

## Contract violation
An external type that flipped between deploys · an unknown enum member · an extra unexpected field · page
2 of a paginated response arriving empty · a schema version the code does not know.

---

Each attack asserts what the system **should** do under that condition. An attack written to assert the
current broken behaviour is not an attack — it is a regression test for the bug.

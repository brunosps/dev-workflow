# Glossary format and context routing

Where domain vocabulary lives, what an entry looks like, and how to decide between a single flat glossary and a
multi-context map.

## Paths (created lazily)

| Path | Purpose |
|---|---|
| `.dw/domain/glossary.md` | The single-context default. One flat glossary for the whole project. |
| `.dw/domain/context-map.md` | Multi-context index: names each bounded context and the terms that cross or clash between them. |
| `.dw/domain/contexts/<slug>.md` | One glossary per bounded context (`<slug>` = kebab-case context name). |

Never write vocabulary to root `CONTEXT.md` or to `.dw/rules/<module>.md`. The `.dw/rules/` files are
auto-generated analysis of what the code IS; the glossary is human-curated vocabulary and must survive
`/dw-analyze-project` runs untouched.

Create files only when a term is **resolved** and the Grill flow has **write authorization**. Do not scaffold
empty files or write an unresolved term.

## Entry format

Each term is a short entry:

```markdown
### Order
A customer's committed request to buy one or more items, in one of: pending, paid, shipped, delivered, refunded.

_Avoid:_ Purchase, Cart, Transaction
```

Rules for an entry:

- **One or two sentences.** Define what the term **is**, not what a class does. If it needs a paragraph, the
  concept is probably two concepts — split it.
- **`_Avoid:_` line** lists the discouraged synonyms. Pick one canonical term; every competing word goes here so
  the debate does not reopen.
- **Exclude** implementation detail (files, classes, tables, endpoints), requirements/NFRs, scratch notes, and
  general programming concepts (timeout, retry, DTO, cache) even if heavily used.
- **Inclusion test:** *is this concept unique to this domain, or is it general programming?* Only the former is a
  glossary term. `Order`, `Tenant`, `Dunning` — yes. `Timeout`, `Repository`, `Idempotency key` — no.

Group entries under `##` subheadings when natural clusters emerge; a flat list of `###` terms is fine for a small
glossary.

## Single vs multi context — how to route

Start with **one flat `.dw/domain/glossary.md`**. It is the right default and stays right until a word genuinely
means different things in different parts of the system.

Split to multi-context only when a term **clashes across bounded contexts** — e.g. `Account` means a login in
Identity but a ledger in Billing. Then:

1. Create `.dw/domain/context-map.md`. List each context (Identity, Billing, Shipping…), a one-line description,
   and the **shared or clashing terms** with the context each meaning belongs to.
2. Move each context's terms into `.dw/domain/contexts/<slug>.md` (e.g. `contexts/billing.md`).
3. In the context map, note translations: "Billing `Account` ≈ Identity `Organization`, not Identity `Account`."

Do not split pre-emptively. A single clean glossary beats three thin ones. When in doubt, stay single-context and
record the tension as a grill decision rather than forking files.

## Interaction with /dw-analyze-project

`/dw-analyze-project` must, when `.dw/domain/**` exists: read it, link it from `.dw/rules/index.md` (so
downstream commands find the canonical vocabulary), and **preserve it verbatim** — never regenerate, merge, or
overwrite. The analyzer owns `.dw/rules/**`; the Grill flow owns `.dw/domain/**`.

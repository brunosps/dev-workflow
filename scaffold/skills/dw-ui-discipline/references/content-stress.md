# Content stress — break the UI with realistic worst-case data

> Adapted from the `break-ui` skill in [`emilkowalski/skills`](https://github.com/emilkowalski/skills)
> (MIT © 2026 Emil Kowalski). The worst-case catalog, failure signatures and truncate/wrap/clamp rule come
> from there, condensed. Injection at the data boundary, severity mapping and routing into `/dw-qa`,
> `/dw-review` and `/dw-redesign-ui` are written for dev-workflow.

The state matrix (`state-matrix.md`) asks *which states* a surface has. This reference asks the other
question: what happens when the data inside a state is the data real users actually produce. Demo data is
chosen, usually without anyone noticing, to make the design look good: `Jane Doe`, `jane@acme.com`,
`12 members`, every optional field filled in. Production has `Aleksandra Wiśniewska-Kowalczyk`, an email
with a 40-character domain, an intern called `Jo`, and a workspace of 1,284 members.

## Two failure modes (the first is worse)

1. **Nonsense data.** `"aaaaaaaaaaaaaaaaaaaaaaaa"` and 5,000-character names prove nothing, and the team rightly
   stops listening. Every worst-case value must be something a real user could produce, or the actual
   limit the backend accepts.
2. **Stopping at long text.** The breaks that ship are usually the short ones: the one-letter name, the
   missing avatar, the count of exactly 1 (`1 members`), the empty list, the badge whose text got
   translated.

## Rules

1. **Plausible or schema-backed, never random.** Each value is a realistic example or the real limit from
   the validation schema (Zod, Yup, Valibot), the database column, the API contract or the form
   `maxLength`. No limit found is itself a finding: record the field as `unbounded`. A 50-character input
   that saves to a 255-character column will eventually receive 255 characters through an import or the
   API.
2. **Change the data, not the component.** The worst case enters through the same boundary the demo data
   does: the fixture, the mock, the story args, the API stub, or a network route in the browser test. Never
   hand-edit markup or CSS to produce a break; that tests the edit, not the component.
3. **One dataset, many failures.** Spread different failures across the first rows of a list (row 1 the
   long name, row 2 the unbreakable email, row 3 the one-letter name), the way real data mixes them.
4. **Dev-only.** A worst-case switch (`?data=worst`, a story, a prototype route) never ships to production.
5. **Report before fixing.** Some breaks are design decisions (truncate or wrap? hide the role or reserve
   its line?). List every break with a proposed fix; fixing is the owning command's call.
6. **Keep the fixture.** It is the regression test for the next person who touches the component.
7. **Fixture domains:** use `example.com`, `example.org` or `.test` so a fixture never points at a real
   inbox or site.

## Step 1 — map the surface

List every value the component renders, with its source and limit:

| Field | Source | Type | Limit | Optional? |
|---|---|---|---|---|
| `name` | `member.name` | string | 255 (`schema.ts:14`) | No |
| `email` | `member.email` | string | unbounded | No |
| `role` | `member.title` | string | 120 | Yes |
| `count` | `workspace.memberCount` | int | — | No |

Include the values people forget: counts in headers, relative timestamps, badge and status text, button
labels that come from data, tooltips, avatar images, and the list itself (its length is a value too).

**Done when** every rendered value is in the table with a source and a limit or `unbounded`.

## Step 2 — build the worst case from the catalog

Pick from the rows that apply to the fields in the table.

### People and names

| Value | Breaks |
|---|---|
| `Aleksandra Wiśniewska-Kowalczyk` | Long, hyphenated, diacritics; wraps, and the hyphen is a break point |
| `Christopher Alexander Montgomery III` | Suffix; naive first + last initials give `CI` |
| `Jo` / `J` | Name column mostly empty; naive initials, tiny click target when the name is the link |
| `Đặng Thị Ngọc Hân` | Stacked diacritics clipped by tight `line-height` + `overflow: hidden` |
| `王秀英` | CJK, no spaces; "first + last word" initials finds one word |
| `نور الهدى عبد الرحمن` | RTL; punctuation and icons land on the wrong side without `dir="auto"` |
| `María José de la Cruz y Fernández` | Lowercase particles; initials and last-name sorting |
| `🦊 Fox` / `👩🏽‍💻 Priya` | Emoji first: `.charAt(0)` returns half a surrogate pair; ZWJ sequences split when sliced |
| `  Sam   Lee ` | Leading, trailing, repeated spaces; initials from empty words |
| *(missing)* | Only an email exists; the UI must fall back to something |

### Emails, URLs, identifiers (unbreakable strings)

| Value | Breaks |
|---|---|
| `bartholomew.fitzgerald@northwind-industries-holdings.example.com` | Pushes every sibling off the row without `overflow-wrap: anywhere` |
| `a@b.co` | Layout that assumed a long email looks empty |
| `first.last+billing-notifications@example.com` | Validation rejecting `+`; truncation hiding the meaningful part |
| A 100-character URL with path and query | Overflow; end-truncation hides the part that differs |
| `9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f` | UUID; middle-truncation candidate |
| `Q3 Board Deck — FINAL (revised) v12 [approved].pdf` | End-truncation hides version and extension |

### Labels and copy from data

| Value | Breaks |
|---|---|
| `Senior Product Design Engineer, Platform Infrastructure` | Wraps to three lines in a secondary slot |
| `Invitation expired 12 days ago` | Long status badge squeezes the name column |
| `Benachrichtigungseinstellungen` | 30-character German compound, no break opportunity |
| French or German translation of a short label | UI copy runs ~30% longer in translation |
| Twelve tags on one item / one 45-character tag | Tag wall without a `+N` overflow; a tag wider than its container |
| `Untitled` / empty string / `   ` | Collapsed heading, zero-height row |
| `<script>alert(1)</script>` / `&amp;` / `**bold**` | Must render as literal text |
| Newline inside a single-line field | Doubles row height or is silently dropped |
| A 2,000-character pasted description | Clamp, "show more", textarea growth |

### Numbers and money

| Value | Breaks |
|---|---|
| `0` / `1` | Zero states, division by zero in percentages; `1 members`, `1 days ago` |
| `1284` / `1000000` | Thousands separator; badge width (consider compact `1M` where precision does not matter) |
| `12345678.9` as currency | Overflows totals columns |
| `-42.5`, `142%`, `-3%` | Sign and color logic; bars and meters past their bounds |
| `0.1 + 0.2`, `null`, `undefined`, `NaN` | Rendered raw |
| `1.284` (de-DE) vs `1,284` (en-US) | Hardcoded separators are wrong for half the world |
| A value that changes live (`99` → `100`) | Width jump and jitter without `tabular-nums` |

### Collections

| Value | Breaks |
|---|---|
| 0 items / 1 item | The empty state (and whether one exists); grids that look broken with one card |
| Exactly page size, and page size + 1 | `Showing 40 of 40`, an empty page 2 |
| 1,000+ items unpaginated | Scroll performance, memory, `Showing 40 of 1,284` copy |
| One item 10× larger than the others | Rows and masonry stretching to the tallest item |
| Items with identical names | Lists where the name is the only distinguishing field |

### Time

| Value | Breaks |
|---|---|
| Now | `0 seconds ago` instead of "just now" |
| 12 days, 11 months, 3 years ago | Relative time past about a week should become an absolute date |
| A future date | `-3 days ago` |
| `1970-01-01` | A zero timestamp shown as a real date |
| `2025-12-31T23:30:00-08:00` | A different day in UTC and in the user's timezone |

Use `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`, not hand-built strings.

### Images and media

| Value | Breaks |
|---|---|
| Avatar URL that 404s / no avatar | Broken-image icon; the initials fallback's size and color parity |
| 4000×200 or 200×4000 image | Distortion without `object-fit: cover`; blown-out card height |
| Dark or transparent logo in dark mode | Invisible on the background |
| Slow image without dimensions | Layout shift without fixed size or `aspect-ratio` |

### States mixed into one list

Partial data (some optional fields filled, others not), every enum status at once, a row without
permission, the current user in the list (`You`, actions that should not apply to yourself), and an API
error rendered raw (`TypeError: Cannot read properties of undefined`).

## Step 3 — inject at the boundary

Pick the first that exists, in this order:

1. The project's own mock layer: fixtures, MSW handlers, Storybook stories, a seed script.
2. A network route in the browser test (`page.route()` in Playwright) returning the worst-case payload.
   This changes no application code and is the default for `/dw-qa`.
3. A dev-only switch (`?data=worst` read where the fixture is chosen), only when the owning command is
   allowed to edit code (`/dw-redesign-ui` implement step, `/dw-run`).

Also cover the cases one dataset cannot hold: **empty** (0 items), **one** (single item, every count at
exactly 1) and **huge** (the realistic upper bound, 1,000+ rows when unpaginated).

## Step 4 — break it

View the worst case and check each failure signature:

- at the component's **real container width** (a sidebar list is not a full-page list), then at **320px**
  and at the **widest** layout it supports;
- at **200% browser zoom** (or a raised root font size), because text grows and fixed boxes do not;
- in **dark mode** and **RTL** (`dir="rtl"` on a wrapper) when the product supports either;
- on **touch**: hover-only actions (the `•••` that appears on hover) are unreachable.

Screenshot each state when browser tooling exists. Without it, reason from the CSS and say which findings
were seen and which were inferred.

### Failure signatures

| What you see | Cause | Fix |
|---|---|---|
| Avatar or icon squished into an oval | Flex child shrinking | `flex-shrink: 0` on fixed-size boxes |
| Text overflows its box | Flex/grid child keeps `min-width: auto` | `min-width: 0` on the text column (`minmax(0, 1fr)` in grid) |
| Email or URL runs past the edge | No break opportunities | `overflow-wrap: anywhere` on that element |
| Trailing action pushed off-screen | Middle content took all the space | `min-width: 0` on the middle, `flex-shrink: 0` on the action |
| Badge wraps onto two lines | Badge allowed to shrink | `white-space: nowrap; flex-shrink: 0`, and decide what yields instead |
| Avatar adrift next to a three-line name | `align-items: center` on rows of varying height | `align-items: flex-start` once text can wrap |
| Heading breaks mid-word | `word-break: break-all` | `overflow-wrap: anywhere` breaks only when it must |
| Wrong initials (`J` for Jo, `CI`, `�`) | `.split(' ')[0][0]`, `.charAt(0)` | Grapheme clusters via `Intl.Segmenter`, first + last word, fallback icon |
| Orphaned `—` or empty line | Placeholder rendered for a missing optional field | Omit the line, or reserve its height on purpose |
| `1 members`, `0 member` | Hardcoded plural | `Intl.PluralRules` or per-count strings |
| Numbers jitter, columns misalign | Proportional figures | `font-variant-numeric: tabular-nums` |
| `1284`, `1,284.000000001`, `NaN` | Raw number rendered | `Intl.NumberFormat` with the user's locale; guard null |
| Translated button label overflows | Fixed-width button | `min-width` and content width, never a fixed `width` |
| Diacritics or tall scripts clipped | Tight `line-height` + `overflow: hidden` | Looser `line-height`, no clipping on text boxes |
| Broken-image icon in the avatar | No error fallback | Fall back to initials; `object-fit: cover` |
| Truncated text with no way to read it | `text-overflow: ellipsis` and nothing else | `title` or tooltip, plus the full value elsewhere |
| Last row cut mid-glyph | Fixed height without scroll affordance | Visible scrollbar or fade mask; confirm `overflow` is intended |
| 1,000 rows stutter | Every row rendered | Virtualize or paginate, and say which |
| Raw `<b>`, `&amp;`, `**text**` on screen | Wrong escaping layer | Escape once, at render; never `dangerouslySetInnerHTML` user data |

### Truncate, wrap or clamp — decide per field

- **Wrap** text the user needs whole to identify something (names, titles in a detail view). Two lines is
  usually fine; four means the column is too narrow.
- **Truncate at the end** secondary metadata whose start carries the meaning (role, description, message
  preview), always with a way to see the full value.
- **Truncate in the middle** when items differ at the *end*: file names, emails sharing a domain, paths,
  hashes. End-truncation makes them identical.
- **Clamp** (`line-clamp: 2`) multi-line previews in cards, so card heights stay predictable.
- **Never truncate** numbers, amounts, dates, or anything the user compares.

## Severity mapping

| Content-stress class | dev-workflow severity | Meaning |
|---|---|---|
| Broken | high | Content unreadable, action unreachable, or wrong data shown |
| Ugly | medium | Readable but visibly wrong: squished avatar, wrapped badge |
| Fragile | low | Fine now, one realistic step from breaking: no limit, no fallback |

Raise to critical only when the break hides or misstates money, permissions, or destructive actions.

## Static signals for code review

`/dw-review` cannot render, but these patterns in a UI diff are candidates (each still goes through
`dw-review-rigor`):

- Initials built with `.split(' ')`, `[0]`, `.charAt(0)` or `.slice(0, 1)` on a name.
- A count interpolated next to a fixed plural noun (`` `${n} members` ``).
- `text-overflow: ellipsis` / `truncate` with no `title`, tooltip or detail path.
- A fixed `width` on a button or badge whose label comes from data or translation.
- A flex row with an avatar or trailing action and no `flex-shrink: 0`, or a text column with no
  `min-width: 0`.
- Numbers rendered without `Intl.NumberFormat` / dates without `Intl.DateTimeFormat`.
- `dangerouslySetInnerHTML` (or `v-html`, `innerHTML`) fed by user or API data — also a security finding.
- A new string field rendered in UI with no limit in the schema (`Fragile`).

## Output

One row per break, worst first:

| # | Severity | Field | Worst-case value | What happens | Fix (`file:line`) |
|---|---|---|---|---|---|

Then **Decisions for you** (breaks with more than one right answer, one line each with a recommendation)
and **What held up** (worst cases the component already handles — proof the test was real, and a list of
what not to touch).

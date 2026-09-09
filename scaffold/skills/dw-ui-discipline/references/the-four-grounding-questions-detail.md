## The four grounding questions

Answer all four before proposing colors, layouts, components, or any visual decision.

### 1. Where do design decisions come from?

Find the project's design source-of-truth in this order:
1. `.dw/rules/<frontend-module>.md` design system section.
2. `DESIGN.md`, `BRAND.md`, `STYLE_GUIDE.md` at project root.
3. Design token config — Tailwind theme, CSS variables in `theme.css`/`globals.css`, MUI/Chakra theme.
4. Component library config — `components.json` for shadcn, theme exports.
5. Storybook stories (implicit canonical components).

**Stop at the first match** in this list — that source is the authority; defer to it and do not override it with a lower rung or a training-data default. If a needed token is missing (e.g., a danger-secondary color), propose adding it to the authority FIRST, not inline.

If **none exists**: read `curated-defaults.md` and pick one of the 10 neutral palettes + one of the 10 font pairings shipped there. Mark the choice in the techspec/PR description: "Design source: no project authority found; using curated default `<name>`; recommend establishing `DESIGN.md`."

**Anti-patterns at this question:**
- Inventing color hex values inline (`bg-[#FF6B35]`).
- "I'll use Tailwind defaults" — that's training-data defaults, not project authority.
- Copying values from "a site I like" without understanding what it solved.

### 2. What does this surface help the user do?

Write one sentence: **"This surface helps the user `<verb-phrase>` so that `<outcome>`."**

Good examples:
- "...helps the user filter overdue invoices so they can chase late payers in under 30 seconds."
- "...helps the on-call engineer diagnose which deploy caused the spike so they can roll back without paging the team."
- "...helps the manager approve or reject expense reports without leaving Slack."

Bad examples:
- "This surface displays invoice data." (no user, no outcome)
- "Settings page for managing the account." (vague, no specificity)
- "Dashboard." (one word)

If you can't write the sentence, the requirements are unclear. Stop and clarify before proceeding.

### 3. What states does the surface have?

Enumerate all states before designing the happy path. Minimum nine, plus domain-specific ones — see `state-matrix.md`:

`default`, `hover`, `active`, `focus-visible`, `disabled`, `loading`, `empty`, `error`, `success` plus any domain states (read/unread, online/offline, stale/fresh, pending/approved/rejected, draft/saved/dirty, partial/complete, etc.).

Missing a state at design time = production bug later. The "we'll add empty state later" trap is real.

### 4. Who uses this surface, where, and in what mood?

One sentence: **"`<Who>` uses this on `<where>` in `<what light>` while `<what mood>`."**

Good examples:
- "An on-call engineer uses this on a dark-room laptop at 3am while troubleshooting a fire."
- "A field nurse uses this on a phone in bright outdoor light while juggling clipboards."
- "A receptionist uses this on a 24″ monitor at a busy front desk while talking to a visitor."

Decisions cascade from the answer:
- 3am dark room → dark mode, high contrast, no flashing animations.
- Bright outdoor → minimum 7:1 contrast, larger touch targets, no thin fonts.
- Busy front desk → glanceable info, no nested menus, large numbers.

Without this sentence, defaults take over: light mode, default contrasts, animations, regular touch targets. Production users hate it; you can't articulate why.

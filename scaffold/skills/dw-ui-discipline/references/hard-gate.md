# The hard-gate protocol — full version

Four checkpoints before any UI work touches code. Each has a concrete output. Don't proceed without finishing the current one.

## Why a gate at all

Training-data defaults are the enemy. An LLM proposing UI without grounding will:
- Reach for `#3B82F6` blue and `rounded-lg` because they appeared 10M times in training data.
- Default to glass morphism, gradient backgrounds, and center-aligned everything because those screenshots dominate the web.
- Skip empty/error states because happy-path screenshots are the most common training signal.

The gate forces grounding in this project's reality before training-data autopilot fires.

## Checkpoint 1: Brand authorities OR curated defaults

**Goal:** know where visual decisions come from. Documented authority, or curated default — never invented.

**How:**

1. Search the project for design source-of-truth:
   - `.dw/rules/*.md` — look for "Design", "Patterns to Follow", "Naming Conventions" sections.
   - `DESIGN.md`, `BRAND.md`, `BRANDING.md`, `STYLE_GUIDE.md` at root.
   - Tailwind `tailwind.config.{ts,js}` — theme tokens.
   - CSS variables in `globals.css`, `theme.css`, `tokens.css`.
   - Component library config (shadcn `components.json`, MUI theme, Chakra theme).
   - Storybook stories — implicit canonical components.

2. If **at least one** authority exists: it wins. Decisions defer to it. If a needed token doesn't exist (e.g., a danger-secondary color), propose adding it to the authority FIRST, not inline.

3. If **none exists**: pick a curated default. Read `curated-defaults.md` in this references folder. Pick one of the 10 palettes + one of the 10 font pairings. Mark the choice in the techspec/PR description:

   > **Design source:** No project authority found. Using curated default "Cool Stone" (neutral grays + electric blue accent) + "Inter / Source Serif" pairing. Recommend establishing `DESIGN.md` to formalize.

**Anti-patterns at this checkpoint:**

- Inventing color hex values inline (`bg-[#FF6B35]`).
- "I'll use Tailwind defaults" — Tailwind defaults are training-data defaults, not project authority.
- Copying values from "a site I like" without understanding what it solved.

**Output:** A one-sentence note in the techspec/PR describing the authority consulted.

## Checkpoint 2: Surface job sentence

**Goal:** the user's intent at this surface, stated in one specific sentence.

**Format:** "This surface helps the user **<verb-phrase>** so that **<outcome>**."

**Examples — good:**

- "This surface helps the user filter overdue invoices so they can chase late payers in under 30 seconds."
- "This surface helps the on-call engineer diagnose which deploy caused the spike so they can roll back without paging the team."
- "This surface helps the manager approve or reject expense reports without leaving Slack."

**Examples — bad:**

- "This surface displays invoice data." (no user, no outcome)
- "Settings page for managing the account." (vague, no specificity)
- "Dashboard." (one word)

**How to push back when the brief is vague:**

If the requester can't articulate the job, the requirements aren't ready. Reply with: "Before I design this surface, I need the job sentence: <example>. Can you fill in the verb-phrase and outcome?"

Designing without this sentence produces generic surfaces — the "just another dashboard" outcome.

**Output:** The one-sentence job, committed to the techspec/PR description.

## Checkpoint 3: Complete state matrix

**Goal:** enumerate every state the surface can be in, BEFORE designing for the happy path.

**Minimum states (always enumerate):**

| State | Trigger | What user sees |
|-------|---------|---------------|
| `default` | First load, no interaction | Initial render |
| `hover` | Cursor over interactive element | Visual feedback |
| `active` | Click in progress | Pressed/depressed visual |
| `focus-visible` | Keyboard tab arrived | Distinct outline, not the same as hover |
| `disabled` | Interaction unavailable | Reduced opacity + cursor change, NO action |
| `loading` | Async operation in flight | Skeleton, spinner, or progress — context-appropriate |
| `empty` | No data to show | Guidance on what to do next |
| `error` | Operation failed | What broke + how to recover |
| `success` | Operation succeeded | Confirmation that doesn't require ack |

**Add domain-specific states as needed:**

- Read/unread (notifications, messages)
- Online/offline (chat, collaborative tools)
- Stale/fresh (dashboards with cached data)
- Pending/approved/rejected (workflow states)
- New/saved/dirty (forms)

**Tripwire:** if the design has only `default`, you missed 8 states. If it has `default` + `loading`, you missed 6. The full matrix is non-negotiable.

**Output:** A state matrix table in the techspec or design doc.

## Checkpoint 4: Scene sentence

**Goal:** the physical context the surface lives in.

**Format:** "**<Who>** uses this **<where>** in **<what light>** while **<what mood>**."

**Examples — good:**

- "An on-call engineer uses this on a dark-room laptop at 3am while troubleshooting a fire."
- "A field nurse uses this on a phone in bright outdoor light while juggling clipboards."
- "A receptionist uses this on a 24" monitor at a busy front desk while talking to a visitor."

**Why this matters:**

Decisions cascade from the scene:
- 3am dark room → dark mode, high contrast, no flashing animations.
- Bright outdoor → minimum 7:1 contrast, larger touch targets, no thin fonts.
- Busy front desk → glanceable info, no nested menus, big numbers.

Without the scene, defaults take over: light mode, default contrasts, animations, regular touch targets. Production users hate it; you can't articulate why.

**Output:** Scene sentence in the techspec.

## What "passing the gate" looks like

A PR description / techspec UI section that includes:

```markdown
## UI Discipline Gate

**Authority:** `.dw/rules/frontend.md` design tokens (Tailwind theme + custom CSS vars).
**Surface job:** Helps on-call engineers diagnose which deploy caused the latency spike so they can roll back without paging the team.
**State matrix:**
  - default, hover, active, focus-visible, disabled, loading, empty (no spikes detected), error (metrics API down), success (rollback completed)
  - Plus: stale (>5min old data) — show timestamp + refresh CTA.
**Scene:** On-call engineer uses this on a dark-room laptop at 3am while troubleshooting a production fire.
```

This is the minimum disclosure. Anything less and the gate didn't pass.

## When this gate has been run

The downstream skills (`anti-slop.md`, `state-matrix.md`, `accessibility-floor.md`) assume gate passed. They won't re-verify; if you skipped, you get bad output.

`/dw-code-review` failing verdict on a UI PR where this disclosure is missing.

# Anti-slop catalog — 14 patterns + 17 anti-defaults

Every pattern below is a category of slop that LLMs produce when ungrounded. Detection happens in `/dw-code-review` (UI diffs) and design proposals from `/dw-redesign-ui`.

## The 14 patterns

### 1. Visual sameness

**What it looks like:** Every section of the page uses the same card style, same padding, same text size, same emphasis weight. The eye finds no anchor.

**Why it happens:** LLM defaults to "consistent = good," missing that hierarchy needs deliberate variation.

**Fix:** Establish one primary section per scroll-height. Use size, weight, color saturation, or whitespace differential to anchor the eye. Everything else recedes.

**Example violation:** Dashboard with 6 identical-looking metric cards. **Fix:** One hero metric (largest, brightest, top), 3 supporting metrics, 2 minor metrics in a different visual treatment.

### 2. Weak hierarchy

**What it looks like:** Headings barely larger than body. Important CTAs same color as secondary. The user can't tell what to look at first.

**Why it happens:** Defaults to "elegant restraint" without ensuring guidance still works.

**Fix:** Verify hierarchy by squinting at the design (literally) — what jumps out? If nothing jumps out, hierarchy is failing. Increase contrast in size, weight, or color for the primary element by at least 30%.

### 3. Fake interactivity

**What it looks like:** Hover states that change opacity but the click does nothing meaningful. Buttons that look interactive but don't have a job. Cards with subtle hover but no on-click handler.

**Why it happens:** LLM applies hover styles to anything that looks card-shaped.

**Fix:** Hover state ONLY on elements that have an on-click. If it can't be clicked, don't suggest it can. Use cursor: default explicitly on non-interactive shapes.

### 4. Emoji spam

**What it looks like:** 🎯 Goals · 🚀 Launch · ✨ Features · 📊 Analytics · 🔥 Trending — emojis as decoration in headers, CTAs, and section labels where they add no information.

**Why it happens:** LLM training data has tons of "emoji in headers = engaging" patterns.

**Fix:** Use icons (lucide, heroicons, tabler) for semantic meaning; reserve emojis for genuinely emotive contexts (celebrations, errors that need empathy). If you can remove the emoji and the meaning survives, remove it.

### 5. Gradient crutch

**What it looks like:** Hero with diagonal purple-to-pink gradient. Buttons with subtle gradient. Card backgrounds with mesh gradients. Every empty space gets a gradient.

**Why it happens:** Stable Diffusion / midjourney aesthetics leaked into UI; gradients hide weak composition.

**Fix:** A gradient must earn its place — usually for hero zones with poetic copy, never for utility surfaces. Solid colors + good hierarchy beat gradients 9 times out of 10.

### 6. Glass everything

**What it looks like:** Frosted-glass effect on modals, cards, dropdowns, side panels — anywhere a surface can be layered.

**Why it happens:** Apple's macOS aesthetic. Looks "premium" without effort.

**Fix:** Glass only when there's meaningful content visible behind the surface (a hero image, a busy dashboard). Glass on top of plain backgrounds adds blur for no reason.

### 7. Centered all the things

**What it looks like:** Body paragraphs center-aligned. Headlines centered. Forms with labels centered above inputs. Every text block reads center.

**Why it happens:** Marketing-page training data biases toward center-aligned.

**Fix:** Center-align for hero headlines and small CTA labels only. Body text and forms read better left-aligned (in LTR scripts). Tabular data reads in columns, not centered.

### 8. AI gray washing

**What it looks like:** Neutral gray palette everywhere. `slate-50`, `gray-100`, `zinc-200` for backgrounds, borders, text, accents. Nothing has color personality.

**Why it happens:** "Neutral = safe" default, plus shadcn/ui's neutral start.

**Fix:** Establish ONE accent color from the curated defaults or brand. Use it intentionally — primary CTAs, active states, the one place the user looks first. Gray is the canvas, not the painting.

### 9. Generic CTAs

**What it looks like:** "Get Started" · "Learn More" · "Click Here" · "Submit" · "OK" buttons.

**Why it happens:** Default LLM verb library.

**Fix:** Use the verb the user is actually doing. "Approve refund" not "Submit". "Start free trial" not "Get Started". "Schedule a call" not "Contact us". Generic verbs are tells.

### 10. Stock illustration

**What it looks like:** Figure-with-laptop hero art. Diverse-team-around-table illustration. Abstract floating shapes.

**Why it happens:** "Illustration = friendly" default. Cheap to produce, generic to consume.

**Fix:** Either use product screenshots (real screens, real data — sanitized) or skip illustration entirely. A clean hero with strong typography beats a generic illustration every time.

### 11. Drop shadow soup

**What it looks like:** Cards with shadow. Buttons with shadow. Inputs with shadow. Tooltips with shadow on shadows. Borders AND shadows AND gradients on one element.

**Why it happens:** Material Design leftover; depth as decoration.

**Fix:** Pick ONE depth mechanism per layer. If cards have shadow, buttons inside should not. If you're using elevation systematically (Material 3), enforce the elevation hierarchy.

### 12. Loading spinner default

**What it looks like:** Spinner overlay for every async operation, regardless of duration or context.

**Why it happens:** Default fallback in every UI library.

**Fix:**
- <300ms: don't show anything. Spinner appearing then disappearing instantly is flicker.
- 300ms-2s: skeleton loader (shape of incoming content).
- 2s-10s: spinner + status text ("Loading orders...").
- 10s+: progress bar or step indicator + cancel button.

### 13. Empty state void

**What it looks like:** "No items found." Centered. Nothing else. User has no idea what to do.

**Why it happens:** Empty state treated as edge case, not a real screen.

**Fix:** Every empty state must answer: WHY is it empty (no data yet vs filter excluded everything vs error). WHAT should the user do next (CTA: "Create your first invoice"). Show example/illustration if it helps onboard.

### 14. Notification-soup tray

**What it looks like:** Every UI event becomes a toast. Save successful → toast. Validation error → toast. Network slow → toast. Now there are 5 stacked toasts and the user can't read any.

**Why it happens:** Toast is the default feedback mechanism in component libraries.

**Fix:** Reserve toasts for actions that need confirmation AWAY from the originating surface (background save completed, deletion can be undone). Inline feedback for form validation. Modal/banner for blocking errors. NEVER stack >2 toasts at once.

## The 17 anti-defaults

Specific values that signal "no thought was put in." Avoid unless you can articulate WHY you picked exactly this:

| Anti-default | Why it's a tell |
|--------------|-----------------|
| `#3B82F6` (Tailwind blue-500) | The internet's default blue |
| `rounded-lg` everywhere | Universal default; no surface character |
| `shadow-md` on every card | Universal default; no depth hierarchy |
| `bg-gradient-to-br from-purple-500 to-pink-500` | The "AI startup landing page" gradient |
| Inter font as the only choice | Default font of 60% of new SaaS |
| `font-bold` for everything emphasized | Bold is a tool, not the only tool |
| Lucide icons exclusively | One icon family is fine; signature is none |
| Stock "happy team" hero illustration | Generic placeholder energy |
| "Get Started" / "Learn More" CTA copy | Verb-less; says nothing |
| 4px / 8px / 12px / 16px spacing exclusively | The default 4-step scale; no rhythm |
| `border-gray-200` for every divider | Visual whisper; no intentionality |
| Sans-serif headlines + sans-serif body | No typographic contrast |
| Center-aligned everything | See pattern #7 |
| Animated CSS confetti on success | Cheesy; never matches the brand |
| `bg-white dark:bg-gray-900` only | No real dark-mode design pass |
| Single-column form on a wide screen | Vertical scroll where horizontal fits |
| Modal-for-everything | Most modals should be inline editing |

## How to use this catalog

In `/dw-redesign-ui` step 4 (propose) — before presenting design directions, self-check against this list. Flag any pattern you're consciously using AND say why (sometimes it's the right call; "gradient crutch" can be intentional for a marketing hero).

In `/dw-code-review` UI section — grep the diff for the anti-defaults table values and the patterns. Each hit becomes a finding with `dw-review-rigor` severity:
- Pattern violations on a NEW surface → `medium` severity.
- Pattern violations spreading EXISTING surface's slop further → `low` severity (consistency wins).
- Pattern violations on a redesign that was supposed to fix slop → `high` severity (regression).

## When the rules bend

- **Marketing pages** can use gradients and emojis with more freedom — different surface job.
- **Brand-mandated** anti-defaults override this list (if the brand IS `#3B82F6`, use it).
- **Component libraries** like shadcn ship with neutral defaults — the discipline is to ADD character on top, not remove their neutrality.

# Motion — whether to animate, easing, duration, physicality, performance

> First version adapted from [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, derived from
> Anthropic's frontend-design skill). Rewritten 2026-11 from the `emil-design-eng`, `review-animations`,
> `animation-performance` and `remove-animations` skills in
> [`emilkowalski/skills`](https://github.com/emilkowalski/skills) (MIT © 2026 Emil Kowalski): the
> frequency gate, easing table, curves, physicality rules, escalation triggers and removal gate come from
> there. Read when adding, reviewing or removing animation or transitions.

Project motion tokens (`DESIGN.md`, CSS variables, Tailwind config) win over the values below. These are
the defaults when the project has none, and the bar when reviewing motion it already has.

## 1. Should it animate at all?

Decide this before choosing any curve. Frequency first:

| How often the user sees it | Decision |
|---|---|
| 100+ times a day (keyboard shortcuts, command palette, tab switches, in-app route changes, list rows) | No animation. Any duration reads as delay. |
| Tens of times a day (hover, frequent toggles, list expansion) | Remove, or reduce to near-imperceptible |
| Occasional (modals, drawers, toasts) | Standard motion |
| Rare or first-time (onboarding, success, empty state) | Room for delight |

**Keyboard-initiated actions never animate.** They repeat hundreds of times a day.

Then purpose. Valid purposes: spatial consistency (where did this come from / go), state indication,
explanation, feedback, preventing a jarring change. "It looks nice" on a frequently seen element is not a
purpose. Functional data (charts, tables, numbers) does not re-animate on every mount or refresh; it
animates only to show a real change in value.

Deleting everything is also wrong: a toast that would otherwise teleport in, or a panel that needs to show
where it came from, earns its motion.

## 2. Easing

| Motion | Easing |
|---|---|
| Entering or exiting | `ease-out` (starts fast, feels responsive) |
| Moving or morphing on screen | `ease-in-out` |
| Hover, color change | `ease` |
| Constant motion (marquee, progress, spinner) | `linear` |
| Default | `ease-out` |

**Never `ease-in` on UI**, exits included. It starts slow and delays the exact moment the user is watching;
`ease-out` at 200ms feels faster than `ease-in` at 200ms.

The built-in keywords are weak. Default curves when the project has none:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* UI enter/exit */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* iOS-like drawer/sheet */
```

### Bounce and springs

No bounce, elastic or overshooting `cubic-bezier` (e.g. `cubic-bezier(0.68, -0.55, 0.27, 1.55)`) on UI
transitions — the `ui-slop-detect` gate flags these as `bounce-easing`.

**Springs are allowed only for gesture-driven motion:** drag with momentum, drag-to-dismiss sheets,
swipe, and anything the user may reverse mid-motion. Springs keep velocity when interrupted, which is what
a gesture needs. Keep bounce subtle:

```js
{ type: "spring", duration: 0.5, bounce: 0.2 } // bounce 0.1–0.3
```

A spring on a button, dropdown, modal or toast is out of scope for this exception.

## 3. Duration

| Element | Duration |
|---|---|
| Button press feedback | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing / explanatory | Can be longer |

**UI animations stay under 300ms** unless a reason is written down. Under ~80ms is imperceptible: snap
instead. After the first tooltip in a group opens, the next ones open instantly (no delay, no animation).

## 4. Physicality

- **Never `scale(0)`.** Nothing appears from nothing. Start from `scale(0.95)` (0.9–0.97) with `opacity: 0`.
- **Popovers, dropdowns and tooltips scale from their trigger**, not the center:
  `transform-origin: var(--transform-origin)` (Base UI / Radix expose it). **Modals are exempt** — they
  appear centered and keep `transform-origin: center`.
- **Press feedback:** `transform: scale(0.97)` on `:active` (0.95–0.98), 100–160ms `ease-out`, on every
  pressable element. It works on touch, unlike hover.
- **`translateY(100%)`** moves an element by its own height, so drawers and toasts of unknown size need no
  hardcoded pixels.

## 5. Interruptibility and timing

- **Transitions over keyframes** for anything triggered rapidly (toasts being added, toggles). A transition
  retargets from its current state; a keyframe animation restarts from zero.
- Entry without JS: `@starting-style` on the transitioned element.
- **Asymmetric timing:** slow where the user is deciding (a hold-to-confirm, a destructive press), fast
  where the system responds (the release, the result).
- **Stagger** group entrances 30–80ms per item, capped so the whole group finishes within ~300ms.
  Stagger entrances, not exits, and never block interaction while it plays.
- An imperfect crossfade can be bridged with `filter: blur(2px)` during the transition; keep any animated
  blur under 20px.

## 6. Performance

Every frame has **16.7ms at 60fps and 8ms at 120Hz** (most phones). Design against 8ms. A fast laptop hides
almost every problem below; say which findings were verified from code and which need a recording on a
mid-range device.

| Tier | Properties | Cost |
|---|---|---|
| Composite only | `transform`, `opacity` (and in current browsers `filter`, `clip-path`) | Cheapest |
| Paint + composite | `box-shadow`, `border-radius`, `color` | Redraw every frame |
| Layout + paint + composite | `width`, `height`, `padding`, `margin`, `top`, `left`, `border-width` | Most expensive |

- Animate `transform` and `opacity` by default. Swaps: `width`/`height` → `scale()`; `top`/`left`/`margin` →
  `translate()`; animated `box-shadow` → `filter: drop-shadow()`.
- **Never `transition: all`.** List the exact properties; `all` animates whatever changes next, including
  layout properties nobody meant to animate. (Tailwind: `transition-transform`, `transition-opacity`, not
  `transition-all`.)
- Do not drive child transforms through a CSS variable set on a parent; it recalculates style for every
  child. Set `transform` on the element itself.
- In React, a hand-rolled animation writes to `ref.current.style`, never `setState` every frame.
- Predetermined motion runs in CSS or WAAPI (off the main thread); JS/rAF for dynamic, gesture-driven
  motion. Motion's `x`/`y`/`scale` shorthands are hardware-accelerated from `motion` 14.2; on older versions
  animate the full `transform` string. Layout animations (`layout`, `layoutId`) always run on the main
  thread.
- `will-change` is the last step, added only after a measured problem (a 1px shift at start/end, dropped
  frames on a recording). Never on `*` or large containers.
- Name the cause before changing code. "Added `will-change`, seems smoother" is not a diagnosis.

## 7. Accessibility

- **`prefers-reduced-motion` means fewer and gentler, not zero.** Drop movement (translate, scale,
  parallax, slide); keep the opacity and color changes that explain a state change.

  ```css
  @media (prefers-reduced-motion: reduce) {
    .drawer { transition: opacity 200ms ease; transform: none; }
  }
  ```

  ```jsx
  const reduce = useReducedMotion();
  const closedX = reduce ? 0 : "-100%";
  ```

  A global `animation-duration: 0.01ms !important` reset is an acceptable project-wide fallback, not the
  design: state changes still have to be visible.
- **Gate hover motion** behind `@media (hover: hover) and (pointer: fine)`. Touch fires a fake hover on tap
  and leaves it stuck (see `responsive.md`).

## 8. Removing motion

When the job is to cut motion (an over-animated product, a performance pass), walk each animation through
this gate and record the deciding branch:

1. Keyboard-triggered? → **delete**.
2. Seen 100+ times a day? → **delete**.
3. On functional data? → **delete**, unless it shows a real change in value.
4. No nameable purpose? → **keep** if it is a rare first-time moment, otherwise **delete**.
5. Purpose, seen tens of times a day? → **reduce**.
6. Purpose, rarer: over 300ms, or a slide/scale where a fade carries the same meaning? → **reduce**,
   otherwise **keep**.

Marketing pages get more latitude (one hero entrance, explanation), but scroll-reveal on every section
still fails.

| Today | Reduced to |
|---|---|
| Hover with scale, lift or shadow growth | Color/opacity only, ≤150ms, `ease` |
| Slide or scale entrance on a frequent surface | Opacity only, 150ms, `ease-out` |
| UI animation over 300ms | 200–250ms, same curve |
| Stagger over 80ms per item or 300ms total | 30ms per item, or fade the group as one |
| Infinite loop (pulse, shimmer, glow) on a persistent element | Run once, or keep the static end state |

Spinners and skeletons on work that resolves under 300ms are deleted too (see `state-matrix.md`).

**Removal hazards** — check before deleting, or the removal becomes a regression:

- **Hidden start states.** `initial={{ opacity: 0 }}`, a keyframe from `opacity: 0` with
  `fill-mode: forwards`, a reveal class waiting for an observer. Remove the start state with the animation
  or the element stays invisible.
- **Code waiting on the animation:** `onAnimationEnd`, `transitionend`, `onExitComplete`, `setTimeout`
  sized to a duration.
- **Exit animations delaying unmount** (`AnimatePresence`): move what ran on exit-complete to the close.
- **Layout animations masking a jump** (`layout`, FLIP): if the jump appears, keep the animation and report
  the layout shift.
- **Focus moved in an animation callback** must move immediately.
- **Tests and selectors** that wait for animation classes or durations.

Then delete what the removal orphaned (unused `@keyframes`, `motion.div` with no motion props left, empty
`AnimatePresence`, unused variants and imports). Propose — never perform — removing a motion library
dependency.

## 9. Review escalation triggers

`/dw-review` treats each of these in a UI diff as a candidate finding (still subject to `dw-review-rigor`
refutation). Default severity **medium**; **high** when the motion runs on a keyboard-triggered or
100+/day action, or when it blocks interaction.

- `transition: all` / Tailwind `transition-all`.
- `scale(0)` as a start state.
- `ease-in` on any UI enter, exit or interaction.
- Animation on a keyboard shortcut, command-palette toggle or other 100+/day action.
- UI duration over 300ms with no stated reason.
- `transform-origin: center` on a trigger-anchored popover, dropdown or tooltip.
- Keyframes on toasts, toggles or anything triggered rapidly.
- Animating `width`, `height`, `margin`, `padding`, `top` or `left` when a transform does the same.
- A CSS variable on a parent driving child transforms.
- Movement with no `prefers-reduced-motion` handling.
- `:hover` motion not gated by `(hover: hover) and (pointer: fine)`.
- Bounce/overshoot easing, or a spring outside gesture-driven motion.
- Symmetric timing on a press-and-hold or destructive-confirm interaction.

Fix preference, earliest first: delete → reduce → fix easing → fix origin → make interruptible → move to
composite-only properties → asymmetric timing → polish → accessibility and cohesion.

When feel cannot be judged from code (hover feel, perceived speed, gesture physics), say so and ask for a
slow-motion pass (DevTools animation panel at 2–5× duration) or a real device, instead of guessing.

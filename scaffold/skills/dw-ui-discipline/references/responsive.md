# Responsive — mobile-first, container queries, fluid space

> Patterns adapted from [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, derived from
> Anthropic's frontend-design skill). The "Mobile platform fixes" section is adapted from the
> `mobile-native` skill in [`emilkowalski/skills`](https://github.com/emilkowalski/skills)
> (MIT © 2026 Emil Kowalski). Read when a surface must work across devices.

## Mobile-first

Author the small-screen layout first, then add complexity at larger widths with `min-width` queries.
Mobile-first CSS is additive (you enhance up), which produces simpler, smaller rules than desktop-first
(`max-width`) overrides. `/dw-redesign-ui` requires every proposal to describe mobile AND desktop.

## Breakpoints

Base decisions on content, not device names. Reasonable defaults:
`640` (sm) · `768` (md) · `1024` (lg) · `1280` (xl). Add a breakpoint when the layout *breaks*, not at a
fixed phone width.

## Container queries > viewport queries for components

A card that appears in a sidebar and in a main column should respond to *its container*, not the viewport.
Reusable components are far more robust with container queries:

```css
.card-wrap { container-type: inline-size; }
@container (min-width: 28rem) {
  .card { grid-template-columns: auto 1fr; }
}
```

## Fluid space and type

Use `clamp()` to interpolate spacing/type between breakpoints instead of hard jumps:

```css
--gap: clamp(1rem, 0.5rem + 2vw, 2.5rem);
h1 { font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3rem); }
```

Keep body text fixed (≥16px); fluid body harms readability.

## Touch & input

- Touch targets ≥ 24×24 CSS px (≥ 44×44 recommended on mobile). Spacing between targets matters as much
  as size.
- Don't hide primary actions behind hover — hover doesn't exist on touch. Provide a tap-visible path.
- Respect safe-area insets on mobile (`env(safe-area-inset-*)`) for notches/home indicators — this needs
  `viewport-fit=cover` in the viewport meta, or every inset is `0px` (see below).

## Layout reflow

State explicitly how elements reorganize between breakpoints: stack vs. side-by-side, what collapses into
a menu, what hides (and whether hidden content is still reachable). "Hidden on mobile with no alternative"
is a bug, not a layout decision.

## Mobile platform fixes

Most "the app feels janky on mobile" reports are not animation problems: they are a tap delay, a gray
flash on tap, or a hover state that will not let go. **None of these reproduce in desktop device
emulation.** Gate by capability with media queries, never by user-agent sniffing or screen width — touch
and mouse coexist (iPads with trackpads, touchscreen laptops). Apply each fix where its reason applies, not
globally out of habit.

| Symptom | Cause | Fix |
|---|---|---|
| Hover state stuck after tap | Touch fakes `:hover` on the first tap and keeps it | Put `:hover` rules inside `@media (hover: hover) and (pointer: fine)` (Tailwind v4 `hover:` already does; v3 needs `future.hoverOnlyWhenSupported`) and give touch an `:active` state |
| Gray/blue flash on tap | Browser tap highlight | `html { -webkit-tap-highlight-color: transparent; }`, then make sure every tappable element has its own `:active` feedback |
| Bottom-pinned UI hidden under the URL bar | `100vh` is the largest viewport | `100dvh` for app shells, drawers and bottom-pinned UI; `100svh` for heroes (stable, no shift on scroll) |
| Page zooms into an input and stays zoomed | iOS zooms on inputs under 16px | `font-size: 16px` on `input, textarea, select` (scope it with `@media (pointer: coarse)` if desktop needs smaller). **Never** `user-scalable=no` or `maximum-scale=1` — that is an accessibility failure (`accessibility-floor.md` §11) |
| Tap feels laggy | Double-tap-zoom wait; feedback on release | `touch-action: manipulation` on buttons, links, `[role="button"]`; press feedback on `:active` (100–160ms `ease-out`, see `motion.md`), `pointerdown` not `click` when JS must react |
| Pull-to-refresh or rubber band hijacks an app | Scroll chaining to the page | `overscroll-behavior: none` on `html, body` in apps (not documents); `contain` on inner scrollers. Never a `touchmove` + `preventDefault()` listener |
| Content cut by the notch / home indicator | Safe area | `viewport-fit=cover` in the viewport meta + `padding-top: env(safe-area-inset-top)` / `padding-bottom: env(safe-area-inset-bottom, 0px)` on fixed headers, tab bars, toasts and sheets |
| Long-press selects a button label | Text selection on controls | `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;` on controls only — never on `body`; users copy addresses and order numbers |
| Carousel drags the page vertically | Ambiguous gesture axis | `touch-action: pan-y` on a horizontal carousel, `none` only on surfaces that own every axis; prefer native `scroll-snap-type: x mandatory` |
| Status bar color wrong in one scheme | Single `theme-color` | One `<meta name="theme-color" media="(prefers-color-scheme: …)">` per scheme, matching the top of the page, plus `color-scheme: light dark` |

Inputs also set the right keyboard: `type="email"` / `type="tel"`, `inputmode="numeric"` for codes and
`"decimal"` for amounts, `autocapitalize="none"` on usernames and codes, `enterkeyhint` naming what Return
does.

Baseline for a mobile-facing app:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
```

`interactive-widget=resizes-content` makes the Android software keyboard shrink the layout viewport, so
`100dvh` and bottom-pinned inputs react to it the way they do on iOS.

**Real hardware is the bar.** Sticky hover, tap delay, URL-bar height, input zoom, overscroll, safe areas
and the software keyboard only show on a device: dev server on `0.0.0.0`, open it by LAN IP, inspect with
Safari Web Inspector or `chrome://inspect`. When no device is available, report which fixes were verified
from code and which still need a phone — never declare them fixed from emulation.

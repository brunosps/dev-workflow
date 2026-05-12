/**
 * Manifest of bundled skills removed in past releases.
 *
 * APPEND-ONLY: never modify or remove entries. A removed skill stays in
 * this manifest forever so old installs still get cleaned up when the
 * user runs `dev-workflow update`.
 *
 * Each entry triggers `.agents/skills/<name>/` removal during update
 * (see lib/migrate-skills.js).
 */
module.exports = [
  // v0.13.0 — replaced TASTE catalog (161 palettes) with discipline (hard-gate + anti-slop + WCAG floor)
  { name: 'ui-ux-pro-max', removedIn: '0.13.0', replacedBy: 'dw-ui-discipline' },
  // v0.13.0 — replaced Playwright recipes wrapper with full testing doctrine (Iron Laws + 25 anti-patterns + 7 AI gates)
  { name: 'webapp-testing', removedIn: '0.13.0', replacedBy: 'dw-testing-discipline' },
];

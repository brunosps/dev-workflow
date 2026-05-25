// Functional-doc flow module. Driven by .dw/scripts/functional-doc/run-playwright-flow.mjs
// through the Playwright Node API, so video is captured with page.screencast (works both
// for a launched browser and over connectOverCDP). No imports are needed here — the runner
// injects page, context, expect, baseURL and the step()/shot() helpers.

export default async function flow({ page, expect, baseURL, step, shot }) {
  await step("Open target route", async () => {
    await page.goto(`${baseURL}{{routePath}}`);
    await expect(page).toHaveURL(new RegExp("{{routeRegex}}"));
  });

{{testSteps}}

  await step("Record final context", async () => {
    await expect(page.locator("body")).toBeVisible();
  });
}

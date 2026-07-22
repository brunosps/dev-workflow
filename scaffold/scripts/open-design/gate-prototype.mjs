#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      result[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

async function importFirefox() {
  try {
    return (await import("@playwright/test")).firefox;
  } catch {
    try {
      return (await import("playwright")).firefox;
    } catch {
      return null;
    }
  }
}

function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .replace(/\.html?$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "prototype"
  );
}

function addResult(results, name, pass, details = "") {
  results.push({ name, pass: Boolean(pass), details });
}

async function structuralChecks(page, html, results) {
  const data = await page.evaluate(() => {
    const visibleText = document.body ? document.body.innerText : "";
    const hasDialogRole = Boolean(document.querySelector('[role="dialog"], [aria-modal="true"], [aria-labelledby]'));
    const title = document.title.trim();
    return { visibleText, hasDialogRole, title };
  });

  addResult(results, "title", data.title.length > 0, data.title || "missing document title");
  addResult(results, "aberto-param", /\baberto\b/.test(html), "source contains aberto");
  addResult(results, "replace-state", /replaceState/.test(html), "source contains replaceState");
  addResult(results, "dialog-aria", data.hasDialogRole, "role=dialog, aria-modal, or aria-labelledby present");
  addResult(results, "skeleton-state", /skeleton|carregando|loading/i.test(html + "\n" + data.visibleText));
  addResult(results, "empty-state", /empty|vazio|sem\s+(resultado|dados|itens|registros)/i.test(html + "\n" + data.visibleText));
  addResult(results, "error-state", /error|erro|falha|failed|retry|tentar novamente/i.test(html + "\n" + data.visibleText));
}

async function visibleDialog(page, selector) {
  const selected = selector ? page.locator(selector).first() : page.locator('[role="dialog"], [aria-modal="true"]').first();
  try {
    return (await selected.count()) > 0 && (await selected.isVisible());
  } catch {
    return false;
  }
}

async function clickFirstOpenable(page, rowSelector) {
  const selector =
    rowSelector ||
    '[data-open], [data-id], tbody tr, [role="row"], [role="button"], article, li button, li, button';
  const candidates = page.locator(selector);
  const count = Math.min(await candidates.count(), 20);
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    try {
      if (!(await candidate.isVisible())) continue;
      await candidate.click({ timeout: 1500 });
      return true;
    } catch {
      // Try the next plausible opener.
    }
  }
  return false;
}

async function behavioralChecks(page, baseUrl, args, results) {
  const dialogSelector = args.dialogSelector ? String(args.dialogSelector) : "";
  if (!(await visibleDialog(page, dialogSelector))) {
    const clicked = await clickFirstOpenable(page, args.rowSelector ? String(args.rowSelector) : "");
    await page.waitForTimeout(300);
    addResult(results, "open-drawer-click", clicked && (await visibleDialog(page, dialogSelector)), "first row/openable opens dialog or drawer");
  } else {
    addResult(results, "open-drawer-click", true, "dialog already visible");
  }

  const deepLinkId = args.deepLinkId ? String(args.deepLinkId) : "";
  if (!deepLinkId) {
    addResult(results, "deep-link-opens", false, "missing --deep-link-id");
    addResult(results, "esc-clears-param", false, "missing --deep-link-id");
    return;
  }

  const url = new URL(baseUrl);
  url.searchParams.set("aberto", deepLinkId);
  await page.goto(url.toString(), { waitUntil: "load" });
  await page.waitForTimeout(500);

  const expectedText = String(args.expectedText || deepLinkId);
  const deepLinkData = await page.evaluate((text) => {
    const bodyText = document.body ? document.body.innerText : "";
    const hasDialog = Boolean(document.querySelector('[role="dialog"], [aria-modal="true"]'));
    return {
      hasDialog,
      hasText: bodyText.toLowerCase().includes(text.toLowerCase()),
      search: window.location.search,
    };
  }, expectedText);
  addResult(
    results,
    "deep-link-opens",
    deepLinkData.search.includes(`aberto=${encodeURIComponent(deepLinkId)}`) && deepLinkData.hasDialog && deepLinkData.hasText,
    `expected visible text: ${expectedText}`,
  );

  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const searchAfterEsc = await page.evaluate(() => window.location.search);
  addResult(results, "esc-clears-param", !new URLSearchParams(searchAfterEsc).has("aberto"), searchAfterEsc || "empty search");
}

async function captureScreenshots(browser, fileUrl, outDir, slug) {
  const shots = [];
  for (const scheme of ["light", "dark"]) {
    const context = await browser.newContext({
      colorScheme: scheme,
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    await page.goto(fileUrl, { waitUntil: "load" });
    await page.evaluate((theme) => {
      document.documentElement.setAttribute("data-theme", theme);
    }, scheme);
    await page.waitForTimeout(300);
    const shotPath = path.join(outDir, `${slug}-${scheme}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    shots.push({ colorScheme: scheme, path: shotPath });
    await context.close();
  }
  return shots;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error("Missing required argument: --file <prototype.html>");
  }

  const filePath = path.resolve(String(args.file));
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prototype file not found: ${filePath}`);
  }

  const firefox = await importFirefox();
  if (!firefox) {
    throw new Error("Playwright is not installed. Run: npm i -D @playwright/test && npx playwright install firefox");
  }

  const html = fs.readFileSync(filePath, "utf8");
  const outDir = path.resolve(String(args.out || path.join(".dw", ".open-design", "gate", slugify(path.basename(filePath)))));
  fs.mkdirSync(outDir, { recursive: true });
  const baseUrl = pathToFileURL(filePath).toString();
  const slug = slugify(path.basename(filePath));

  const browser = await firefox.launch({ headless: true });
  const results = [];
  let screenshots = [];
  try {
    const context = await browser.newContext({ colorScheme: "light", viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "load" });
    await structuralChecks(page, html, results);
    await behavioralChecks(page, baseUrl, args, results);
    await context.close();
    screenshots = await captureScreenshots(browser, baseUrl, outDir, slug);
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.pass);
  const summary = {
    file: filePath,
    score: Number(((results.length - failed.length) / results.length * 10).toFixed(1)),
    pass: failed.length === 0,
    results,
    screenshots,
  };
  fs.writeFileSync(path.join(outDir, `${slug}-gate.json`), JSON.stringify(summary, null, 2) + "\n", "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  process.stderr.write(`gate-prototype: ${error.message}\n`);
  process.exit(1);
});

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const result = { screenshot: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      if (key === "screenshot") result.screenshot.push(inlineValue);
      else result[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      if (key === "screenshot") {
        throw new Error("Missing value for --screenshot <path>.");
      }
      result[key] = true;
      continue;
    }
    if (key === "screenshot") result.screenshot.push(next);
    else result[key] = next;
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
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "screen"
  );
}

function parseViewports(value) {
  return String(value || "1440x900,375x812")
    .split(",")
    .map((entry) => {
      const match = entry.trim().match(/^(\d{2,5})x(\d{2,5})$/);
      if (!match) return null;
      return { width: Number(match[1]), height: Number(match[2]) };
    })
    .filter(Boolean);
}

function parseThemes(value) {
  return String(value || "light,dark")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry === "light" || entry === "dark");
}

function inferProvidedName(source, index) {
  const base = path.basename(source, path.extname(source)).toLowerCase();
  const width = base.match(/(?:^|[^0-9])(\d{3,5})(?:x\d{3,5})?(?:[^0-9]|$)/)?.[1];
  const theme = base.includes("dark") ? "dark" : base.includes("light") ? "light" : "";
  if (width && theme) return `atual-${width}-${theme}.png`;
  if (width) return `atual-${width}-${String(index + 1).padStart(2, "0")}.png`;
  return `atual-ref-${String(index + 1).padStart(2, "0")}.png`;
}

async function captureFromUrl(args, outDir) {
  if (!args.url) return [];
  const firefox = await importFirefox();
  if (!firefox) {
    throw new Error("Playwright is not installed. Run: npm i -D @playwright/test && npx playwright install firefox");
  }

  const viewports = parseViewports(args.viewports);
  if (viewports.length === 0) {
    throw new Error("No valid --viewports entries. Use comma-separated WIDTHxHEIGHT values, for example 1440x900,375x812.");
  }
  const themes = parseThemes(args.themes);
  if (themes.length === 0) {
    throw new Error("No valid --themes entries. Use light,dark or one of them.");
  }

  const browser = await firefox.launch({ headless: true });
  const shots = [];
  try {
    for (const viewport of viewports) {
      for (const theme of themes) {
        const context = await browser.newContext({
          colorScheme: theme,
          viewport,
        });
        const page = await context.newPage();
        await page.goto(String(args.url), { waitUntil: "networkidle" }).catch(() => page.goto(String(args.url)));
        await page.evaluate((value) => {
          document.documentElement.setAttribute("data-theme", value);
        }, theme);
        await page.waitForTimeout(300);
        const target = path.join(outDir, `atual-${viewport.width}-${theme}.png`);
        await page.screenshot({ path: target, fullPage: true });
        shots.push({ source: String(args.url), viewport, theme, path: target });
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return shots;
}

function copyProvidedScreenshots(args, outDir) {
  return args.screenshot.map((source, index) => {
    const resolved = path.resolve(String(source));
    if (!fs.existsSync(resolved)) {
      throw new Error(`Screenshot not found: ${resolved}`);
    }
    const target = path.join(outDir, inferProvidedName(resolved, index));
    fs.copyFileSync(resolved, target);
    return { source: resolved, path: target };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url && args.screenshot.length === 0) {
    throw new Error("Pass --url <app-url> or one or more --screenshot <path> values.");
  }

  const targetDir = path.resolve(String(args.target || "open-design"));
  const slug = slugify(args.slug || args.url || "screen");
  const outDir = path.resolve(String(args.out || path.join(targetDir, "_refs", slug)));
  fs.mkdirSync(outDir, { recursive: true });

  const copied = copyProvidedScreenshots(args, outDir);
  const captured = await captureFromUrl(args, outDir);
  const shots = [...copied, ...captured];

  process.stdout.write(
    `${JSON.stringify(
      {
        targetDir,
        refsDir: outDir,
        relativeRefs: shots.map((shot) => path.relative(targetDir, shot.path).split(path.sep).join("/")),
        shots,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`capture-current: ${error.message}\n`);
  process.exit(1);
});

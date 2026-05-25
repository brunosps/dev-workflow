#!/usr/bin/env node

// Resolves which browser to drive for dev-workflow's browser-automation flows
// (dw-qa, dw-functional-doc, dw-redesign-ui), with WSL resilience.
//
// Resolution order: env BROWSER_TEST -> .dw/config.json (browserTest) -> auto-detect.
// On WSL with no explicit config, auto-detects a Windows browser (Edge first, then
// Chrome) and launches it in remote-debugging mode so flows connect over CDP instead
// of opening WSLg / losing layout fidelity in the bundled Linux Chromium.
//
// Returns one of:
//   { mode: "cdp",    endpoint, source, cleanup }   // connect over CDP (browser ready)
//   { mode: "launch", launchOptions, source }        // let Playwright launch the browser
//
// DEFAULT (no BROWSER_TEST): the full Playwright Chromium in headless via
// channel:"chromium", which uses the new headless mode (desktop-faithful rendering,
// not the lighter headless-shell) and never opens WSLg. This is the robust default on
// WSL. Set BROWSER_TEST to opt into a Windows browser.
//
// NOTE on WSL networking: the Chromium debug port binds Windows loopback only. In mirrored
// networking mode WSL shares that loopback, so 127.0.0.1 connects directly. In NAT mode the
// helper starts the prebuilt cdp-relay.exe on Windows (0.0.0.0:<fixed port> -> 127.0.0.1:debug)
// and connects via the Windows host gateway. That needs the one-time setup performed by
// `npx @brunosps00/dev-workflow setup-wsl-browser` (installs the prebuilt relay + adds the Hyper-V firewall
// rule). Without it, the helper falls back to the local headless Chromium.

import fs from "node:fs";
import net from "node:net";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

// Full Chromium in new-headless mode: desktop-faithful rendering, no WSLg.
const BUNDLED_LAUNCH = { channel: "chromium" };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dedupe = (items) => [...new Set(items.filter(Boolean))];

export function detectWsl() {
  if (process.env.WSL_DISTRO_NAME) {
    return true;
  }
  try {
    return /microsoft/i.test(fs.readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
}

// WSL2 mirrored networking creates a `loopback0` interface and shares Windows' loopback, so
// 127.0.0.1 reaches a Windows browser's debug port directly. NAT mode has no loopback0 and
// needs the Windows-side relay instead. Used to choose between the two connection strategies.
export function isMirroredNetworking() {
  return fs.existsSync("/sys/class/net/loopback0");
}

function readConfigValue(projectRoot) {
  if (process.env.BROWSER_TEST && process.env.BROWSER_TEST.trim()) {
    return { value: process.env.BROWSER_TEST.trim(), source: "env:BROWSER_TEST" };
  }
  if (projectRoot) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(projectRoot, ".dw", "config.json"), "utf8"));
      if (cfg && typeof cfg.browserTest === "string" && cfg.browserTest.trim()) {
        return { value: cfg.browserTest.trim(), source: ".dw/config.json" };
      }
    } catch {
      // no config / unreadable -> fall through to auto-detect
    }
  }
  return { value: undefined, source: null };
}

function classifyValue(value) {
  if (/^(https?:\/\/|cdp:\/\/)/i.test(value)) {
    return "cdp";
  }
  if (/\.exe$/i.test(value) || value.startsWith("/mnt/")) {
    return "exe";
  }
  if (["chrome", "msedge", "chromium"].includes(value.toLowerCase())) {
    return "channel";
  }
  return value.includes("/") ? "exe" : "channel";
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function windowsHostIp() {
  // In WSL2 NAT mode the Windows host is the default-route gateway (the vEthernet
  // adapter), NOT the /etc/resolv.conf nameserver (which can be a DNS-tunneling proxy
  // like 10.255.255.254 that does not forward arbitrary TCP ports). Prefer the gateway.
  try {
    const out = spawnSync("ip", ["route", "show", "default"], { encoding: "utf8" });
    const match = out.stdout?.match(/default via ([0-9.]+)/);
    if (match) {
      return match[1];
    }
  } catch {
    // ignore
  }
  try {
    const match = fs.readFileSync("/etc/resolv.conf", "utf8").match(/nameserver\s+([0-9.]+)/);
    if (match) {
      return match[1];
    }
  } catch {
    // ignore
  }
  return null;
}

function httpGetJson(url, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });
    request.on("error", () => resolve(null));
    request.on("timeout", () => {
      request.destroy();
      resolve(null);
    });
  });
}

async function findReachableCdp(port, extraHosts = []) {
  const hosts = dedupe(["127.0.0.1", "localhost", ...extraHosts, windowsHostIp()]);
  for (const host of hosts) {
    const base = `http://${host}:${port}`;
    const info = await httpGetJson(`${base}/json/version`);
    if (info) {
      return { base, host, info };
    }
  }
  return null;
}

async function waitForCdp(hosts, port, { timeoutMs = 12000, intervalMs = 250 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const host of dedupe(hosts)) {
      const base = `http://${host}:${port}`;
      const info = await httpGetJson(`${base}/json/version`);
      if (info) {
        return { base, host, info };
      }
    }
    await sleep(intervalMs);
  }
  return null;
}

// A Windows path for the launched browser (it runs on Windows). Returns { winPath, wslPath }.
function windowsTempDir() {
  const rand = `dw-browser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let winTemp = null;
  try {
    winTemp = spawnSync("cmd.exe", ["/c", "echo %TEMP%"], { encoding: "utf8" }).stdout?.split(/\r?\n/)[0]?.trim() || null;
  } catch {
    winTemp = null;
  }
  if (!winTemp || !/^[A-Za-z]:\\/.test(winTemp)) {
    return null;
  }
  const winPath = `${winTemp}\\${rand}`;
  let wslPath = null;
  try {
    wslPath = spawnSync("wslpath", ["-u", winPath], { encoding: "utf8" }).stdout?.trim() || null;
  } catch {
    wslPath = null;
  }
  return wslPath ? { winPath, wslPath } : null;
}

// Fixed port the Windows-side relay listens on, so a single Hyper-V firewall rule covers it.
const DEFAULT_RELAY_PORT = 39222;

function relayPort(projectRoot) {
  const fromEnv = Number(process.env.DW_RELAY_PORT);
  if (fromEnv) return fromEnv;
  if (projectRoot) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(projectRoot, ".dw", "config.json"), "utf8"));
      if (Number(cfg?.relayPort)) return Number(cfg.relayPort);
    } catch {
      // ignore
    }
  }
  return DEFAULT_RELAY_PORT;
}

// The prebuilt Windows relay (cdp-relay.exe), installed by `setup-wsl-browser`. Order:
// .dw/config.json relayExe -> %LOCALAPPDATA%\dev-workflow\cdp-relay.exe. Returns { winPath, wslPath } or null.
function findRelayExe(projectRoot) {
  const candidates = [];
  if (projectRoot) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(projectRoot, ".dw", "config.json"), "utf8"));
      if (typeof cfg?.relayExe === "string" && cfg.relayExe.trim()) candidates.push(cfg.relayExe.trim());
    } catch {
      // ignore
    }
  }
  try {
    const lad = spawnSync("cmd.exe", ["/c", "echo %LOCALAPPDATA%"], { encoding: "utf8" }).stdout?.split(/\r?\n/)[0]?.trim();
    if (lad && /^[A-Za-z]:\\/.test(lad)) candidates.push(`${lad}\\dev-workflow\\cdp-relay.exe`);
  } catch {
    // ignore
  }
  for (const winPath of candidates) {
    let wslPath = null;
    try {
      wslPath = spawnSync("wslpath", ["-u", winPath], { encoding: "utf8" }).stdout?.trim() || null;
    } catch {
      // ignore
    }
    if (wslPath && fs.existsSync(wslPath)) return { winPath, wslPath };
  }
  return null;
}

// Launches the Windows browser in remote-debugging mode and returns a CDP descriptor.
// - mirrored networking: WSL shares the Windows loopback (Hyper-V LoopbackEnabled), connect 127.0.0.1.
// - NAT networking: the prebuilt cdp-relay.exe bridges 0.0.0.0:<relayPort> -> 127.0.0.1:<debug> on the
//   Windows side, and WSL connects via the Windows host gateway. This needs a one-time Hyper-V firewall
//   inbound rule for <relayPort> (added by `setup-wsl-browser`), because WSL's Hyper-V firewall defaults
//   inbound to Block. The browser echoes the request Host into webSocketDebuggerUrl, so the ws stays
//   reachable through the relay.
// --remote-allow-origins=* is required or Chromium drops the DevTools ws (anti-DNS-rebinding).
async function launchWindowsBrowser(exePath, { headless, projectRoot }) {
  const mirrored = isMirroredNetworking();
  const tmp = windowsTempDir();
  if (tmp) {
    try {
      fs.mkdirSync(tmp.wslPath, { recursive: true });
    } catch {
      // best effort
    }
  }

  const debugPort = await getFreePort();
  const args = [
    `--remote-debugging-port=${debugPort}`,
    "--remote-allow-origins=*",
    "--no-first-run",
    "--no-default-browser-check",
  ];
  if (tmp) args.push(`--user-data-dir=${tmp.winPath}\\profile`);
  if (headless) args.push("--headless=new");
  args.push("about:blank");

  const browserChild = spawn(exePath, args, { detached: true, stdio: "ignore" });
  browserChild.unref();

  const cleanups = [() => browserChild.kill()];
  if (tmp) cleanups.push(() => fs.rmSync(tmp.wslPath, { recursive: true, force: true }));
  const cleanup = async () => {
    for (const fn of cleanups) {
      try {
        await fn();
      } catch {
        // ignore
      }
    }
  };

  let hosts;
  let port;
  if (mirrored) {
    hosts = ["127.0.0.1", "localhost"];
    port = debugPort;
  } else {
    const relay = findRelayExe(projectRoot);
    if (!relay) {
      await cleanup();
      throw new Error(
        "WSL is in NAT mode; reaching the Windows browser needs cdp-relay.exe. Run " +
          "`npx @brunosps00/dev-workflow setup-wsl-browser` (installs the prebuilt relay and adds the " +
          "Hyper-V firewall rule). Alternatively enable mirrored networking or set BROWSER_TEST to a CDP URL.",
      );
    }
    const rport = relayPort(projectRoot);
    const relayChild = spawn(relay.wslPath, [String(rport), String(debugPort)], { detached: true, stdio: "ignore" });
    relayChild.unref();
    cleanups.unshift(() => relayChild.kill());
    hosts = [windowsHostIp(), "127.0.0.1"].filter(Boolean);
    port = rport;
  }

  const found = await waitForCdp(hosts, port);
  if (!found) {
    await cleanup();
    throw new Error(
      `Launched ${path.basename(exePath)} but its CDP endpoint was not reachable (${hosts.join("/")}:${port}). ` +
        "The Hyper-V firewall rule may be missing — run `npx @brunosps00/dev-workflow setup-wsl-browser`.",
    );
  }

  return { mode: "cdp", endpoint: found.base, source: `launched:${path.basename(exePath)}${mirrored ? "" : "+relay"}`, cleanup };
}

const noopCleanup = async () => {};

function bundledDescriptor(headless, source = "bundled") {
  return { mode: "launch", launchOptions: { ...BUNDLED_LAUNCH, headless }, source };
}

// When an explicit BROWSER_TEST cannot be honored, degrade to the headless default
// (resilient) unless allowFallback is false (then throw, e.g. for diagnostics).
function degradeOrThrow(message, { headless, allowFallback }) {
  if (allowFallback) {
    process.stderr.write(`resolve-browser: ${message} Falling back to headless Chromium.\n`);
    return bundledDescriptor(headless, "fallback");
  }
  throw new Error(message);
}

export async function resolveBrowser({ projectRoot, headless = true, allowFallback = true } = {}) {
  const { value, source } = readConfigValue(projectRoot);

  if (!value) {
    return bundledDescriptor(headless);
  }

  const kind = classifyValue(value);

  if (kind === "cdp") {
    const url = new URL(value.replace(/^cdp:\/\//i, "http://"));
    const port = Number(url.port) || 9222;
    const found = await findReachableCdp(port, [url.hostname]);
    if (!found) {
      return degradeOrThrow(
        `BROWSER_TEST endpoint '${value}' is not reachable (start the browser with --remote-debugging-port=${port}).`,
        { headless, allowFallback },
      );
    }
    return { mode: "cdp", endpoint: found.base, source, cleanup: noopCleanup };
  }

  if (kind === "exe") {
    if (!fs.existsSync(value)) {
      return degradeOrThrow(`BROWSER_TEST points to '${value}', but that file does not exist.`, {
        headless,
        allowFallback,
      });
    }
    try {
      return await launchWindowsBrowser(value, { headless, projectRoot });
    } catch (error) {
      return degradeOrThrow(error.message, { headless, allowFallback });
    }
  }

  // channel: chrome | msedge | chromium
  const channel = value.toLowerCase();
  return { mode: "launch", launchOptions: { channel, headless }, source };
}

// CLI probe: `node resolve-browser.mjs [--project-root <dir>] [--headed] [--keep-open]`
// Prints the resolved descriptor as JSON (cleans up any launched browser unless --keep-open).
function parseProbeArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--headed") out.headed = true;
    else if (token === "--keep-open") out.keepOpen = true;
    else if (token === "--project-root") out.projectRoot = argv[(i += 1)];
  }
  return out;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]).endsWith("resolve-browser.mjs");
if (invokedDirectly) {
  const args = parseProbeArgs(process.argv.slice(2));
  resolveBrowser({ projectRoot: args.projectRoot ?? process.cwd(), headless: !args.headed })
    .then(async (descriptor) => {
      const { cleanup, ...printable } = descriptor;
      process.stdout.write(`${JSON.stringify(printable, null, 2)}\n`);
      if (typeof cleanup === "function" && !args.keepOpen) {
        await cleanup();
      }
    })
    .catch((error) => {
      process.stderr.write(`resolve-browser: ${error.message}\n`);
      process.exitCode = 1;
    });
}

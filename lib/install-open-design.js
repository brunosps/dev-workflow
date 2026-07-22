const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const OPEN_DESIGN_REPO = 'https://github.com/nexu-io/open-design';
const OPEN_DESIGN_REF = '1cb7eae';
const OPEN_DESIGN_VENDOR_DIR = path.join(os.homedir(), '.dw', 'vendor', 'open-design');

function odBin(dir = OPEN_DESIGN_VENDOR_DIR) {
  return path.join(dir, 'apps', 'daemon', 'bin', 'od.mjs');
}

function check() {
  return fs.existsSync(odBin());
}

function install() {
  checkPrerequisites();

  fs.mkdirSync(path.dirname(OPEN_DESIGN_VENDOR_DIR), { recursive: true });
  if (!fs.existsSync(path.join(OPEN_DESIGN_VENDOR_DIR, '.git'))) {
    if (fs.existsSync(OPEN_DESIGN_VENDOR_DIR)) {
      throw new Error(`${OPEN_DESIGN_VENDOR_DIR} exists but is not a git checkout; move it aside and retry.`);
    }
    execFileSync('git', ['clone', OPEN_DESIGN_REPO, OPEN_DESIGN_VENDOR_DIR], { stdio: 'pipe', timeout: 600000 });
  }

  execFileSync('git', ['fetch', '--tags', '--force', 'origin'], { cwd: OPEN_DESIGN_VENDOR_DIR, stdio: 'pipe', timeout: 600000 });
  execFileSync('git', ['checkout', OPEN_DESIGN_REF], { cwd: OPEN_DESIGN_VENDOR_DIR, stdio: 'pipe', timeout: 120000 });
  execFileSync('pnpm', ['install', '--frozen-lockfile'], { cwd: OPEN_DESIGN_VENDOR_DIR, stdio: 'pipe', timeout: 1200000 });

  if (!check()) {
    throw new Error(`Open Design install finished but ${odBin()} was not found.`);
  }
}

function instructions() {
  return [
    'Open Design CLI is provisioned by dev-workflow into a managed checkout:',
    `  ${OPEN_DESIGN_VENDOR_DIR}`,
    `  repo: ${OPEN_DESIGN_REPO}`,
    `  pinned ref: ${OPEN_DESIGN_REF}`,
    '',
    'Prerequisites:',
    '  Node.js ~24: install with fnm/nvm/asdf, then verify: node -v',
    '  pnpm >=10.33: corepack enable && corepack prepare pnpm@10.33.2 --activate',
    '  git: required to clone the upstream monorepo',
    '',
    'Then run: dev-workflow install-deps',
    'To use your own checkout instead of the managed one, set OD_CLI_DIR=/path/to/open-design.',
  ];
}

function checkPrerequisites() {
  const nodeVersion = process.versions.node;
  const nodeMajor = Number(nodeVersion.split('.')[0]);
  if (nodeMajor !== 24) {
    throw new Error(`Open Design requires Node.js ~24; detected ${nodeVersion}.`);
  }

  const pnpmRaw = execFileSync('pnpm', ['-v'], { stdio: 'pipe', timeout: 10000 }).toString().trim();
  if (!isAtLeast(pnpmRaw, '10.33.0')) {
    throw new Error(`Open Design requires pnpm >=10.33; detected ${pnpmRaw}.`);
  }

  execFileSync('git', ['--version'], { stdio: 'pipe', timeout: 10000 });
}

function isAtLeast(actual, minimum) {
  const a = actual.split('.').map((part) => Number(part));
  const b = minimum.split('.').map((part) => Number(part));
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const av = a[index] || 0;
    const bv = b[index] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return true;
}

module.exports = {
  OPEN_DESIGN_REF,
  OPEN_DESIGN_VENDOR_DIR,
  check,
  install,
  instructions,
  odBin,
};

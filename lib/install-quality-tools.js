const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// Engines for /dw-quality-gate. Everything lands under ~/.dw (never inside a
// project) and resolves from ~/.dw/bin when the tool is not on PATH, so the
// gate works without editing the user's shell profile.
const DW_HOME = path.join(os.homedir(), '.dw');
const BIN_DIR = path.join(DW_HOME, 'bin');
const VENDOR_DIR = path.join(DW_HOME, 'vendor');

// Pinned so a gate verdict does not move because an engine changed under it.
// Bump deliberately, re-checking the output fields quality-gate-tools.md documents.
const QLTY_VERSION = 'v0.649.0';
const LIZARD_VERSION = '1.24.0';
const JSCPD_SPEC = 'jscpd@5';

const IS_WINDOWS = process.platform === 'win32';
const EXE = IS_WINDOWS ? '.exe' : '';

function onPath(command, args = ['--version']) {
  try {
    execFileSync(command, args, { stdio: 'pipe', timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

function isMusl() {
  if (process.platform !== 'linux') return false;
  const report = process.report && process.report.getReport ? process.report.getReport() : null;
  return !(report && report.header && report.header.glibcVersionRuntime);
}

// Maps a Node platform/arch to the qlty release asset. Returns null when qlty
// does not publish a build for it; the caller then falls back to lizard.
function qltyAsset(platform = process.platform, arch = process.arch, musl = isMusl()) {
  const cpu = { x64: 'x86_64', arm64: 'aarch64' }[arch];
  if (!cpu) return null;
  if (platform === 'linux') return `qlty-${cpu}-unknown-linux-${musl ? 'musl' : 'gnu'}.tar.xz`;
  if (platform === 'darwin') return `qlty-${cpu}-apple-darwin.tar.xz`;
  if (platform === 'win32' && cpu === 'x86_64') return 'qlty-x86_64-pc-windows-msvc.zip';
  return null;
}

// A .sha256 asset is "<hex>  <filename>"; only the digest matters.
function parseSha256(text) {
  const match = String(text).trim().match(/^([a-f0-9]{64})\b/i);
  if (!match) throw new Error('checksum file does not start with a SHA-256 digest');
  return match[1].toLowerCase();
}

function verifySha256(filePath, expected) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  if (actual !== expected) {
    throw new Error(`checksum mismatch for ${path.basename(filePath)}: expected ${expected}, got ${actual}`);
  }
}

function download(url, dest) {
  execFileSync('curl', ['-fsSL', '--retry', '2', '-o', dest, url], { stdio: 'pipe', timeout: 600000 });
}

function qltyBin() {
  return path.join(BIN_DIR, `qlty${EXE}`);
}

function checkQlty() {
  return onPath('qlty') || fs.existsSync(qltyBin());
}

function installQlty() {
  const asset = qltyAsset();
  if (!asset) throw new Error(`qlty publishes no build for ${process.platform}/${process.arch}`);

  const base = `https://github.com/qltysh/qlty/releases/download/${QLTY_VERSION}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-qlty-'));
  try {
    const archive = path.join(tmp, asset);
    const sums = path.join(tmp, `${asset}.sha256`);
    download(`${base}/${asset}`, archive);
    download(`${base}/${asset}.sha256`, sums);
    verifySha256(archive, parseSha256(fs.readFileSync(sums, 'utf8')));

    // bsdtar (Windows 10+, macOS) reads .zip too; GNU tar needs -J for .xz.
    execFileSync('tar', [asset.endsWith('.zip') ? '-xf' : '-xJf', archive, '-C', tmp], { stdio: 'pipe', timeout: 120000 });
    const extracted = path.join(tmp, asset.replace(/\.(tar\.xz|zip)$/, ''), `qlty${EXE}`);
    if (!fs.existsSync(extracted)) throw new Error(`qlty binary not found inside ${asset}`);

    fs.mkdirSync(BIN_DIR, { recursive: true });
    fs.copyFileSync(extracted, qltyBin());
    fs.chmodSync(qltyBin(), 0o755);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (!checkQlty()) throw new Error(`qlty installed but ${qltyBin()} does not run`);
}

function lizardBin() {
  return path.join(BIN_DIR, IS_WINDOWS ? 'lizard.cmd' : 'lizard');
}

function checkLizard() {
  return onPath('lizard') || fs.existsSync(lizardBin());
}

// A private venv sidesteps PEP 668 ("externally managed environment"), which
// makes `pip install --user` fail on current Debian/Ubuntu/Homebrew Pythons.
function installLizard() {
  const python = ['python3', 'python'].find((candidate) => onPath(candidate));
  if (!python) throw new Error('Python 3 not found (needed for lizard)');

  const venv = path.join(VENDOR_DIR, 'lizard');
  execFileSync(python, ['-m', 'venv', venv], { stdio: 'pipe', timeout: 120000 });
  const venvPython = path.join(venv, IS_WINDOWS ? 'Scripts' : 'bin', `python${EXE}`);
  execFileSync(venvPython, ['-m', 'pip', 'install', '--quiet', `lizard==${LIZARD_VERSION}`], { stdio: 'pipe', timeout: 300000 });

  const target = path.join(venv, IS_WINDOWS ? 'Scripts' : 'bin', `lizard${EXE}`);
  fs.mkdirSync(BIN_DIR, { recursive: true });
  fs.rmSync(lizardBin(), { force: true });
  if (IS_WINDOWS) {
    fs.writeFileSync(lizardBin(), `@"${target}" %*\r\n`);
  } else {
    fs.symlinkSync(target, lizardBin());
  }
  if (!checkLizard()) throw new Error(`lizard installed but ${lizardBin()} is missing`);
}

function pathHint() {
  const inPath = (process.env.PATH || '').split(path.delimiter).includes(BIN_DIR);
  if (inPath) return [];
  return [
    `Engines installed under ${BIN_DIR} (the gate finds them there without PATH changes).`,
    IS_WINDOWS
      ? `To call them yourself: setx PATH "%PATH%;${BIN_DIR}"`
      : `To call them yourself: export PATH="${BIN_DIR}:$PATH"`,
  ];
}

const deps = [
  {
    name: `qlty ${QLTY_VERSION} (quality gate: complexity)`,
    check: checkQlty,
    install: installQlty,
    instructions: [
      'qlty is the primary complexity engine of /dw-quality-gate (cognitive + cyclomatic per function).',
      'Automatic install downloads the pinned release from GitHub and verifies its SHA-256; it needs curl and tar.',
      '  Manual:   curl https://qlty.sh | bash   (Windows: powershell -c "iwr https://qlty.sh | iex")',
      'Free for commercial use (Fair Source, BSL 1.1). Without it, the gate falls back to lizard.',
    ],
  },
  {
    name: `lizard ${LIZARD_VERSION} (quality gate: complexity fallback)`,
    check: checkLizard,
    install: installLizard,
    instructions: [
      'lizard is the complexity fallback of /dw-quality-gate (~30 languages, MIT).',
      `Automatic install creates a private venv at ${path.join(VENDOR_DIR, 'lizard')}; it needs Python 3 with venv.`,
      '  Manual:   pipx install lizard',
    ],
  },
  {
    name: `${JSCPD_SPEC} (quality gate: duplication)`,
    check: null,
    install: `npx -y ${JSCPD_SPEC} --version`,
    instructions: [
      'jscpd is the duplication engine of /dw-quality-gate (150+ formats, MIT); this warms the npx cache.',
    ],
  },
];

module.exports = {
  deps,
  pathHint,
  qltyAsset,
  parseSha256,
  verifySha256,
  QLTY_VERSION,
  LIZARD_VERSION,
  JSCPD_SPEC,
  BIN_DIR,
};

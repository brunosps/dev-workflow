'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const quality = require('../lib/install-quality-tools');
const { read } = require('./_helpers');

test('qlty asset names match the published release matrix', () => {
  assert.equal(quality.qltyAsset('linux', 'x64', false), 'qlty-x86_64-unknown-linux-gnu.tar.xz');
  assert.equal(quality.qltyAsset('linux', 'x64', true), 'qlty-x86_64-unknown-linux-musl.tar.xz');
  assert.equal(quality.qltyAsset('linux', 'arm64', false), 'qlty-aarch64-unknown-linux-gnu.tar.xz');
  assert.equal(quality.qltyAsset('darwin', 'arm64', false), 'qlty-aarch64-apple-darwin.tar.xz');
  assert.equal(quality.qltyAsset('darwin', 'x64', false), 'qlty-x86_64-apple-darwin.tar.xz');
  assert.equal(quality.qltyAsset('win32', 'x64', false), 'qlty-x86_64-pc-windows-msvc.zip');
  // No build published: the caller falls back to lizard instead of guessing an asset.
  assert.equal(quality.qltyAsset('win32', 'arm64', false), null);
  assert.equal(quality.qltyAsset('freebsd', 'x64', false), null);
  assert.equal(quality.qltyAsset('linux', 'ia32', false), null);
});

test('a download is refused unless its SHA-256 matches the published digest', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-qt-'));
  try {
    const file = path.join(dir, 'asset.tar.xz');
    fs.writeFileSync(file, 'payload');
    const digest = crypto.createHash('sha256').update('payload').digest('hex');

    assert.equal(quality.parseSha256(`${digest}  asset.tar.xz\n`), digest);
    assert.doesNotThrow(() => quality.verifySha256(file, digest));
    assert.throws(() => quality.verifySha256(file, '0'.repeat(64)), /checksum mismatch/);
    assert.throws(() => quality.parseSha256('<html>Not Found</html>'), /SHA-256/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('engines are pinned and install outside the project', () => {
  assert.match(quality.QLTY_VERSION, /^v\d+\.\d+\.\d+$/);
  assert.match(quality.LIZARD_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(quality.BIN_DIR, path.join(os.homedir(), '.dw', 'bin'));
  for (const dep of quality.deps) {
    assert.ok(dep.install, `${dep.name} must be installable, not detect-only`);
    assert.ok(Array.isArray(dep.instructions) && dep.instructions.length, `${dep.name} needs manual fallback instructions`);
  }
});

test('install-deps runs the quality engines and the gate docs resolve ~/.dw/bin', () => {
  const deps = read('lib/install-deps.js');
  assert.ok(deps.includes('...qualityTools.deps'), 'install-deps must include the quality engines');
  assert.ok(deps.includes('qualityTools.pathHint()'), 'install-deps must print the PATH hint');
  const tools = read('scaffold/skills/dw-simplification/references/quality-gate-tools.md');
  assert.ok(tools.includes('~/.dw/bin'), 'quality-gate-tools.md must resolve engines from ~/.dw/bin');
  assert.ok(tools.includes(quality.JSCPD_SPEC), 'quality-gate-tools.md must pin the same jscpd major as install-deps');
});

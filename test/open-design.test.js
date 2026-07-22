'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, exists, FILES, includes } = require('./_helpers');
const { COMMANDS } = require('../lib/constants');
const openDesign = require('../lib/install-open-design');

test('dw-open-design command is registered for EN and PT-BR as user-invoked', () => {
  for (const lang of ['en', 'pt-br']) {
    const entry = COMMANDS[lang].find((command) => command.name === 'dw-open-design');
    assert.ok(entry, `${lang} registry entry missing`);
    assert.equal(entry.userInvoked, true);
    includes(assert, entry.description, 'od CLI', `${lang} description`);
    includes(assert, entry.description, '--agent', `${lang} description`);
  }
});

test('dw-open-design scaffold files carry the validated headless protocol', () => {
  for (const rel of [FILES.openDesign.en, FILES.openDesign.pt]) {
    const body = read(rel);
    includes(assert, body, '<system_instructions>', rel);
    includes(assert, body, '<critical>', rel);
    includes(assert, body, '## 0.', rel);
    includes(assert, body, '<target>/PROMPT-<slug>.md', rel);
    includes(assert, body, rel.includes('/en/') ? 'raw request' : 'pedido cru', rel);
    includes(assert, body, 'OD_CHAT_RUN_INACTIVITY_TIMEOUT_MS=1800000', rel);
    includes(assert, body, '--agent "$AGENT"', rel);
    includes(assert, body, 'project import-folder', rel);
    includes(assert, body, 'run `succeeded`', rel);
    includes(assert, body, 'gate-prototype.mjs', rel);
    includes(assert, body, 'codex_core::shell_snapshot', rel);
    includes(assert, body, '**Status:** `PASS` | `FINDINGS` | `BLOCKED` | `NOT_APPLICABLE`', rel);
  }
});

test('open-design gate script is scaffolded', () => {
  assert.ok(exists('scaffold/scripts/open-design/gate-prototype.mjs'));
  const body = read('scaffold/scripts/open-design/gate-prototype.mjs');
  includes(assert, body, 'firefox.launch', 'gate script');
  includes(assert, body, 'colorScheme', 'gate script');
  includes(assert, body, 'deepLinkId', 'gate script');
  includes(assert, body, 'replaceState', 'gate script');
});

test('Open Design installer is pinned and checks the managed od.mjs path', () => {
  assert.equal(openDesign.OPEN_DESIGN_REF, '1cb7eae');
  assert.ok(openDesign.OPEN_DESIGN_VENDOR_DIR.endsWith('.dw/vendor/open-design'));
  assert.ok(openDesign.odBin().endsWith('apps/daemon/bin/od.mjs'));
});

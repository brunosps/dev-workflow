'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, exists, FILES } = require('./_helpers');

const REFERENCE = 'scaffold/skills/dw-review-rigor/references/composition-audit.md';

test('the composition-audit reference exists and carries what the command routes to it for', () => {
  assert.ok(exists(REFERENCE), 'the <critical> in /dw-review --post-merge points here');
  const body = read(REFERENCE);

  // The seven interaction classes are the reason the mode exists.
  for (const cls of [
    'Invariant bridges',
    'Helper and policy drift',
    'Default and config composition',
    'Order and lifecycle',
    'Shared resource behavior',
    'Schema, API, and data composition',
    'Test masking',
  ]) {
    assert.ok(body.includes(cls), `reference must cover the "${cls}" class`);
  }

  // Composition-only defects a single-platform gate cannot see.
  for (const token of ['case sensitivity', 'line endings', 'file-locking']) {
    assert.ok(body.includes(token), `reference must cover ${token}`);
  }

  // The two changelog hazards no heading-uniqueness check catches.
  assert.ok(body.includes('|||||||'), 'diff3 base markers survive a clean merge');
  assert.match(body, /released section/i, 'an entry can strand in an already-released section');
});

test('both locales freeze the same range with the same commands', () => {
  for (const locale of ['en', 'pt']) {
    const body = read(FILES.review[locale]);
    for (const token of [
      'git rev-parse --verify --quiet <base>^{commit}',
      'git rev-parse --verify HEAD',
      "git log --first-parent --format='%H %P %s' {{BASE_SHA}}..{{HEAD_SHA}}",
      'git diff --name-only {{BASE_SHA}}...{{HEAD_SHA}}',
      'git status --porcelain',
      '.dw/reviews/post-merge/last-audit.json',
    ]) {
      assert.ok(body.includes(token), `${FILES.review[locale]} must pin: ${token}`);
    }
  }
});

// The owner rejected a release step. This is that decision expressed as a gate:
// it is what stops a later edit from quietly turning the audit into a release.
test('the post-merge audit never becomes a release step', () => {
  for (const locale of ['en', 'pt']) {
    const rel = FILES.review[locale];
    const body = read(rel);
    for (const forbidden of ['git tag', 'npm publish', 'npm version', 'git push --tags']) {
      assert.ok(
        !body.includes(forbidden),
        `${rel} must not contain "${forbidden}" — the pipeline ends at the PR; the semver output is a recommendation only`
      );
    }
  }
  assert.ok(!read(REFERENCE).includes('npm publish'));
});

test('the mode is registered where users and the model discover it', () => {
  const { COMMANDS } = require('../lib/constants');
  for (const locale of ['en', 'pt-br']) {
    const entry = COMMANDS[locale].find((c) => c.name === 'dw-review');
    assert.ok(entry.description.includes('--post-merge'), `${locale} description must advertise the mode`);
    assert.ok([...entry.description].length <= 250, `${locale} description budget`);
    assert.match(read(`scaffold/${locale}/commands/dw-help.md`), /--post-merge/);
    assert.match(read(`scaffold/${locale}/references/command-routing.md`), /--post-merge/);
  }
});

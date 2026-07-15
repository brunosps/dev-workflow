const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { upsertDelimitedBlock } = require('../lib/utils');

const root = path.join(__dirname, '..');
const startMarker = '<!-- dev-workflow:start -->';
const endMarker = '<!-- dev-workflow:end -->';

test('upsertDelimitedBlock ignores inline marker mentions and stays idempotent', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-markers-'));
  const target = path.join(tempDir, 'AGENTS.md');
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const prefix = '# Project guidance\n\n';
  const suffix = '\n\n## Local rules\nKeep this tail once.\n';
  const existingBlock = [
    startMarker,
    'Old managed content.',
    `The closing marker is written as ${endMarker} in explanatory text.`,
    endMarker,
  ].join('\n');
  const blockContent = fs.readFileSync(
    path.join(root, 'scaffold/en/agent-instructions.md'),
    'utf8'
  );
  fs.writeFileSync(target, prefix + existingBlock + suffix, 'utf8');

  assert.equal(
    upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
    'updated'
  );
  const afterFirstUpdate = fs.readFileSync(target, 'utf8');

  assert.equal(
    upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
    'unchanged'
  );
  const afterSecondUpdate = fs.readFileSync(target, 'utf8');

  assert.equal(afterSecondUpdate, afterFirstUpdate);
  assert.equal(afterSecondUpdate, prefix + blockContent.trim() + suffix);
  assert.equal(afterSecondUpdate.match(/^<!-- dev-workflow:start -->$/gm)?.length, 1);
  assert.equal(afterSecondUpdate.match(/^<!-- dev-workflow:end -->$/gm)?.length, 1);
  assert.equal(afterSecondUpdate.split('Keep this tail once.').length - 1, 1);
});

test('upsertDelimitedBlock rejects source blocks with only inline marker mentions', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-markers-'));
  const target = path.join(tempDir, 'CLAUDE.md');
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const inlineOnly = `Use ${startMarker} and ${endMarker} as delimiters.`;

  assert.throws(
    () => upsertDelimitedBlock(target, inlineOnly, startMarker, endMarker),
    /missing standalone markers/
  );
  assert.equal(fs.existsSync(target), false);
});

test('upsertDelimitedBlock preserves CRLF-delimited content and stays idempotent', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-markers-'));
  const target = path.join(tempDir, 'AGENTS.md');
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const blockContent = [startMarker, 'New managed content.', endMarker, ''].join('\r\n');
  const existing = [
    '# Project guidance',
    '',
    startMarker,
    'Old managed content.',
    endMarker,
    '',
    'Keep this tail.',
    '',
  ].join('\r\n');
  const expected = [
    '# Project guidance',
    '',
    startMarker,
    'New managed content.',
    endMarker,
    '',
    'Keep this tail.',
    '',
  ].join('\r\n');
  fs.writeFileSync(target, existing, 'utf8');

  assert.equal(
    upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
    'updated'
  );
  assert.equal(fs.readFileSync(target, 'utf8'), expected);
  assert.equal(
    upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
    'unchanged'
  );
});

test('upsertDelimitedBlock recognizes indented standalone markers', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-markers-'));
  const target = path.join(tempDir, 'CLAUDE.md');
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const blockContent = [startMarker, 'New managed content.', endMarker].join('\n');
  const existing = [
    '# Project guidance',
    `  ${startMarker}  `,
    'Old managed content.',
    `\t${endMarker}\t`,
    'Keep this tail.',
    '',
  ].join('\n');
  fs.writeFileSync(target, existing, 'utf8');

  assert.equal(
    upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
    'updated'
  );
  const updated = fs.readFileSync(target, 'utf8');
  assert.match(updated, /^  <!-- dev-workflow:start -->$/m);
  assert.match(updated, /^<!-- dev-workflow:end -->\t$/m);
  assert.doesNotMatch(updated, /Old managed content/);
  assert.equal(updated.split('Keep this tail.').length - 1, 1);
});

test('upsertDelimitedBlock rejects unbalanced standalone markers in existing files', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-markers-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  const blockContent = [startMarker, 'New managed content.', endMarker].join('\n');

  for (const [name, existing] of [
    ['missing-end.md', [startMarker, 'Old managed content.'].join('\n')],
    ['missing-start.md', ['Old managed content.', endMarker].join('\n')],
  ]) {
    const target = path.join(tempDir, name);
    fs.writeFileSync(target, existing, 'utf8');

    assert.throws(
      () => upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
      /unbalanced standalone markers/
    );
    assert.equal(fs.readFileSync(target, 'utf8'), existing);
  }
});

test('upsertDelimitedBlock rejects duplicate standalone markers in existing files', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-markers-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  const blockContent = [startMarker, 'New managed content.', endMarker].join('\n');

  for (const [name, existing] of [
    [
      'duplicate-start.md',
      [startMarker, 'First block.', startMarker, 'Second block.', endMarker].join('\n'),
    ],
    [
      'duplicate-end.md',
      [startMarker, 'First block.', endMarker, 'Orphaned block.', endMarker].join('\n'),
    ],
  ]) {
    const target = path.join(tempDir, name);
    fs.writeFileSync(target, existing, 'utf8');

    assert.throws(
      () => upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
      /duplicate standalone markers/
    );
    assert.equal(fs.readFileSync(target, 'utf8'), existing);
  }
});

test('upsertDelimitedBlock rejects duplicate standalone markers in source blocks', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-markers-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  for (const [name, blockContent] of [
    [
      'duplicate-start.md',
      [startMarker, 'First block.', startMarker, 'Second block.', endMarker].join('\n'),
    ],
    [
      'duplicate-end.md',
      [startMarker, 'First block.', endMarker, 'Orphaned block.', endMarker].join('\n'),
    ],
  ]) {
    const target = path.join(tempDir, name);

    assert.throws(
      () => upsertDelimitedBlock(target, blockContent, startMarker, endMarker),
      /duplicate standalone markers/
    );
    assert.equal(fs.existsSync(target), false);
  }
});

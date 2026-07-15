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

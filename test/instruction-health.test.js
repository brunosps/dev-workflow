const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { LIMITS, inspectInstructions } = require('../lib/instruction-health');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-instruction-health-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, content) => {
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  };
  for (const lang of ['en', 'pt-br']) write(`scaffold/${lang}/agent-instructions.md`, 'Local guidance.\n');
  write('scaffold/skills/example/SKILL.md', '---\nname: example\ndescription: Review a specific behavior.\n---\n');
  return { root, write };
}

test('instruction budgets reject UTF-8 byte overflow and accept the exact boundary', t => {
  const { root, write } = fixture(t);
  write('scaffold/pt-br/agent-instructions.md', 'á'.repeat(LIMITS.instructions / 2));
  assert.deepEqual(inspectInstructions(root).issues, []);
  write('scaffold/pt-br/agent-instructions.md', 'á'.repeat(LIMITS.instructions / 2) + 'a');
  assert.deepEqual(inspectInstructions(root).issues, [
    `pt-br installed instructions exceed ${LIMITS.instructions} bytes`,
  ]);
});

test('routed reference validation catches a missing resource while permitting real resources', t => {
  const { root, write } = fixture(t);
  write('scaffold/skills/example/SKILL.md', [
    '---', 'name: example', 'description: Review a specific behavior.', '---',
    'Read `references/valid.md` for established behavior.',
    'Read [failure cases](references/missing.md) for failure analysis.',
  ].join('\n'));
  write('scaffold/skills/example/references/valid.md', '# Existing reference\n');
  assert.deepEqual(inspectInstructions(root).issues, ['example missing routed reference references/missing.md']);
  write('scaffold/skills/example/references/missing.md', '# Failure cases\n');
  assert.deepEqual(inspectInstructions(root).issues, []);
});

test('skill entrypoint and discovery budgets detect independent violations', t => {
  const { root, write } = fixture(t);
  write('scaffold/skills/example/SKILL.md', [
    '---', 'name: example', `description: ${'x'.repeat(LIMITS.description + 1)}`,
    '---', 'x'.repeat(LIMITS.skill),
  ].join('\n'));
  assert.deepEqual(inspectInstructions(root).issues, [
    `example entrypoint exceeds ${LIMITS.skill} bytes`,
    `example requires a description of at most ${LIMITS.description} characters`,
  ]);
});

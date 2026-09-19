'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const hookSource = path.join(__dirname, '..', 'scaffold', 'scripts', 'hooks', 'session-cost.mjs');

// The hook derives .dw/ from its own location, so a realistic run needs the
// installed layout: <root>/.dw/scripts/hooks/session-cost.mjs.
function makeProject(skills) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-session-cost-'));
  fs.mkdirSync(path.join(root, '.dw', 'scripts', 'hooks'), { recursive: true });
  fs.copyFileSync(hookSource, path.join(root, '.dw', 'scripts', 'hooks', 'session-cost.mjs'));
  fs.writeFileSync(
    path.join(root, '.dw', 'skill-registry.json'),
    JSON.stringify({ skills: skills.map((name) => ({ name })) })
  );
  return root;
}

function assistant(content, withUsage = true) {
  const message = { model: 'claude-sonnet-5', content };
  if (withUsage) message.usage = { input_tokens: 10, output_tokens: 5 };
  return JSON.stringify({ type: 'assistant', message });
}

function runHook(root, lines) {
  const transcript = path.join(root, 'transcript.jsonl');
  fs.writeFileSync(transcript, lines.join('\n') + '\n');
  execFileSync(process.execPath, [path.join(root, '.dw', 'scripts', 'hooks', 'session-cost.mjs')], {
    cwd: root,
    input: JSON.stringify({ transcript_path: transcript, session_id: 's1', reason: 'clear' }),
    encoding: 'utf8',
  });
  const costs = path.join(root, '.dw', 'metrics', 'costs.jsonl');
  if (!fs.existsSync(costs)) return null;
  const rows = fs.readFileSync(costs, 'utf8').trim().split('\n').filter(Boolean);
  return JSON.parse(rows[rows.length - 1]);
}

test('a skills/ path inside a tool call input counts as a reference', () => {
  const root = makeProject(['dw-verify', 'dw-simplification']);
  const row = runHook(root, [
    assistant([
      { type: 'tool_use', name: 'Read', input: { file_path: '.agents/skills/dw-verify/SKILL.md' } },
    ]),
  ]);
  assert.equal(row.skills['dw-verify'], 1);
});

test('the Skill tool counts by its skill argument', () => {
  const root = makeProject(['humanizer']);
  const row = runHook(root, [
    assistant([{ type: 'tool_use', name: 'Skill', input: { skill: 'humanizer' } }]),
  ]);
  assert.equal(row.skills.humanizer, 1);
});

test('a tool_result that merely mentions a skill path does NOT count', () => {
  const root = makeProject(['dw-simplification']);
  const row = runHook(root, [
    JSON.stringify({
      type: 'user',
      message: {
        content: [
          {
            type: 'tool_result',
            content: 'see .agents/skills/dw-simplification/SKILL.md for the protocol',
          },
        ],
      },
    }),
    assistant([{ type: 'text', text: 'read .agents/skills/dw-simplification/SKILL.md' }]),
  ]);
  assert.deepEqual(row.skills, {}, 'quoted prose is not a firing');
});

test('an observed session with no reference records an empty object, not a missing key', () => {
  const root = makeProject(['dw-verify']);
  const row = runHook(root, [assistant([{ type: 'text', text: 'nothing to do' }])]);
  assert.ok(Object.prototype.hasOwnProperty.call(row, 'skills'), 'skills key must always be emitted');
  assert.deepEqual(row.skills, {});
});

test('an unknown name under skills/ is ignored, and a grouped skill keeps its group', () => {
  const root = makeProject([]);
  fs.mkdirSync(path.join(root, '.agents', 'skills', 'azure', 'app-service'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents', 'skills', 'azure', 'app-service', 'SKILL.md'), '# x');
  const row = runHook(root, [
    assistant([
      { type: 'tool_use', name: 'Read', input: { file_path: '.agents/skills/azure/app-service/SKILL.md' } },
      { type: 'tool_use', name: 'Read', input: { file_path: '.agents/skills/not-installed/SKILL.md' } },
    ]),
  ]);
  assert.deepEqual(row.skills, { 'azure/app-service': 1 });
});

test('one tool call is one reference per skill, however often its input names it', () => {
  const root = makeProject(['dw-verify']);
  const row = runHook(root, [
    assistant([
      {
        type: 'tool_use',
        name: 'Grep',
        input: {
          path: '.agents/skills/dw-verify/',
          files: ['.agents/skills/dw-verify/SKILL.md', '.agents/skills/dw-verify/references/x.md'],
        },
      },
    ]),
  ]);
  assert.equal(row.skills['dw-verify'], 1, 'a grep over one skill directory is one load, not three');
});

test('separate tool calls each count', () => {
  const root = makeProject(['dw-verify']);
  const row = runHook(root, [
    assistant([{ type: 'tool_use', name: 'Read', input: { file_path: '.agents/skills/dw-verify/SKILL.md' } }]),
    assistant([{ type: 'tool_use', name: 'Read', input: { file_path: '.agents/skills/dw-verify/SKILL.md' } }]),
  ]);
  assert.equal(row.skills['dw-verify'], 2);
});

test('a corrupt transcript exits 0 without writing', () => {
  const root = makeProject(['dw-verify']);
  const row = runHook(root, ['{not json', '']);
  assert.equal(row, null, 'no usable turn means no row');
});

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const contract = import('../scaffold/scripts/lib/workflow-contract.mjs');
const { inspectInstructions } = require('../lib/instruction-health');
const root = path.join(__dirname, '..');
const assignment = tool => ({ complexity: 'standard', rationale: 'Known service boundary', tool,
  model: tool === 'local' ? 'inherit' : 'approved-model', effort: tool === 'local' ? 'inherit' : 'medium', agents: [], fallbacks: [] });
const plan = tool => ({ schema_version: '1.1', approved: true, tasks: [
  { id: '1.0', depends_on: [], execution: assignment(tool) },
  { id: '2.0', depends_on: ['1.0'], execution: assignment(tool) },
] });

test('cross-tool assignments survive serialized handoff and resume without rescheduling completed dependencies', async () => {
  const { resolveAssignment, readyTasks } = await contract;
  for (const tool of ['codex', 'claude']) {
    const approved = JSON.parse(JSON.stringify(plan(tool)));
    assert.deepEqual(readyTasks(approved, []), ['1.0']);
    assert.equal(resolveAssignment(approved, '1.0', ['local', tool]).tool, tool);
    const restored = JSON.parse(JSON.stringify({ plan: approved, completed: ['1.0'] }));
    assert.deepEqual(readyTasks(restored.plan, restored.completed), ['2.0']);
    assert.equal(resolveAssignment(restored.plan, '2.0', ['local', tool]).model, 'approved-model');
    assert.deepEqual(readyTasks(approved, ['1.0', '2.0']), []);
  }
});

test('unavailable executor blocks unless the approved plan includes a usable fallback', async () => {
  const { resolveAssignment } = await contract;
  const p = plan('codex');
  assert.throws(() => resolveAssignment(p, '1.0', ['local', 'claude']), /No approved executor/);
  p.tasks[0].execution.fallbacks.push({ tool: 'claude', model: 'alternate', effort: 'high' });
  assert.deepEqual(resolveAssignment(p, '1.0', ['local', 'claude']), {
    tool: 'claude', model: 'alternate', effort: 'high', agents: [], fallback: true,
  });
  p.approved = false;
  assert.throws(() => resolveAssignment(p, '1.0', ['codex', 'claude']), /not approved/);
});

test('legacy task plans remain local without inferring delegation from installed tools', async () => {
  const { validatePlan, resolveAssignment } = await contract;
  const p = { schema_version: '1.0', approved: true, tasks: [{ id: '1', depends_on: [] }] };
  assert.deepEqual(validatePlan(p), []);
  assert.equal(resolveAssignment(p, '1', ['local', 'codex', 'claude']).tool, 'local');
});

test('invalid graphs and incomplete assignments fail before dispatch', async () => {
  const { validatePlan } = await contract;
  const p = plan('codex');
  p.tasks[0].depends_on = ['2.0'];
  assert.match(validatePlan(p).join(), /cycle/);
  p.tasks[0].depends_on = ['missing'];
  assert.match(validatePlan(p).join(), /unknown dependency/);
  p.tasks[0].depends_on = [];
  p.tasks[0].execution.model = 'inherit';
  assert.match(validatePlan(p).join(), /must resolve model/);
  p.tasks[0].execution.fallbacks = [null];
  assert.match(validatePlan(p).join(), /invalid fallback/);
  p.tasks[1].id = '1.0';
  assert.match(validatePlan(p).join(), /Duplicate task/);
  assert.ok(validatePlan({ schema_version: '1.1', approved: true, tasks: [] }).length);
});

test('verification survives message boundaries but not changed source, environment or broader claims', async () => {
  const { reusableEvidence } = await contract;
  const e = { command: 'node --test', input_fingerprint: 'source-and-lockfile-hash', environment_fingerprint: 'node22-fixture-v1',
    scope: ['task-1', 'task-2'], exit_code: 0, executed_at: 'prior-turn' };
  const current = { ...e, scope: ['task-1'], executed_at: 'new-turn' };
  assert.equal(reusableEvidence(e, current), true);
  for (const change of [{ input_fingerprint: 'edited-source' }, { environment_fingerprint: 'changed-fixture' },
    { command: 'different-gate' }, { scope: ['whole-project'] }, { input_fingerprint: '' }]) {
    assert.equal(reusableEvidence(e, { ...current, ...change }), false);
  }
  assert.equal(reusableEvidence({ ...e, exit_code: 1 }, current), false);
  assert.equal(reusableEvidence(null, current), false);
});

test('instruction budgets and concrete routed references are valid', () => {
  assert.deepEqual(inspectInstructions().issues, []);
});

test('both locale installations preserve routing choices and ship usable execution contracts on repeated update', async t => {
  const { validatePlan } = await contract;
  for (const locale of ['en', 'pt-br']) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-modern-install-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const cli = (...args) => {
      const r = spawnSync(process.execPath, [path.join(root, 'bin/dev-workflow.js'), ...args], { cwd: dir, encoding: 'utf8' });
      assert.equal(r.status, 0, r.stderr + r.stdout);
    };
    cli('init', `--lang=${locale}`, '--profile=core');
    const routing = path.join(dir, '.dw/config/routing.json');
    const custom = fs.readFileSync(routing, 'utf8').replace('gpt-6-astra', 'owner-pinned-model');
    fs.writeFileSync(routing, custom);
    fs.appendFileSync(path.join(dir, 'AGENTS.md'), '\nOwner rule: preserve this.\n');
    cli('update', `--lang=${locale}`);
    cli('update', `--lang=${locale}`);
    assert.equal(fs.readFileSync(routing, 'utf8'), custom);
    assert.equal(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8').split('Owner rule: preserve this.').length, 2);
    const reference = fs.readFileSync(path.join(dir, '.dw/references/execution-contract.md'), 'utf8');
    const example = JSON.parse(reference.match(/```json\n([\s\S]*?)\n```/)[1]);
    assert.deepEqual(validatePlan(example), []);
    const fixture = path.join(dir, 'execution-plan.json'); fs.writeFileSync(fixture, JSON.stringify(plan('codex')));
    const result = spawnSync(process.execPath, [path.join(dir, '.dw/scripts/lib/workflow-contract.mjs'), 'resolve', fixture, '1.0', 'local,codex'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).tool, 'codex');
    for (const template of ['task-template.md', 'tasks-template.md']) {
      assert.match(fs.readFileSync(path.join(dir, '.dw/templates', template), 'utf8'), /schema_version: "1.1"/);
    }
  }
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const cli = path.join(__dirname, '..', 'bin', 'dev-workflow.js');

function runCli(cwd, ...args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
  });
  assert.equal(
    result.status,
    0,
    `dev-workflow ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`
  );
}

test('repeated update preserves agent instruction tails with inline marker mentions', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-update-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  runCli(tempDir, 'init', '--lang=en', '--profile=core');

  const targets = ['AGENTS.md', 'CLAUDE.md'].map((name) => path.join(tempDir, name));
  const localTail = '\n# Local rules\nKeep this project-specific tail once.\n';
  for (const target of targets) {
    fs.appendFileSync(target, localTail, 'utf8');
  }

  runCli(tempDir, 'update', '--lang=en');
  const afterFirstUpdate = targets.map((target) => fs.readFileSync(target, 'utf8'));

  runCli(tempDir, 'update', '--lang=en');
  const afterSecondUpdate = targets.map((target) => fs.readFileSync(target, 'utf8'));

  assert.deepEqual(afterSecondUpdate, afterFirstUpdate);
  for (const content of afterSecondUpdate) {
    assert.match(content, /between `<!-- dev-workflow:start -->` and `<!-- dev-workflow:end -->` markers/);
    assert.equal(content.match(/^<!-- dev-workflow:start -->$/gm)?.length, 1);
    assert.equal(content.match(/^<!-- dev-workflow:end -->$/gm)?.length, 1);
    assert.equal(content.split('Keep this project-specific tail once.').length - 1, 1);
  }
});

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  installHooks,
  removeHooks,
  CODEX_HOOKS_FILE,
  GIT_GUARDRAILS_CMD,
  STATUSLINE_CMD,
  SESSION_COST_CMD,
} = require('../lib/hooks');
const { checkHooks } = require('../lib/doctor');

const HOOKS_SRC = path.join(__dirname, '..', 'scaffold', 'scripts', 'hooks');
const LEGACY = {
  guardrail: 'node .dw/scripts/hooks/git-guardrails.mjs',
  sessionCost: 'node .dw/scripts/hooks/session-cost.mjs',
  statusLine: 'node .dw/scripts/hooks/statusline.mjs',
};
const POSIX_ONLY = { skip: process.platform === 'win32' };

// A consumer project with the hook scripts installed and a subdirectory the shell
// can wander into (Claude Code's Bash cwd follows every `cd`).
function makeProject(t, { git = false } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dw-hooks-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const hooksDir = path.join(root, '.dw', 'scripts', 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  for (const file of fs.readdirSync(HOOKS_SRC)) fs.copyFileSync(path.join(HOOKS_SRC, file), path.join(hooksDir, file));
  const subdir = path.join(root, '.dw', 'reports');
  fs.mkdirSync(subdir, { recursive: true });
  if (git) assert.equal(spawnSync('git', ['init', '-q'], { cwd: root }).status, 0);
  return { root, subdir };
}

const claudePath = (root) => path.join(root, '.claude', 'settings.json');
const codexPath = (root) => path.join(root, CODEX_HOOKS_FILE);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
}
const commandsOf = (config) =>
  Object.values(config.hooks || {}).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));

// Run a hook command the way both agents do: through a shell, in the session's
// current directory, with $CLAUDE_PROJECT_DIR set (Claude Code) or not (Codex).
function runCommand(command, { cwd, projectDir, input }) {
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  if (projectDir) env.CLAUDE_PROJECT_DIR = projectDir;
  return spawnSync('sh', ['-c', command], { cwd, env, input, encoding: 'utf8' });
}

const bashPayload = (command) => JSON.stringify({ tool_name: 'Bash', tool_input: { command } });
const decision = (result) => JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;

test('Claude Code: hook commands find their scripts when the shell is in a subdirectory', POSIX_ONLY, (t) => {
  const { root, subdir } = makeProject(t);
  installHooks(root);
  const settings = readJson(claudePath(root));
  const guardrail = settings.hooks.PreToolUse.find((g) => g.matcher === 'Bash').hooks[0].command;
  assert.equal(guardrail, GIT_GUARDRAILS_CMD);

  const allowed = runCommand(guardrail, { cwd: subdir, projectDir: root, input: bashPayload('git status') });
  assert.equal(allowed.status, 0, allowed.stderr);
  assert.equal(allowed.stdout.trim(), '');

  // Still guards from a subdirectory: a force push is denied.
  const denied = runCommand(guardrail, { cwd: subdir, projectDir: root, input: bashPayload('git push --force origin main') });
  assert.equal(denied.status, 0, denied.stderr);
  assert.equal(decision(denied), 'deny');

  const status = runCommand(settings.statusLine.command, { cwd: subdir, projectDir: root, input: '{}' });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /^dw · /);
});

test('Codex: the guardrail in .codex/hooks.json resolves the project root without $CLAUDE_PROJECT_DIR', POSIX_ONLY, (t) => {
  const { root, subdir } = makeProject(t, { git: true });
  installHooks(root);
  const codex = readJson(codexPath(root));
  const group = codex.hooks.PreToolUse.find((g) => g.matcher === 'Bash');
  assert.deepEqual(group.hooks, [{ type: 'command', command: GIT_GUARDRAILS_CMD }]);

  // Codex exports no project variable: the git root is used, so a subdirectory works.
  const denied = runCommand(GIT_GUARDRAILS_CMD, { cwd: subdir, input: bashPayload('git reset --hard HEAD~1') });
  assert.equal(denied.status, 0, denied.stderr);
  assert.equal(decision(denied), 'deny');
  const allowed = runCommand(GIT_GUARDRAILS_CMD, { cwd: subdir, input: bashPayload('git log -1') });
  assert.equal(allowed.status, 0, allowed.stderr);
  assert.equal(allowed.stdout.trim(), '');

  // Codex installs only the guardrail: session-cost and the statusline are Claude Code features.
  assert.deepEqual(commandsOf(codex), [GIT_GUARDRAILS_CMD]);
  assert.equal(codex.statusLine, undefined);
});

test('outside a git repo, without $CLAUDE_PROJECT_DIR, the command falls back to the cwd', POSIX_ONLY, (t) => {
  const { root } = makeProject(t);
  const result = runCommand(GIT_GUARDRAILS_CMD, { cwd: root, input: bashPayload('git clean -fd') });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(decision(result), 'deny');
});

test('the old cwd-relative command is the failure being fixed', POSIX_ONLY, (t) => {
  const { root, subdir } = makeProject(t);
  const result = runCommand(LEGACY.guardrail, { cwd: subdir, projectDir: root, input: bashPayload('git status') });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Cannot find module/);
});

test('update migrates cwd-relative hooks in place, adds the Codex guardrail and keeps user hooks', (t) => {
  const { root } = makeProject(t);
  writeJson(claudePath(root), {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            { type: 'command', command: LEGACY.guardrail },
            { type: 'command', command: 'echo user-bash-hook' },
          ],
        },
        { matcher: 'Edit', hooks: [{ type: 'command', command: 'echo user-edit-hook' }] },
      ],
      SessionEnd: [{ hooks: [{ type: 'command', command: LEGACY.sessionCost }] }],
    },
    statusLine: { type: 'command', command: LEGACY.statusLine },
  });
  writeJson(codexPath(root), {
    hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo user-codex-hook' }] }] },
  });

  assert.deepEqual(installHooks(root), { hooks: 'updated', sessionCost: 'updated', statusLine: 'updated', codex: 'added' });

  const claude = readJson(claudePath(root));
  const claudeCommands = commandsOf(claude);
  assert.equal(claudeCommands.filter((c) => c === GIT_GUARDRAILS_CMD).length, 1);
  assert.equal(claudeCommands.filter((c) => c === SESSION_COST_CMD).length, 1);
  assert.ok(claudeCommands.includes('echo user-bash-hook'));
  assert.ok(claudeCommands.includes('echo user-edit-hook'));
  assert.ok(!claudeCommands.some((c) => Object.values(LEGACY).includes(c)), 'no legacy command left behind');
  assert.equal(claude.statusLine.command, STATUSLINE_CMD);

  assert.deepEqual(commandsOf(readJson(codexPath(root))).sort(), ['echo user-codex-hook', GIT_GUARDRAILS_CMD].sort());

  assert.deepEqual(installHooks(root), { hooks: 'unchanged', sessionCost: 'unchanged', statusLine: 'unchanged', codex: 'unchanged' });
});

test('a malformed .codex/hooks.json is left alone', (t) => {
  const { root } = makeProject(t);
  writeJson(codexPath(root), '{ not json');
  assert.equal(installHooks(root).codex, 'skipped-malformed');
  assert.equal(fs.readFileSync(codexPath(root), 'utf8'), '{ not json');
});

test('a user statusLine is never replaced', (t) => {
  const { root } = makeProject(t);
  writeJson(claudePath(root), { statusLine: { type: 'command', command: 'my-statusline' } });
  assert.equal(installHooks(root).statusLine, 'skipped-user');
  assert.equal(readJson(claudePath(root)).statusLine.command, 'my-statusline');
});

test('uninstall removes only dev-workflow entries from both agents', (t) => {
  const { root } = makeProject(t);
  installHooks(root);
  assert.equal(removeHooks(root), 4, 'guardrail + session-cost + statusLine + Codex guardrail');
  assert.deepEqual(readJson(claudePath(root)), {});
  assert.ok(!fs.existsSync(codexPath(root)), 'a .codex/hooks.json holding only our hook is deleted');

  writeJson(codexPath(root), {
    hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo user-stop' }] }] },
  });
  installHooks(root);
  removeHooks(root);
  assert.deepEqual(commandsOf(readJson(codexPath(root))), ['echo user-stop']);
});

test('statusline reads .dw state from the project dir, not the current dir', (t) => {
  const { root, subdir } = makeProject(t);
  fs.writeFileSync(path.join(root, '.dw', 'minimalism.json'), JSON.stringify({ mode: 'lite' }));
  const script = path.join(root, '.dw', 'scripts', 'hooks', 'statusline.mjs');
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  const run = (payload, extraEnv = {}) =>
    spawnSync(process.execPath, [script], {
      cwd: subdir,
      env: { ...env, ...extraEnv },
      input: JSON.stringify(payload),
      encoding: 'utf8',
    }).stdout;

  assert.match(run({ workspace: { current_dir: subdir, project_dir: root } }), /min:lite/);
  assert.match(run({ workspace: { current_dir: subdir } }, { CLAUDE_PROJECT_DIR: root }), /min:lite/);
  // No project dir anywhere: the old behaviour (current dir) is kept.
  assert.match(run({ workspace: { current_dir: subdir } }), /min:full/);
});

test('doctor flags outdated and missing guardrails for Claude Code and Codex', (t) => {
  const { root } = makeProject(t);
  const check = () => {
    const issues = [];
    const warnings = [];
    checkHooks(root, issues, warnings);
    return { issues, warnings };
  };

  writeJson(claudePath(root), {
    hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: LEGACY.guardrail }] }] },
    statusLine: { type: 'command', command: LEGACY.statusLine },
  });
  let { issues, warnings } = check();
  assert.ok(issues.some((i) => /Outdated git-guardrails/.test(i)), issues.join('\n'));
  assert.ok(warnings.some((w) => /Outdated dev-workflow statusLine/.test(w)), warnings.join('\n'));
  assert.ok(warnings.some((w) => /Missing git-guardrails hook in \.codex/.test(w)), warnings.join('\n'));

  installHooks(root);
  ({ issues, warnings } = check());
  assert.deepEqual(issues, []);
  assert.deepEqual(warnings, []);

  writeJson(codexPath(root), {
    hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: LEGACY.guardrail }] }] },
  });
  ({ warnings } = check());
  assert.ok(warnings.some((w) => /Outdated git-guardrails hook in \.codex/.test(w)), warnings.join('\n'));

  writeJson(claudePath(root), {});
  ({ issues } = check());
  assert.ok(issues.some((i) => /Missing git-guardrails/.test(i)));
});

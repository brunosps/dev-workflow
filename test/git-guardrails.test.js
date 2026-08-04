'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const hookPath = path.join(__dirname, '..', 'scaffold', 'scripts', 'hooks', 'git-guardrails.mjs');

function runHook(command, scriptPath = hookPath) {
  const payload = JSON.stringify({ tool_input: { command } });
  return execFileSync(process.execPath, [scriptPath], {
    cwd: path.join(__dirname, '..'),
    input: payload,
    encoding: 'utf8',
  }).trim();
}

function assertBlocked(command, scriptPath) {
  const stdout = runHook(command, scriptPath);
  assert.notEqual(stdout, '', `${command} should emit a deny decision`);

  const output = JSON.parse(stdout);
  assert.equal(
    output?.hookSpecificOutput?.permissionDecision,
    'deny',
    `${command} should be denied`
  );
  assert.match(
    output.hookSpecificOutput.permissionDecisionReason,
    /Blocked by dev-workflow git guardrails/
  );
}

function assertAllowed(command) {
  assert.equal(runHook(command), '', `${command} should be allowed`);
}

test('git guardrails block destructive wholesale restore and git history operations via CLI hook', () => {
  for (const command of [
    'git restore .',
    'git restore -- .',
    'git restore --staged --worktree .',
    'git restore --source=HEAD .',
    'git checkout .',
    'git checkout -- .',
    'git reset --hard',
    'git clean -xdf',
    'git push --force',
    'git push origin --delete b',
  ]) {
    assertBlocked(command);
  }
});

test('git guardrails allow normal inspection, normal push, and file-specific restore via CLI hook', () => {
  for (const command of [
    'git push origin main',
    'git status',
    'git restore src/index.js',
  ]) {
    assertAllowed(command);
  }
});

test('git guardrails still run when invoked from a path containing a space', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw hook space '));
  const copiedHook = path.join(tempDir, 'git-guardrails.mjs');
  fs.copyFileSync(hookPath, copiedHook);

  assertBlocked('git reset --hard HEAD~5', copiedHook);
});

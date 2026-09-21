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
    'git worktree remove --force ../proj-slug',
    'git worktree remove -f ../proj-slug',
  ]) {
    assertBlocked(command);
  }
});

test('git guardrails block the history and recovery-net operations too', () => {
  for (const command of [
    'git filter-branch --tree-filter "rm -f secret" HEAD',
    'git reflog expire --expire=now --all',
    'git gc --prune=now',
    'git stash drop',
    'git stash clear',
    'git branch -M main',
    'git update-ref -d refs/heads/feature',
  ]) {
    assertBlocked(command);
  }
});

// rebase and commit --amend are routine on unpushed work, and a command line cannot
// tell pushed from unpushed. Denying them would produce false denials often enough to
// train people into disabling the hook — which costs more than the cases it would catch.
// `.dw/references/invariants.md` carries the rule for the pushed case in prose.
test('git guardrails do not block operations that are routine on unpushed work', () => {
  for (const command of [
    'git rebase main',
    'git rebase -i HEAD~3',
    'git commit --amend --no-edit',
    'git stash',
    'git stash list',
    'git stash pop',
    'git gc',
    'git branch -m old-name new-name',
    'git update-ref refs/heads/feature HEAD',
  ]) {
    assert.equal(runHook(command), '', `${command} must not be denied`);
  }
});

test('git guardrails allow normal inspection, normal push, and file-specific restore via CLI hook', () => {
  for (const command of [
    'git push origin main',
    'git worktree remove ../proj-slug',
    'git worktree prune',
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

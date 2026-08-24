'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const script = path.join(__dirname, '..', 'scaffold', 'scripts', 'lib', 'worktree-gc.mjs');
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: GIT_ENV });
  assert.equal(r.status, 0, `git ${args.join(' ')} failed:\n${r.stderr}`);
  return r.stdout.trim();
}

function gc(cwd, ...args) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', env: GIT_ENV });
}

function makeRepo(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-worktree-gc-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const main = path.join(base, 'proj');
  fs.mkdirSync(main);
  git(main, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(main, 'README.md'), 'x\n');
  git(main, 'add', '.');
  git(main, 'commit', '-qm', 'init');
  return { base, main };
}

function commitFile(dir, name) {
  fs.writeFileSync(path.join(dir, name), `${name}\n`);
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', name);
}

test('worktree-gc create follows the ../<project>-<slug> convention and branches from base', (t) => {
  const { base, main } = makeRepo(t);
  const r = gc(main, 'create', 'alpha', '--no-prep');
  assert.equal(r.status, 0, r.stderr);
  const wt = path.join(base, 'proj-alpha');
  assert.ok(fs.existsSync(wt));
  assert.match(r.stdout, new RegExp(`WORKTREE=${wt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.equal(git(wt, 'rev-parse', '--abbrev-ref', 'HEAD'), 'feat/alpha');
  assert.equal(gc(main, 'create', 'alpha', '--no-prep').status, 1, 'duplicate slug must be refused');
  assert.equal(gc(main, 'create', 'bad slug', '--no-prep').status, 1, 'invalid slug must be refused');
});

test('worktree-gc list verdicts: merged+clean is REMOVABLE, unmerged and dirty are KEEP; clean --apply removes only REMOVABLE', (t) => {
  const { base, main } = makeRepo(t);
  for (const slug of ['merged', 'open', 'dirty']) assert.equal(gc(main, 'create', slug, '--no-prep').status, 0);
  commitFile(path.join(base, 'proj-merged'), 'a.txt');
  commitFile(path.join(base, 'proj-open'), 'b.txt');
  fs.writeFileSync(path.join(base, 'proj-dirty', 'z.txt'), 'z\n');
  git(main, 'merge', '-q', '--ff-only', 'feat/merged');

  const list = gc(main, 'list', '--json');
  assert.equal(list.status, 0, list.stderr);
  const report = JSON.parse(list.stdout);
  const byName = Object.fromEntries(report.worktrees.map((w) => [w.name, w]));
  assert.equal(byName['proj-merged'].verdict, 'REMOVABLE');
  assert.deepEqual(byName['proj-merged'].mergedInto, ['main']);
  assert.equal(byName['proj-open'].verdict, 'KEEP:unmerged');
  assert.equal(byName['proj-open'].ahead, 1);
  assert.equal(byName['proj-dirty'].verdict, 'KEEP:dirty');
  assert.equal(gc(main, 'list', '--strict').status, 3, 'strict must fail while REMOVABLE leftovers exist');

  const dry = gc(main, 'clean');
  assert.equal(dry.status, 0);
  assert.match(dry.stdout, /DRY-RUN — nothing removed/);
  assert.ok(fs.existsSync(path.join(base, 'proj-merged')), 'dry-run must not remove');

  const apply = gc(main, 'clean', '--apply');
  assert.equal(apply.status, 0, apply.stderr);
  assert.ok(!fs.existsSync(path.join(base, 'proj-merged')), 'REMOVABLE worktree must be removed');
  assert.ok(fs.existsSync(path.join(base, 'proj-open')), 'unmerged worktree must be kept');
  assert.ok(fs.existsSync(path.join(base, 'proj-dirty')), 'dirty worktree must be kept');
  const branches = git(main, 'branch', '--format=%(refname:short)').split('\n');
  assert.ok(!branches.includes('feat/merged'), 'merged branch must be deleted');
  assert.ok(branches.includes('feat/open') && branches.includes('feat/dirty'));
  assert.equal(gc(main, 'list', '--strict').status, 0, 'strict passes once leftovers are gone');
});

test('worktree-gc clean --older-than keeps recently merged worktrees; --keep-branches preserves branches', (t) => {
  const { base, main } = makeRepo(t);
  assert.equal(gc(main, 'create', 'fresh', '--no-prep').status, 0);
  commitFile(path.join(base, 'proj-fresh'), 'f.txt');
  git(main, 'merge', '-q', '--ff-only', 'feat/fresh');
  const recent = JSON.parse(gc(main, 'list', '--json').stdout).worktrees[0];
  assert.equal(recent.verdict, 'REMOVABLE');
  const aged = gc(main, 'clean', '--apply', '--older-than', '30');
  assert.equal(aged.status, 0, aged.stderr);
  assert.ok(fs.existsSync(path.join(base, 'proj-fresh')), 'recent merged worktree must survive --older-than');
  const kept = gc(main, 'clean', '--apply', '--keep-branches');
  assert.equal(kept.status, 0, kept.stderr);
  assert.ok(!fs.existsSync(path.join(base, 'proj-fresh')));
  assert.ok(git(main, 'branch', '--format=%(refname:short)').split('\n').includes('feat/fresh'), '--keep-branches must keep the branch');
});

test('worktree-gc merge does ff-only merge + remove + branch delete, and refuses dirty, in-use-free non-ff, and off-base states', (t) => {
  const { base, main } = makeRepo(t);
  assert.equal(gc(main, 'create', 'ok', '--no-prep').status, 0);
  assert.equal(gc(main, 'create', 'dirty', '--no-prep').status, 0);
  commitFile(path.join(base, 'proj-ok'), 'ok.txt');
  fs.writeFileSync(path.join(base, 'proj-dirty', 'z.txt'), 'z\n');

  const refusedDirty = gc(main, 'merge', 'dirty');
  assert.equal(refusedDirty.status, 1);
  assert.match(refusedDirty.stderr, /uncommitted changes/);
  assert.ok(fs.existsSync(path.join(base, 'proj-dirty')));

  const merged = gc(main, 'merge', 'ok');
  assert.equal(merged.status, 0, merged.stderr);
  assert.ok(!fs.existsSync(path.join(base, 'proj-ok')), 'merged worktree must be removed in the same call');
  assert.ok(fs.existsSync(path.join(main, 'ok.txt')), 'main must contain the merged file');
  assert.ok(!git(main, 'branch', '--format=%(refname:short)').split('\n').includes('feat/ok'));

  // Diverged branch → non-ff → refused, nothing removed.
  assert.equal(gc(main, 'create', 'diverged', '--no-prep').status, 0);
  commitFile(path.join(base, 'proj-diverged'), 'd.txt');
  commitFile(main, 'm.txt');
  const nonFf = gc(main, 'merge', 'diverged');
  assert.equal(nonFf.status, 1);
  assert.match(nonFf.stderr, /ff-only merge .* refused/);
  assert.ok(fs.existsSync(path.join(base, 'proj-diverged')));

  // Main checkout off the base branch → refused before touching anything.
  git(main, 'checkout', '-q', '-b', 'scratch');
  const offBase = gc(main, 'merge', 'diverged');
  assert.equal(offBase.status, 1);
  assert.match(offBase.stderr, /is on scratch, not main/);
});

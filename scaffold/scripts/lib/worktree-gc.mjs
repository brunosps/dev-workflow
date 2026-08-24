#!/usr/bin/env node
/**
 * dev-workflow worktree GC — deterministic lifecycle for delegation worktrees.
 *
 * The dw-*-run adapters create one git worktree per delegated task next to the
 * main checkout (`../<project>-<slug>`). Left alone, merged worktrees pile up
 * with their node_modules/build output (tens of GB). This script is the hard
 * enforcement behind `/dw-worktree`: it lists every secondary worktree with a
 * verdict, removes ONLY the ones proven safe (merged into an integration branch,
 * clean, not in use, not locked), and never uses --force.
 *
 *   node .dw/scripts/lib/worktree-gc.mjs list   [--base <branch>] [--json] [--strict]
 *   node .dw/scripts/lib/worktree-gc.mjs clean  [--base <branch>] [--apply] [--older-than <days>] [--keep-branches]
 *   node .dw/scripts/lib/worktree-gc.mjs create <slug> [--branch <name>] [--base <branch>] [--no-prep]
 *   node .dw/scripts/lib/worktree-gc.mjs merge  <slug|path> [--base <branch>] [--keep-branches]
 *   node .dw/scripts/lib/worktree-gc.mjs prune
 *
 * Verdicts: REMOVABLE · KEEP:unmerged · KEEP:dirty · KEEP:in-use · KEEP:locked ·
 * KEEP:recent (only with --older-than) · PRUNABLE (directory gone → `git worktree prune`).
 *
 * `clean` is a DRY-RUN unless --apply is passed. `merge` is the safe order from the
 * main checkout: ff-only merge → worktree remove → branch delete → prune. Both refuse
 * anything that is not proven safe and say why. Exit codes: 0 ok · 1 usage/abort ·
 * 2 prep failed (worktree created but the delegate would run blind) · 3 `list --strict`
 * found REMOVABLE leftovers.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, readlinkSync, statfsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const INTEGRATION_DEFAULTS = ['develop', 'main', 'master'];

function git(cwd, args, { allowFail = false } = {}) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  const out = (r.stdout || '').trim();
  const err = (r.stderr || '').trim();
  if (r.status !== 0 && !allowFail) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${err || out}`);
  }
  return { ok: r.status === 0, out, err };
}

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (['base', 'branch', 'older-than'].includes(key)) {
        if (next === undefined || next.startsWith('--')) throw new Error(`--${key} needs a value`);
        args.flags[key] = next;
        i++;
      } else {
        args.flags[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function mainCheckout(cwd) {
  const { out } = git(cwd, ['worktree', 'list', '--porcelain']);
  const first = out.split('\n').find((l) => l.startsWith('worktree '));
  if (!first) throw new Error('not inside a git repository');
  return first.slice('worktree '.length);
}

function parseWorktrees(main) {
  const { out } = git(main, ['worktree', 'list', '--porcelain']);
  const entries = [];
  let cur = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('worktree ')) {
      cur = { path: line.slice(9), head: null, branch: null, detached: false, bare: false, locked: null, prunable: null };
      entries.push(cur);
    } else if (!cur || !line.trim()) {
      continue;
    } else if (line.startsWith('HEAD ')) cur.head = line.slice(5);
    else if (line.startsWith('branch ')) cur.branch = line.slice(7).replace(/^refs\/heads\//, '');
    else if (line === 'detached') cur.detached = true;
    else if (line === 'bare') cur.bare = true;
    else if (line.startsWith('locked')) cur.locked = line.slice(6).trim() || 'locked';
    else if (line.startsWith('prunable')) cur.prunable = line.slice(8).trim() || 'prunable';
  }
  return entries;
}

function readConfig(main) {
  try {
    const cfg = JSON.parse(readFileSync(join(main, '.dw', 'config.json'), 'utf8'));
    return cfg && typeof cfg === 'object' ? cfg.worktree || {} : {};
  } catch {
    return {};
  }
}

function branchExists(main, name) {
  return git(main, ['show-ref', '--verify', '--quiet', `refs/heads/${name}`], { allowFail: true }).ok;
}

function integrationBranches(main, baseFlag) {
  const cfg = readConfig(main);
  const originHead = git(main, ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'], { allowFail: true });
  const candidates = [
    baseFlag,
    process.env.DW_WORKTREE_BASE,
    cfg.base,
    originHead.ok ? originHead.out.replace(/^origin\//, '') : null,
    ...INTEGRATION_DEFAULTS,
  ].filter(Boolean);
  const seen = new Set();
  const result = [];
  for (const c of candidates) {
    if (seen.has(c)) continue;
    seen.add(c);
    if (branchExists(main, c)) result.push(c);
  }
  if (baseFlag && !result.includes(baseFlag)) throw new Error(`--base ${baseFlag}: no such local branch`);
  if (result.length === 0) throw new Error('no integration branch found (tried --base, DW_WORKTREE_BASE, .dw/config.json worktree.base, origin/HEAD, develop, main, master)');
  return result;
}

function processesIn(path) {
  const found = [];
  if (process.platform !== 'linux') return found;
  let pids = [];
  try {
    pids = readdirSync('/proc').filter((d) => /^\d+$/.test(d));
  } catch {
    return found;
  }
  for (const pid of pids) {
    if (Number(pid) === process.pid) continue;
    try {
      const cwd = readlinkSync(`/proc/${pid}/cwd`);
      if (cwd === path || cwd.startsWith(path + '/')) {
        let cmd = '';
        try {
          cmd = readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim().slice(0, 80);
        } catch {
          cmd = '?';
        }
        found.push({ pid: Number(pid), cmd });
      }
    } catch {
      // process vanished or not ours — ignore
    }
  }
  return found;
}

function sizeKb(path) {
  const r = spawnSync('du', ['-sk', path], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const n = parseInt(r.stdout.split('\t')[0], 10);
  return Number.isFinite(n) ? n : null;
}

function humanKb(kb) {
  if (kb === null || kb === undefined) return '-';
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)}G`;
  if (kb >= 1024) return `${Math.round(kb / 1024)}M`;
  return `${kb}K`;
}

function inspect(main, { base, olderThan, withSize = true } = {}) {
  const integration = integrationBranches(main, base);
  const primary = integration[0];
  const entries = parseWorktrees(main).filter((e) => e.path !== main && !e.bare);
  const now = Math.floor(Date.now() / 1000);
  return {
    main,
    integration,
    worktrees: entries.map((e) => {
      const exists = existsSync(e.path);
      const mergedInto = e.head
        ? integration.filter((b) => git(main, ['merge-base', '--is-ancestor', e.head, b], { allowFail: true }).ok)
        : [];
      const ahead = e.head ? parseInt(git(main, ['rev-list', '--count', `${primary}..${e.head}`], { allowFail: true }).out || '0', 10) : 0;
      const dirty = exists ? git(e.path, ['status', '--porcelain'], { allowFail: true }).out.split('\n').filter(Boolean).length : null;
      const lastCommit = e.head ? parseInt(git(main, ['log', '-1', '--format=%ct', e.head], { allowFail: true }).out || '0', 10) : 0;
      const ageDays = lastCommit ? Math.floor((now - lastCommit) / 86400) : null;
      const procs = exists ? processesIn(e.path) : [];
      const size = exists && withSize ? sizeKb(e.path) : null;

      let verdict;
      let reason;
      if (!exists || e.prunable) {
        verdict = 'PRUNABLE';
        reason = e.prunable || 'directory missing';
      } else if (e.locked) {
        verdict = 'KEEP:locked';
        reason = e.locked;
      } else if (procs.length) {
        verdict = 'KEEP:in-use';
        reason = procs.map((p) => `${p.pid} ${p.cmd}`).join('; ');
      } else if (dirty > 0) {
        verdict = 'KEEP:dirty';
        reason = `${dirty} uncommitted file(s)`;
      } else if (mergedInto.length === 0) {
        verdict = 'KEEP:unmerged';
        reason = `${ahead} commit(s) ahead of ${primary}, merged into none of [${integration.join(', ')}]`;
      } else if (olderThan !== undefined && ageDays !== null && ageDays < olderThan) {
        verdict = 'KEEP:recent';
        reason = `merged but last commit ${ageDays}d ago (< ${olderThan}d)`;
      } else {
        verdict = 'REMOVABLE';
        reason = `merged into ${mergedInto.join(', ')}; clean; no process inside`;
      }
      return {
        name: basename(e.path),
        path: e.path,
        branch: e.branch,
        detached: e.detached,
        head: e.head,
        mergedInto,
        ahead,
        dirty,
        ageDays,
        sizeKb: size,
        procs,
        locked: e.locked,
        verdict,
        reason,
      };
    }),
  };
}

function printTable(report) {
  const rows = report.worktrees;
  console.log(`main checkout: ${report.main}`);
  console.log(`integration branches: ${report.integration.join(', ')} (primary: ${report.integration[0]})`);
  if (!rows.length) {
    console.log('no secondary worktrees.');
    return;
  }
  const w = Math.max(...rows.map((r) => r.name.length), 8);
  const b = Math.max(...rows.map((r) => (r.branch || '(detached)').length), 6);
  console.log(`${'worktree'.padEnd(w)}  ${'branch'.padEnd(b)}  ${'size'.padStart(6)}  age   dirty  verdict         reason`);
  for (const r of rows) {
    console.log(
      `${r.name.padEnd(w)}  ${(r.branch || '(detached)').padEnd(b)}  ${humanKb(r.sizeKb).padStart(6)}  ${String(r.ageDays ?? '-').padStart(3)}d  ${String(r.dirty ?? '-').padStart(5)}  ${r.verdict.padEnd(15)} ${r.reason}`
    );
  }
  const removable = rows.filter((r) => r.verdict === 'REMOVABLE');
  const freed = removable.reduce((s, r) => s + (r.sizeKb || 0), 0);
  console.log(`\n${rows.length} worktree(s): ${removable.length} REMOVABLE (~${humanKb(freed)} apparent), ${rows.filter((r) => r.verdict === 'PRUNABLE').length} PRUNABLE, ${rows.length - removable.length - rows.filter((r) => r.verdict === 'PRUNABLE').length} KEEP`);
}

function deleteBranch(main, r, keepBranches) {
  if (!r.branch || keepBranches) return 'kept';
  // A branch checked out in another worktree cannot be deleted.
  const stillUsed = parseWorktrees(main).some((e) => e.branch === r.branch);
  if (stillUsed) return 'kept (checked out elsewhere)';
  const soft = git(main, ['branch', '-d', r.branch], { allowFail: true });
  if (soft.ok) return 'deleted';
  // `-d` only trusts HEAD/upstream. We already proved the branch head is an ancestor
  // of an integration branch, so the commits are preserved — delete with that evidence.
  if (r.mergedInto.length && r.head && git(main, ['merge-base', '--is-ancestor', r.head, r.mergedInto[0]], { allowFail: true }).ok) {
    const hard = git(main, ['branch', '-D', r.branch], { allowFail: true });
    return hard.ok ? `deleted (verified merged into ${r.mergedInto[0]})` : `kept (${hard.err})`;
  }
  return `kept (${soft.err})`;
}

function removeWorktree(main, r, keepBranches) {
  // Never --force: a dirty or locked worktree is a KEEP verdict and never reaches here.
  const rm = git(main, ['worktree', 'remove', r.path], { allowFail: true });
  if (!rm.ok) return { removed: false, detail: rm.err };
  const branch = deleteBranch(main, r, keepBranches);
  return { removed: true, detail: `branch ${r.branch || '(detached)'}: ${branch}` };
}

function diskFree(path) {
  try {
    const s = statfsSync(path);
    const free = (Number(s.bavail) * Number(s.bsize)) / 1024 / 1024 / 1024;
    return `${free.toFixed(1)}G free on the filesystem of ${path}`;
  } catch {
    return null;
  }
}

function cmdList(main, flags) {
  const report = inspect(main, { base: flags.base });
  if (flags.json) console.log(JSON.stringify(report, null, 2));
  else printTable(report);
  if (flags.strict && report.worktrees.some((r) => r.verdict === 'REMOVABLE' || r.verdict === 'PRUNABLE')) process.exit(3);
}

function cmdClean(main, flags) {
  const olderThan = flags['older-than'] !== undefined ? parseInt(flags['older-than'], 10) : undefined;
  if (olderThan !== undefined && !Number.isFinite(olderThan)) throw new Error('--older-than needs a number of days');
  const report = inspect(main, { base: flags.base, olderThan });
  printTable(report);
  const targets = report.worktrees.filter((r) => r.verdict === 'REMOVABLE');
  const prunable = report.worktrees.filter((r) => r.verdict === 'PRUNABLE');
  if (!flags.apply) {
    console.log(`\nDRY-RUN — nothing removed. Re-run with --apply to remove the ${targets.length} REMOVABLE worktree(s)${prunable.length ? ` and prune ${prunable.length} stale entry(ies)` : ''}.`);
    return;
  }
  let freed = 0;
  console.log('');
  for (const r of targets) {
    const res = removeWorktree(main, r, flags['keep-branches']);
    if (res.removed) {
      freed += r.sizeKb || 0;
      console.log(`removed  ${r.path}  (${humanKb(r.sizeKb)}; ${res.detail})`);
    } else {
      console.log(`FAILED   ${r.path}  ${res.detail}`);
    }
  }
  const pruned = git(main, ['worktree', 'prune', '-v'], { allowFail: true });
  if (pruned.out) console.log(pruned.out);
  const kept = report.worktrees.filter((r) => r.verdict.startsWith('KEEP'));
  console.log(`\nremoved ${targets.length} worktree(s), ~${humanKb(freed)} apparent; kept ${kept.length}${kept.length ? ': ' + kept.map((r) => `${r.name} (${r.verdict})`).join(', ') : ''}`);
  const free = diskFree(dirname(main));
  if (free) console.log(free);
}

function detectPrep(worktreePath) {
  const has = (f) => existsSync(join(worktreePath, f));
  const cmds = [];
  if (has('pnpm-lock.yaml')) cmds.push('pnpm install --frozen-lockfile --prefer-offline');
  else if (has('package-lock.json')) cmds.push('npm ci --prefer-offline');
  else if (has('yarn.lock')) cmds.push('yarn install --frozen-lockfile');
  else if (has('bun.lockb') || has('bun.lock')) cmds.push('bun install --frozen-lockfile');
  if (has('uv.lock')) cmds.push('uv sync --frozen');
  if (cmds.length && has('package.json')) {
    try {
      const pkg = JSON.parse(readFileSync(join(worktreePath, 'package.json'), 'utf8'));
      if (pkg.scripts && pkg.scripts['build:packages']) {
        const runner = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('bun.lockb') || has('bun.lock') ? 'bun run' : 'npm run';
        cmds.push(`${runner} build:packages`);
      }
    } catch {
      // unreadable package.json — skip the build step
    }
  }
  return cmds;
}

function cmdCreate(main, args) {
  const slug = args._[1];
  if (!slug || !/^[A-Za-z0-9._-]+$/.test(slug)) throw new Error('create needs a <slug> matching [A-Za-z0-9._-]+');
  const integration = integrationBranches(main, args.flags.base);
  const base = integration[0];
  const branch = args.flags.branch || `feat/${slug}`;
  const path = join(dirname(main), `${basename(main)}-${slug}`);
  if (existsSync(path)) throw new Error(`${path} already exists — reuse it or pick another slug`);
  if (branchExists(main, branch)) {
    git(main, ['worktree', 'add', path, branch]);
  } else {
    git(main, ['worktree', 'add', '-b', branch, path, base]);
  }
  console.log(`created ${path} on ${branch} (from ${base})`);
  const cfg = readConfig(main);
  const prep = args.flags['no-prep'] ? [] : Array.isArray(cfg.prep) ? cfg.prep : detectPrep(path);
  for (const cmd of prep) {
    console.log(`prep: ${cmd}`);
    const r = spawnSync(cmd, { cwd: path, shell: true, stdio: 'inherit' });
    if (r.status !== 0) {
      console.error(`PREP FAILED (${cmd}) — the worktree exists but a delegate would run blind. Fix it before dispatching.`);
      process.exit(2);
    }
  }
  if (!prep.length) console.log('prep: none (no lockfile detected; set .dw/config.json worktree.prep to override)');
  console.log(`WORKTREE=${path}`);
}

function resolveTarget(main, ref) {
  if (!ref) throw new Error('merge needs a <slug|path>');
  const entries = parseWorktrees(main).filter((e) => e.path !== main);
  const abs = resolve(ref);
  return (
    entries.find((e) => e.path === abs) ||
    entries.find((e) => basename(e.path) === ref) ||
    entries.find((e) => basename(e.path) === `${basename(main)}-${ref}`) ||
    entries.find((e) => e.branch === ref)
  );
}

function cmdMerge(main, args) {
  const target = resolveTarget(main, args._[1]);
  if (!target) throw new Error(`no worktree matches "${args._[1]}" (try the folder name, slug, path, or branch)`);
  if (!target.branch) throw new Error(`${target.path} is detached — nothing to merge`);
  const integration = integrationBranches(main, args.flags.base);
  const base = integration[0];
  const mainBranch = git(main, ['rev-parse', '--abbrev-ref', 'HEAD']).out;
  if (mainBranch !== base) {
    throw new Error(`main checkout is on ${mainBranch}, not ${base}. Switch it yourself (git -C ${main} checkout ${base}) or pass --base ${mainBranch}; this tool never changes the owner's active branch.`);
  }
  if (git(main, ['status', '--porcelain']).out) throw new Error(`main checkout ${main} has uncommitted changes — commit or stash before merging`);
  const dirty = git(target.path, ['status', '--porcelain']).out;
  if (dirty) throw new Error(`${target.path} has uncommitted changes:\n${dirty}\nCommit them in the worktree first (nothing is merged or removed).`);
  const procs = processesIn(target.path);
  if (procs.length) throw new Error(`${target.path} is in use by: ${procs.map((p) => `${p.pid} ${p.cmd}`).join('; ')} — stop them first`);

  const merge = git(main, ['merge', '--ff-only', target.branch], { allowFail: true });
  if (!merge.ok) {
    throw new Error(`ff-only merge of ${target.branch} into ${base} refused: ${merge.err || merge.out}\nRebase inside the worktree (git -C ${target.path} rebase ${base}), re-run the gate, then merge again. Nothing was removed.`);
  }
  console.log(`merged ${target.branch} into ${base} (ff-only): ${git(main, ['rev-parse', '--short', 'HEAD']).out}`);
  const row = { path: target.path, branch: target.branch, head: target.head, mergedInto: [base], sizeKb: sizeKb(target.path) };
  const res = removeWorktree(main, row, args.flags['keep-branches']);
  if (!res.removed) throw new Error(`merged, but could not remove ${target.path}: ${res.detail}`);
  git(main, ['worktree', 'prune'], { allowFail: true });
  console.log(`removed ${target.path} (${humanKb(row.sizeKb)}; ${res.detail}); worktrees pruned`);
  const free = diskFree(dirname(main));
  if (free) console.log(free);
}

function usage() {
  console.log(`usage:
  worktree-gc.mjs list   [--base <branch>] [--json] [--strict]
  worktree-gc.mjs clean  [--base <branch>] [--apply] [--older-than <days>] [--keep-branches]
  worktree-gc.mjs create <slug> [--branch <name>] [--base <branch>] [--no-prep]
  worktree-gc.mjs merge  <slug|path> [--base <branch>] [--keep-branches]
  worktree-gc.mjs prune`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.flags.help) {
    usage();
    process.exit(cmd ? 0 : 1);
  }
  const root = mainCheckout(process.cwd());
  switch (cmd) {
    case 'list':
      return cmdList(root, args.flags);
    case 'clean':
      return cmdClean(root, args.flags);
    case 'create':
      return cmdCreate(root, args);
    case 'merge':
      return cmdMerge(root, args);
    case 'prune': {
      const r = git(root, ['worktree', 'prune', '-v'], { allowFail: true });
      console.log(r.out || 'nothing to prune');
      return;
    }
    default:
      usage();
      process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(`worktree-gc: ${err.message}`);
  process.exit(1);
}

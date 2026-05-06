const fs = require('fs');
const path = require('path');

/**
 * One-shot GSD migration. Detects legacy GSD artifacts in a project,
 * migrates the parts dev-workflow now provides natively, and removes
 * the rest.
 *
 * Idempotent: returns silently when nothing to do.
 *
 * Run automatically from lib/init.js when mode === 'update'.
 */
function migrate(projectRoot) {
  const planning = path.join(projectRoot, '.planning');
  const dotClaude = path.join(projectRoot, '.claude');
  const claudeCmdsGsd = path.join(dotClaude, 'commands', 'gsd');
  const claudeManifest = path.join(dotClaude, 'gsd-file-manifest.json');

  const hasPlanning = fs.existsSync(planning);
  const hasGsdCmds = fs.existsSync(claudeCmdsGsd);
  const hasGsdManifest = fs.existsSync(claudeManifest);

  // Detect any gsd-* file in .claude/agents/ or .claude/hooks/
  const gsdAgents = listMatching(path.join(dotClaude, 'agents'), /^gsd-.*\.md$/);
  const gsdHooks = listMatching(path.join(dotClaude, 'hooks'), /^gsd-.*\.(js|cjs|mjs)$/);

  const detected =
    hasPlanning || hasGsdCmds || hasGsdManifest || gsdAgents.length > 0 || gsdHooks.length > 0;

  if (!detected) return null; // nothing to migrate

  console.log('\n  GSD legacy artifacts detected — migrating to dev-workflow native namespace.');

  const stats = {
    intel_files: 0,
    state_migrated: false,
    quick_files: 0,
    threads_files: 0,
    planning_archived: false,
    cmds_removed: false,
    agents_removed: 0,
    hooks_removed: 0,
    manifest_removed: false,
  };

  // 1. Migrate .planning/intel/* → .dw/intel/*
  if (hasPlanning) {
    const planningIntel = path.join(planning, 'intel');
    if (fs.existsSync(planningIntel)) {
      const dwIntel = path.join(projectRoot, '.dw', 'intel');
      stats.intel_files = copyDirRecursive(planningIntel, dwIntel);
    }

    // 2. Migrate .planning/STATE.md → .dw/spec/active-session.md
    const stateFile = path.join(planning, 'STATE.md');
    if (fs.existsSync(stateFile)) {
      const target = path.join(projectRoot, '.dw', 'spec', 'active-session.md');
      ensureDir(path.dirname(target));
      fs.copyFileSync(stateFile, target);
      stats.state_migrated = true;
    }

    // 3. Migrate .planning/quick/* → .dw/spec/quick/*
    const planningQuick = path.join(planning, 'quick');
    if (fs.existsSync(planningQuick)) {
      const dwQuick = path.join(projectRoot, '.dw', 'spec', 'quick');
      stats.quick_files = copyDirRecursive(planningQuick, dwQuick);
    }

    // 4. Migrate .planning/threads/* → .dw/threads/*
    const planningThreads = path.join(planning, 'threads');
    if (fs.existsSync(planningThreads)) {
      const dwThreads = path.join(projectRoot, '.dw', 'threads');
      stats.threads_files = copyDirRecursive(planningThreads, dwThreads);
    }

    // 5. Rename .planning/ → .planning.gsd-archive-<DATE>/ (preserve for inspection)
    const date = new Date().toISOString().split('T')[0];
    const archive = path.join(projectRoot, `.planning.gsd-archive-${date}`);
    if (!fs.existsSync(archive)) {
      try {
        fs.renameSync(planning, archive);
        stats.planning_archived = true;
      } catch (err) {
        console.log(`    \x1b[33m! Could not rename .planning → ${path.basename(archive)}: ${err.message}\x1b[0m`);
      }
    } else {
      console.log(`    \x1b[33m! Archive ${path.basename(archive)} already exists; leaving .planning/ in place\x1b[0m`);
    }
  }

  // 6. Remove .claude/commands/gsd/
  if (hasGsdCmds) {
    rmRecursive(claudeCmdsGsd);
    stats.cmds_removed = true;
  }

  // 7. Remove .claude/agents/gsd-*.md
  for (const file of gsdAgents) {
    fs.unlinkSync(path.join(dotClaude, 'agents', file));
    stats.agents_removed++;
  }

  // 8. Remove .claude/hooks/gsd-*.js
  for (const file of gsdHooks) {
    fs.unlinkSync(path.join(dotClaude, 'hooks', file));
    stats.hooks_removed++;
  }

  // 9. Remove .claude/gsd-file-manifest.json
  if (hasGsdManifest) {
    fs.unlinkSync(claudeManifest);
    stats.manifest_removed = true;
  }

  // 10. Print summary
  console.log('  Migration summary:');
  if (stats.intel_files) console.log(`    + .dw/intel/                   (${stats.intel_files} files migrated from .planning/intel/)`);
  if (stats.state_migrated) console.log('    + .dw/spec/active-session.md   (migrated from .planning/STATE.md)');
  if (stats.quick_files) console.log(`    + .dw/spec/quick/              (${stats.quick_files} files migrated from .planning/quick/)`);
  if (stats.threads_files) console.log(`    + .dw/threads/                 (${stats.threads_files} files migrated from .planning/threads/)`);
  if (stats.planning_archived) console.log(`    ~ .planning/                   (renamed to .planning.gsd-archive-${new Date().toISOString().split('T')[0]}/ — review and delete when ready)`);
  if (stats.cmds_removed) console.log('    - .claude/commands/gsd/        (removed; native /dw-* commands cover the use cases)');
  if (stats.agents_removed) console.log(`    - .claude/agents/gsd-*.md      (${stats.agents_removed} files removed; native dw-* agents bundled in skills)`);
  if (stats.hooks_removed) console.log(`    - .claude/hooks/gsd-*.js       (${stats.hooks_removed} files removed; not used by dev-workflow)`);
  if (stats.manifest_removed) console.log('    - .claude/gsd-file-manifest.json (removed)');
  console.log('  Done. Native /dw-intel, /dw-map-codebase, /dw-execute-phase, /dw-plan-checker, /dw-resume now provide what GSD provided.');
  console.log();

  return stats;
}

function listMatching(dir, regex) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => regex.test(name));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dst) {
  if (!fs.existsSync(src)) return 0;
  ensureDir(dst);
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, dstPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, dstPath);
      count++;
    }
  }
  return count;
}

function rmRecursive(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

module.exports = { migrate };

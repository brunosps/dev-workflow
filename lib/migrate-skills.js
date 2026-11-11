const fs = require('fs');
const path = require('path');
const { COMMANDS } = require('./constants');
const removedSkills = require('./removed-bundled-skills');
const removedCommands = require('./removed-commands');
const { BUNDLED_SKILLS_REL, LEGACY_BUNDLED_SKILLS_REL } = require('./skill-registry');

const MIGRATED_REL = path.join('.dw', '.migrated');

/**
 * Cleanup-on-update for dev-workflow.
 *
 * Nothing is deleted outright: every path this module retires is MOVED to
 * `.dw/.migrated/<timestamp>/<original relative path>`, and the destination is
 * printed. A direct `npx … update` from a terminal takes no snapshot (only the
 * `/dw-update` agent command does), so this move is the only copy those users get.
 *
 * Scans:
 *
 * 1. Removed bundled skills (data-driven from `removed-bundled-skills.js`):
 *    `.dw/skills/<name>/` and legacy `.agents/skills/<name>/` directories named in
 *    the manifest of skills removed in past releases. Matched by name only: a
 *    same-named skill from elsewhere is moved too, which is why it is a move.
 *
 * 1.5. Relocated bundled skills: releases up to 2.6.0 installed the bundled
 *    skills under `.agents/skills/`, where Codex, Copilot and OpenCode list them
 *    as model-invocable. They now live in `.dw/skills/`. A legacy copy is retired
 *    only when `classifyLegacySkill` says it is ours; otherwise it is kept and
 *    reported. Files in an ours-copy that dev-workflow never installed are named
 *    in the output so the team can bring them back from the move destination.
 *
 * 2. Orphan command wrappers (state-comparison vs `constants.js`):
 *    `.claude/skills/dw-*`, `.agents/skills/dw-*` and `.opencode/commands/dw-*.md`
 *    whose base name is NOT a current command or bundled skill. `dw-` is this
 *    package's namespace; a user skill named `dw-*` is moved, not lost.
 *
 * Idempotent: silent when nothing to clean.
 *
 * Run from lib/init.js on update/repair/re-init, AFTER the bundled skills were
 * copied to `.dw/skills/`, so an interrupted update never leaves a project with
 * neither copy.
 */
function migrate(projectRoot, { priorState = null, stamp = timestamp() } = {}) {
  const managed = managedSet(priorState);
  const removed = scanRemovedBundledSkills(projectRoot);
  const relocated = scanRelocatedBundledSkills(projectRoot, managed);
  const orphans = scanOrphanCommandWrappers(projectRoot);
  const commandSources = scanRemovedCommandSources(projectRoot);

  if (
    removed.length === 0 &&
    relocated.length === 0 &&
    orphans.length === 0 &&
    commandSources.length === 0
  ) {
    return null; // silent — nothing to clean
  }

  console.log('\n  Skill migration:');
  let moved = 0;
  const retire = (target) => {
    moveToBackup(projectRoot, target, stamp);
    moved += 1;
  };

  for (const entry of removed) {
    console.log(
      `    \x1b[33m-\x1b[0m [v${entry.removedIn}] Retiring legacy skill ${path.relative(projectRoot, entry.path)} (replaced by ${entry.replacedBy})`
    );
    retire(entry.path);
  }

  let relocatedCount = 0;
  for (const entry of relocated) {
    const rel = path.relative(projectRoot, entry.path);
    if (entry.ours) {
      console.log(`    \x1b[33m-\x1b[0m [moved] Retiring ${rel} (bundled skills now live in ${BUNDLED_SKILLS_REL}/)`);
      for (const file of entry.foreign) {
        console.log(`        ! ${path.join(rel, file)} was not installed by dev-workflow; it is in the backup below`);
      }
      retire(entry.path);
      relocatedCount += 1;
    } else {
      console.log(
        `    \x1b[36m!\x1b[0m [kept] ${rel} has a bundled skill's name but is not a dev-workflow copy (${entry.reason}); left in place`
      );
    }
  }

  // Pre-build a map { commandName -> { removedIn, replacedBy } } for friendly messaging.
  const removedCommandMap = new Map(removedCommands.map((r) => [r.name, r]));

  for (const entry of orphans) {
    const rel = path.relative(projectRoot, entry.path);
    const baseName = entry.commandName;
    const known = baseName ? removedCommandMap.get(baseName) : null;
    const suffix = known
      ? `(replaced in v${known.removedIn} by \`${known.replacedBy}\`)`
      : `(command no longer exists)`;
    console.log(`    \x1b[33m-\x1b[0m [orphan] Retiring wrapper ${rel} ${suffix}`);
    retire(entry.path);
  }

  for (const entry of commandSources) {
    const rel = path.relative(projectRoot, entry.path);
    console.log(
      `    \x1b[33m-\x1b[0m [legacy] Retiring command source ${rel} (replaced in v${entry.removedIn} by \`${entry.replacedBy}\`)`
    );
    retire(entry.path);
  }

  if (moved > 0) {
    console.log(`    Moved ${moved} path(s) to ${path.join(MIGRATED_REL, stamp)}/ — copy back anything you want to keep.`);
  }
  console.log();
  return {
    removed: removed.length,
    relocated: relocatedCount,
    orphans: orphans.length,
    commandSources: commandSources.length,
    backup: moved > 0 ? path.join(projectRoot, MIGRATED_REL, stamp) : null,
  };
}

function scanRemovedBundledSkills(projectRoot) {
  const matches = [];
  for (const rel of [BUNDLED_SKILLS_REL, LEGACY_BUNDLED_SKILLS_REL]) {
    const skillsDir = path.join(projectRoot, rel);
    if (!fs.existsSync(skillsDir)) continue;
    for (const entry of removedSkills) {
      const target = path.join(skillsDir, entry.name);
      if (fs.existsSync(target)) {
        matches.push({ ...entry, path: target });
      }
    }
  }
  return matches;
}

function scanRelocatedBundledSkills(projectRoot, managed) {
  const matches = [];
  const legacyDir = path.join(projectRoot, LEGACY_BUNDLED_SKILLS_REL);
  if (!fs.existsSync(legacyDir)) return matches;

  for (const name of listScaffoldSkillDirs()) {
    const target = path.join(legacyDir, name);
    let stat;
    try {
      stat = fs.statSync(target);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    matches.push({ name, path: target, ...classifyLegacySkill(projectRoot, name, managed) });
  }
  return matches;
}

/**
 * Is `.agents/skills/<name>/` the copy a release up to 2.6.0 installed?
 *
 * - Its SKILL.md must carry the Structured Return contract every bundled skill
 *   has (`**Status:**` and `**Next Step:**`). Without it: not ours.
 * - When the prior install state tracked files, its SKILL.md must be one of
 *   them. A same-named skill installed after the last update is not, even if its
 *   SKILL.md happens to use the same two labels.
 * - With no tracked files (installs older than install-state), the contract
 *   check alone decides.
 *
 * For an ours-copy, `foreign` lists files dev-workflow neither tracked nor ships
 * (a team's addition, or a file from an older release), relative to the dir.
 */
function classifyLegacySkill(projectRoot, name, managed = new Set()) {
  const dir = path.join(projectRoot, LEGACY_BUNDLED_SKILLS_REL, name);
  if (!isDevWorkflowSkillCopy(dir)) return { ours: false, reason: 'no Structured Return contract', foreign: [] };
  const relDir = path.join(LEGACY_BUNDLED_SKILLS_REL, name);
  if (managed.size > 0 && !managed.has(path.join(relDir, 'SKILL.md'))) {
    return { ours: false, reason: 'not in the previous install state', foreign: [] };
  }
  const scaffoldDir = path.join(__dirname, '..', 'scaffold', 'skills', name);
  const foreign = listFiles(dir).filter(
    (file) => !managed.has(path.join(relDir, file)) && !fs.existsSync(path.join(scaffoldDir, file))
  );
  return { ours: true, reason: null, foreign };
}

// Every bundled SKILL.md carries the Structured Return contract (enforced by
// lib/skill-registry.js). Necessary, not sufficient: see classifyLegacySkill.
function isDevWorkflowSkillCopy(skillDir) {
  let content;
  try {
    content = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
  } catch {
    return false;
  }
  return content.includes('**Status:**') && content.includes('**Next Step:**');
}

function managedSet(state) {
  return new Set(state && Array.isArray(state.managed_files) ? state.managed_files : []);
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full));
  }
  return out;
}

function listScaffoldSkillDirs() {
  const scaffoldSkillsDir = path.join(__dirname, '..', 'scaffold', 'skills');
  if (!fs.existsSync(scaffoldSkillsDir)) return [];
  return fs
    .readdirSync(scaffoldSkillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function scanOrphanCommandWrappers(projectRoot) {
  const orphans = [];

  // Build the canonical "known names" set:
  //  - Commands from constants.js (en + pt-br union) — these become wrappers.
  //  - Bundled skill names from scaffold/skills/ — they now live in .dw/skills/,
  //    and a legacy copy under .agents/skills/ is handled by the relocation
  //    scan, not reported here as an orphan wrapper.
  const canonical = new Set();
  for (const lang of Object.keys(COMMANDS)) {
    for (const cmd of COMMANDS[lang]) {
      canonical.add(cmd.name);
    }
  }
  for (const name of listScaffoldSkillDirs()) canonical.add(name);

  // Scan locations
  const locations = [
    { dir: path.join(projectRoot, '.claude', 'skills'), type: 'directory' },
    { dir: path.join(projectRoot, '.agents', 'skills'), type: 'directory' },
    { dir: path.join(projectRoot, '.opencode', 'commands'), type: 'file', suffix: '.md' },
  ];

  for (const loc of locations) {
    if (!fs.existsSync(loc.dir)) continue;
    const entries = fs.readdirSync(loc.dir, { withFileTypes: true });

    for (const entry of entries) {
      const name = loc.suffix ? entry.name.replace(loc.suffix, '') : entry.name;

      // Only scan dw-* prefix
      if (!name.startsWith('dw-')) continue;

      // Skip if it matches a canonical command OR a bundled skill
      if (canonical.has(name)) continue;

      // Match the expected entry type (directory or file)
      const isExpected = loc.type === 'directory' ? entry.isDirectory() : entry.isFile();
      if (!isExpected) continue;

      orphans.push({ path: path.join(loc.dir, entry.name), commandName: name });
    }
  }

  return orphans;
}

function scanRemovedCommandSources(projectRoot) {
  const matches = [];
  const commandsDir = path.join(projectRoot, '.dw', 'commands');
  if (!fs.existsSync(commandsDir)) return matches;

  for (const entry of removedCommands) {
    const target = path.join(commandsDir, `${entry.name}.md`);
    if (fs.existsSync(target)) {
      matches.push({ ...entry, path: target });
    }
  }

  return matches;
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

// Move a retired path under .dw/.migrated/<stamp>/, keeping its relative path.
function moveToBackup(projectRoot, target, stamp = timestamp()) {
  if (!fs.existsSync(target)) return null;
  const dest = path.join(projectRoot, MIGRATED_REL, stamp, path.relative(projectRoot, target));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.renameSync(target, dest);
  } catch {
    fs.cpSync(target, dest, { recursive: true });
    fs.rmSync(target, { recursive: true, force: true });
  }
  return dest;
}

module.exports = {
  migrate,
  isDevWorkflowSkillCopy,
  classifyLegacySkill,
  managedSet,
  moveToBackup,
  timestamp,
  MIGRATED_REL,
};

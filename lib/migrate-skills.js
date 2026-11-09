const fs = require('fs');
const path = require('path');
const { COMMANDS } = require('./constants');
const removedSkills = require('./removed-bundled-skills');
const removedCommands = require('./removed-commands');
const { BUNDLED_SKILLS_REL, LEGACY_BUNDLED_SKILLS_REL } = require('./skill-registry');

/**
 * Cleanup-on-update for dev-workflow.
 *
 * Two complementary scans:
 *
 * 1. Removed bundled skills (data-driven from `removed-bundled-skills.js`):
 *    Detects `.dw/skills/<name>/` (and legacy `.agents/skills/<name>/`)
 *    directories that match the manifest of skills removed in past releases.
 *    Removes them and notes the replacement.
 *
 * 1.5. Relocated bundled skills: releases up to 2.6.0 installed the bundled
 *    skills under `.agents/skills/`, where Codex, Copilot and OpenCode list them
 *    as model-invocable. They now live in `.dw/skills/`. A legacy copy is removed
 *    only when it is recognisably ours (its SKILL.md carries the Structured
 *    Return contract every bundled skill must have); a same-named skill the user
 *    installed from elsewhere is kept and reported.
 *
 * 2. Orphan command wrappers (state-comparison vs `constants.js`):
 *    Lists `.claude/skills/dw-*`, `.agents/skills/dw-*`, and
 *    `.opencode/commands/dw-*.md` wrappers on disk. Any `dw-*` wrapper whose
 *    base name is NOT present in the current `COMMANDS[lang]` is removed.
 *
 * Only touches names with prefix `dw-` (or names explicitly listed in the
 * manifest). Never touches third-party skills/commands.
 *
 * Idempotent: silent when nothing to clean.
 *
 * Run automatically from lib/init.js when mode === 'update'.
 */
function migrate(projectRoot) {
  const removed = scanRemovedBundledSkills(projectRoot);
  const relocated = scanRelocatedBundledSkills(projectRoot);
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

  for (const entry of removed) {
    console.log(
      `    \x1b[33m-\x1b[0m [v${entry.removedIn}] Removing legacy skill ${entry.name} (replaced by ${entry.replacedBy})`
    );
    rmRecursive(entry.path);
  }

  let relocatedCount = 0;
  for (const entry of relocated) {
    const rel = path.relative(projectRoot, entry.path);
    if (entry.ours) {
      console.log(`    \x1b[33m-\x1b[0m [moved] Removing ${rel} (bundled skills now live in ${BUNDLED_SKILLS_REL}/)`);
      rmRecursive(entry.path);
      relocatedCount += 1;
    } else {
      console.log(
        `    \x1b[36m!\x1b[0m [kept] ${rel} has a bundled skill's name but is not a dev-workflow copy; left in place`
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
    console.log(`    \x1b[33m-\x1b[0m [orphan] Removing wrapper ${rel} ${suffix}`);
    rmRecursive(entry.path);
  }

  for (const entry of commandSources) {
    const rel = path.relative(projectRoot, entry.path);
    console.log(
      `    \x1b[33m-\x1b[0m [legacy] Removing command source ${rel} (replaced in v${entry.removedIn} by \`${entry.replacedBy}\`)`
    );
    rmRecursive(entry.path);
  }

  console.log();
  return {
    removed: removed.length,
    relocated: relocatedCount,
    orphans: orphans.length,
    commandSources: commandSources.length,
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

function scanRelocatedBundledSkills(projectRoot) {
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
    matches.push({ name, path: target, ours: isDevWorkflowSkillCopy(target) });
  }
  return matches;
}

// Every bundled SKILL.md carries the Structured Return contract (enforced by
// lib/skill-registry.js), and third-party skills sharing a name (humanizer,
// security-review, vercel-react-best-practices…) do not. That is the line
// between "our managed copy" and "the user's own install".
function isDevWorkflowSkillCopy(skillDir) {
  let content;
  try {
    content = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
  } catch {
    return false;
  }
  return content.includes('**Status:**') && content.includes('**Next Step:**');
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

function rmRecursive(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

module.exports = { migrate, isDevWorkflowSkillCopy };

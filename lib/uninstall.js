const fs = require('fs');
const path = require('path');
const { COMMANDS, PLATFORMS, MCP_SERVERS } = require('./constants');
const { AGENT_TARGETS, LEGACY_AGENT_TARGETS, readAgentRegistry } = require('./agents');
const { removeHooks } = require('./hooks');
const { BUNDLED_SKILLS_REL, LEGACY_BUNDLED_SKILLS_REL } = require('./skill-registry');
const { classifyLegacySkill, isDevWorkflowSkillCopy, managedSet, moveToBackup, timestamp, MIGRATED_REL } = require('./migrate-skills');
const { readInstallState } = require('./install-state');

function run() {
  const projectRoot = process.cwd();

  console.log('\n  dev-workflow uninstall');
  console.log(`  ${'='.repeat(40)}\n`);

  let removed = 0;
  let skipped = 0;

  function removeDir(dirPath, label) {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true });
      console.log(`  \x1b[31m-\x1b[0m ${path.relative(projectRoot, dirPath)} [removed]`);
      removed++;
    } else {
      skipped++;
    }
  }

  function removeFile(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  \x1b[31m-\x1b[0m ${path.relative(projectRoot, filePath)} [removed]`);
      removed++;
    } else {
      skipped++;
    }
  }

  // 1. Remove .dw/commands/, .dw/templates/, .dw/references/, .dw/scripts/
  console.log('  Managed files:');
  removeDir(path.join(projectRoot, '.dw', 'commands'), '.dw/commands/');
  // .dw/templates/overrides/ is the owner's (it wins over the managed templates): keep it.
  const templatesDir = path.join(projectRoot, '.dw', 'templates');
  if (fs.existsSync(templatesDir)) {
    for (const entry of fs.readdirSync(templatesDir)) {
      if (entry === 'overrides') continue;
      fs.rmSync(path.join(templatesDir, entry), { recursive: true, force: true });
    }
    if (fs.readdirSync(templatesDir).length === 0) fs.rmdirSync(templatesDir);
    console.log(`  \x1b[31m-\x1b[0m .dw/templates [removed${fs.existsSync(templatesDir) ? ', overrides/ kept' : ''}]`);
    removed++;
  } else {
    skipped++;
  }
  removeDir(path.join(projectRoot, '.dw', 'references'), '.dw/references/');
  removeDir(path.join(projectRoot, '.dw', 'scripts'), '.dw/scripts/');
  removeFile(path.join(projectRoot, '.dw', 'agent-registry.json'));
  console.log();

  // 2. Remove platform wrappers (only dw-* skills, not user skills)
  console.log('  Platform wrappers:');
  const allCommandNames = COMMANDS.en.map(c => c.name);

  for (const [, platform] of Object.entries(PLATFORMS)) {
    for (const name of allCommandNames) {
      if (platform.flat) {
        removeFile(path.join(projectRoot, platform.dir, `${name}.md`));
      } else {
        removeDir(path.join(projectRoot, platform.dir, name));
      }
    }
  }
  console.log();

  // 3. Remove bundled skills from .dw/skills/ (managed by this package). A legacy
  //    copy left under .agents/skills/ by a release up to 2.6.0 is moved to
  //    .dw/.migrated/<ts>/ — only when it is ours (classifyLegacySkill); a
  //    same-named skill installed from elsewhere is kept and reported.
  console.log('  Bundled skills:');
  const skillsDir = path.join(__dirname, '..', 'scaffold', 'skills');
  const bundledSkills = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : [];
  const managed = managedSet(readInstallState(projectRoot));
  const stamp = timestamp();
  let movedLegacy = 0;
  for (const skill of bundledSkills) {
    removeDir(path.join(projectRoot, BUNDLED_SKILLS_REL, skill));
    const legacy = path.join(projectRoot, LEGACY_BUNDLED_SKILLS_REL, skill);
    if (!fs.existsSync(legacy)) continue;
    const verdict = classifyLegacySkill(projectRoot, skill, managed);
    const rel = path.relative(projectRoot, legacy);
    if (verdict.ours) {
      moveToBackup(projectRoot, legacy, stamp);
      console.log(`  \x1b[31m-\x1b[0m ${rel} [moved to ${path.join(MIGRATED_REL, stamp)}/]`);
      removed++;
      movedLegacy++;
    } else {
      console.log(`  \x1b[36m!\x1b[0m ${rel} [kept: not a dev-workflow copy (${verdict.reason})]`);
    }
  }
  if (movedLegacy > 0) {
    console.log(`    Legacy copies are in ${path.join(MIGRATED_REL, stamp)}/; delete that folder when you no longer need them.`);
  }
  const bundledRoot = path.join(projectRoot, BUNDLED_SKILLS_REL);
  if (fs.existsSync(bundledRoot) && fs.readdirSync(bundledRoot).length === 0) {
    fs.rmdirSync(bundledRoot);
  }
  console.log();

  // 3.5. Remove generated dev-workflow agents from platform folders.
  console.log('  Agents:');
  const registry = readAgentRegistry();
  for (const agent of registry.agents) {
    for (const target of Object.values(AGENT_TARGETS)) {
      removeFile(path.join(projectRoot, target.dir, target.fileName(agent.name)));
    }
    for (const target of Object.values(LEGACY_AGENT_TARGETS)) {
      removeFile(path.join(projectRoot, target.dir, target.fileName(agent.name)));
    }
  }
  removeFile(path.join(projectRoot, '.agents', 'agents', 'README.md'));
  console.log();

  // 4. Remove MCP servers from .claude/settings.json
  console.log('  MCP Servers:');
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      if (settings.mcpServers) {
        for (const name of Object.keys(MCP_SERVERS)) {
          if (settings.mcpServers[name]) {
            delete settings.mcpServers[name];
            console.log(`  \x1b[31m-\x1b[0m MCP server: ${name} [removed]`);
            removed++;
          }
        }
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
      }
    } catch {
      console.log('    Could not parse .claude/settings.json, skipping MCP cleanup');
    }
  }
  console.log();

  // 4.5. Remove dev-workflow hooks + statusline from .claude/settings.json and
  // .codex/hooks.json (marker-based; user-defined hooks/statusLine are left intact). The hook
  // scripts themselves were removed with .dw/scripts/ above.
  console.log('  Hooks & statusline:');
  try {
    const removedHooks = removeHooks(projectRoot);
    if (removedHooks > 0) {
      console.log(`  \x1b[31m-\x1b[0m ${removedHooks} dev-workflow hook/statusline entr${removedHooks === 1 ? 'y' : 'ies'} [removed]`);
      removed += removedHooks;
    } else {
      skipped++;
    }
  } catch {
    console.log('    Could not parse .claude/settings.json, skipping hook cleanup');
  }
  console.log();

  // 5. Remove .opencode/package.json
  removeFile(path.join(projectRoot, '.opencode', 'package.json'));
  removeFile(path.join(projectRoot, '.dw', 'install-state.json'));

  // 6. Retire dev-workflow entries from legacy .codex/skills/ (dw-* wrappers and
  //    bundled-skill copies that pass the contract check) by moving them to
  //    .dw/.migrated/<ts>/; anything else there belongs to the user or another tool.
  const codexSkills = path.join(projectRoot, '.codex', 'skills');
  if (fs.existsSync(codexSkills)) {
    for (const entry of fs.readdirSync(codexSkills, { withFileTypes: true })) {
      const target = path.join(codexSkills, entry.name);
      const isBundledCopy = bundledSkills.includes(entry.name) && isDevWorkflowSkillCopy(target);
      if (entry.name.startsWith('dw-') || isBundledCopy) {
        moveToBackup(projectRoot, target, stamp);
        console.log(`  \x1b[31m-\x1b[0m ${path.relative(projectRoot, target)} [moved to ${path.join(MIGRATED_REL, stamp)}/]`);
        removed++;
      }
    }
    if (fs.readdirSync(codexSkills).length === 0) fs.rmdirSync(codexSkills);
  }

  // Note: .dw/rules/, .dw/spec/, .dw/intel/ are USER DATA — never removed
  console.log(`\n  ${'='.repeat(40)}`);
  console.log(`  Done! ${removed} removed, ${skipped} already absent`);
  console.log();
  console.log('  Preserved (user data):');
  console.log('    .dw/rules/           (project rules)');
  console.log('    .dw/spec/            (PRDs and specs)');
  console.log('    .dw/intel/           (codebase index from /dw-intel --build)');
  console.log('    .dw/minimalism.json  (dw-minimalism intensity preference)');
  console.log('    .dw/templates/overrides/ (your template overrides)');
  console.log('    .dw/.migrated/       (anything uninstall or update retired; delete when no longer needed)');
  console.log();
}

module.exports = { run };

const fs = require('fs');
const path = require('path');
const { COMMANDS, PLATFORMS, MCP_SERVERS } = require('./constants');
const { AGENT_TARGETS, LEGACY_AGENT_TARGETS, readAgentRegistry } = require('./agents');

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
  removeDir(path.join(projectRoot, '.dw', 'templates'), '.dw/templates/');
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

  // 3. Remove bundled skills from .agents/skills/
  console.log('  Bundled skills:');
  const skillsDir = path.join(__dirname, '..', 'scaffold', 'skills');
  const bundledSkills = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : [];
  for (const skill of bundledSkills) {
    removeDir(path.join(projectRoot, '.agents', 'skills', skill));
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

  // 5. Remove .opencode/package.json
  removeFile(path.join(projectRoot, '.opencode', 'package.json'));
  removeFile(path.join(projectRoot, '.dw', 'install-state.json'));

  // 6. Remove legacy .codex/skills/
  removeDir(path.join(projectRoot, '.codex', 'skills'));

  // Note: .dw/rules/, .dw/spec/, .dw/intel/ are USER DATA — never removed
  console.log(`\n  ${'='.repeat(40)}`);
  console.log(`  Done! ${removed} removed, ${skipped} already absent`);
  console.log();
  console.log('  Preserved (user data):');
  console.log('    .dw/rules/    (project rules)');
  console.log('    .dw/spec/     (PRDs and specs)');
  console.log('    .dw/intel/    (codebase index from /dw-intel --build)');
  console.log();
}

module.exports = { run };

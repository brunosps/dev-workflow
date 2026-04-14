const fs = require('fs');
const path = require('path');
const { COMMANDS, PLATFORMS, MCP_SERVERS } = require('./constants');

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
  const bundledSkills = [
    'humanizer',
    'remotion-best-practices',
    'security-review',
    'ui-ux-pro-max',
    'vercel-react-best-practices',
    'webapp-testing',
  ];
  for (const skill of bundledSkills) {
    removeDir(path.join(projectRoot, '.agents', 'skills', skill));
  }
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

  // 6. Remove legacy .codex/skills/
  removeDir(path.join(projectRoot, '.codex', 'skills'));

  // Note: .dw/rules/, .dw/spec/, .planning/ are USER DATA — never removed
  console.log(`\n  ${'='.repeat(40)}`);
  console.log(`  Done! ${removed} removed, ${skipped} already absent`);
  console.log();
  console.log('  Preserved (user data):');
  console.log('    .dw/rules/    (project rules)');
  console.log('    .dw/spec/     (PRDs and specs)');
  console.log('    .planning/    (GSD state)');
  console.log();
}

module.exports = { run };

const path = require('path');
const { PLATFORMS } = require('./constants');
const { writeFile, log } = require('./utils');

function generateWrappers(projectRoot, commands, force = false) {
  const results = { created: 0, skipped: 0, overwritten: 0 };

  for (const [platformName, platform] of Object.entries(PLATFORMS)) {
    for (const cmd of commands) {
      let skillFile;
      if (platform.flat) {
        // Flat format: .opencode/commands/dw-brainstorm.md
        skillFile = path.join(projectRoot, platform.dir, `${cmd.name}.md`);
      } else {
        // Directory format: .claude/skills/dw-brainstorm/SKILL.md
        skillFile = path.join(projectRoot, platform.dir, cmd.name, 'SKILL.md');
      }
      const content = platform.wrapperTemplate(cmd.name, cmd.description);
      const status = writeFile(skillFile, content, force);
      results[status]++;
      log(status, skillFile);
    }
  }

  return results;
}

module.exports = { generateWrappers };

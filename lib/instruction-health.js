const fs = require('fs');
const path = require('path');
const { COMMANDS } = require('./constants');

const LIMITS = { instructions: 6000, skill: 8000, description: 250 };

function inspectInstructions(root = path.join(__dirname, '..')) {
  const issues = [];
  const metrics = { instructions: {}, descriptions: {}, skills: {} };
  for (const locale of ['en', 'pt-br']) {
    const file = path.join(root, 'scaffold', locale, 'agent-instructions.md');
    metrics.instructions[locale] = fs.statSync(file).size;
    if (metrics.instructions[locale] > LIMITS.instructions) issues.push(`${locale} installed instructions exceed ${LIMITS.instructions} bytes`);
    metrics.descriptions[locale] = 0;
    for (const command of COMMANDS[locale]) {
      metrics.descriptions[locale] += [...command.description].length;
      if ([...command.description].length > LIMITS.description) issues.push(`${locale} ${command.name} description exceeds ${LIMITS.description} characters`);
    }
  }
  const skillsDir = path.join(root, 'scaffold', 'skills');
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(file)) continue; // Registry validator reports missing entrypoints.
    const content = fs.readFileSync(file, 'utf8');
    metrics.skills[entry.name] = Buffer.byteLength(content);
    if (metrics.skills[entry.name] > LIMITS.skill) issues.push(`${entry.name} entrypoint exceeds ${LIMITS.skill} bytes`);
    const description = content.match(/^description:\s*(.+)$/m)?.[1]?.replace(/^"|"$/g, '');
    if (!description || [...description].length > LIMITS.description) issues.push(`${entry.name} requires a description of at most ${LIMITS.description} characters`);
    // Concrete skill-relative router links, not wildcard examples or installed paths.
    for (const match of content.matchAll(/(?:`|\]\()((?:references|agents|rules|languages|infrastructure)\/[\w./-]+\.md)(?:`|\))/g)) {
      if (!fs.existsSync(path.join(path.dirname(file), match[1]))) issues.push(`${entry.name} missing routed reference ${match[1]}`);
    }
  }
  return { issues, metrics };
}

module.exports = { LIMITS, inspectInstructions };

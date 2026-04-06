const fs = require('fs');
const path = require('path');
const { ensureDir } = require('./utils');
const { MCP_SERVERS } = require('./constants');

function installMCPs(projectRoot) {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      settings = {};
    }
  }

  if (!settings.mcpServers) {
    settings.mcpServers = {};
  }

  let added = 0;
  let skipped = 0;

  for (const [name, config] of Object.entries(MCP_SERVERS)) {
    if (settings.mcpServers[name]) {
      skipped++;
    } else {
      settings.mcpServers[name] = config;
      added++;
    }
  }

  ensureDir(path.dirname(settingsPath));
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');

  return { added, skipped };
}

module.exports = { installMCPs };

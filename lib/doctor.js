const fs = require('fs');
const path = require('path');
const { COMMANDS, PLATFORMS, MCP_SERVERS } = require('./constants');
const {
  listExpectedAgentFiles,
  listLegacyAgentFiles,
  readAgentRegistry,
  validateAgentRegistry,
  AGENT_TARGETS,
} = require('./agents');
const { readInstallState, STATE_RELATIVE_PATH } = require('./install-state');
const { validateSkillRegistry, readSkillRegistry } = require('./skill-registry');
const removedCommands = require('./removed-commands');

function run() {
  const projectRoot = process.cwd();
  const state = readInstallState(projectRoot);
  const issues = [];
  const warnings = [];

  if (!state) {
    issues.push(`Missing ${STATE_RELATIVE_PATH}. Run \`dev-workflow repair\`.`);
  }

  const lang = (state && state.lang) || 'en';
  const modules = (state && state.modules) || ['core', 'security', 'frontend'];
  const commands = COMMANDS[lang] || COMMANDS.en;

  checkCommands(projectRoot, commands, issues);
  checkWrappers(projectRoot, commands, issues);
  checkAgents(projectRoot, modules, issues);
  checkAgentRegistry(issues, warnings);
  checkSubtaskLayout(projectRoot, issues);
  checkSkillRegistry(projectRoot, issues, warnings);
  checkMcp(projectRoot, issues);
  checkLegacyCommands(projectRoot, warnings);

  console.log('dev-workflow doctor\n');
  if (issues.length === 0 && warnings.length === 0) {
    console.log('PASS: managed commands, wrappers, agents, skills, and MCP config look healthy.');
    return;
  }

  if (issues.length) {
    console.log('Issues:');
    for (const issue of issues) console.log(`- ${issue}`);
    console.log();
  }

  if (warnings.length) {
    console.log('Warnings:');
    for (const warning of warnings) console.log(`- ${warning}`);
    console.log();
  }

  console.log('Run `npx @brunosps00/dev-workflow repair` to reconcile managed files.');
  if (issues.length) process.exitCode = 1;
}

function checkCommands(projectRoot, commands, issues) {
  for (const cmd of commands) {
    const file = path.join(projectRoot, '.dw', 'commands', `${cmd.name}.md`);
    if (!fs.existsSync(file)) issues.push(`Missing command source: ${path.relative(projectRoot, file)}`);
  }
}

function checkWrappers(projectRoot, commands, issues) {
  for (const [, platform] of Object.entries(PLATFORMS)) {
    for (const cmd of commands) {
      const file = platform.flat
        ? path.join(projectRoot, platform.dir, `${cmd.name}.md`)
        : path.join(projectRoot, platform.dir, cmd.name, 'SKILL.md');
      if (!fs.existsSync(file)) issues.push(`Missing wrapper: ${path.relative(projectRoot, file)}`);
    }
  }
}

function checkAgents(projectRoot, modules, issues) {
  for (const file of listExpectedAgentFiles(projectRoot, modules)) {
    if (!fs.existsSync(file)) issues.push(`Missing agent: ${path.relative(projectRoot, file)}`);
  }
  for (const file of listLegacyAgentFiles(projectRoot, modules)) {
    if (fs.existsSync(file)) issues.push(`Legacy Copilot agent path still exists: ${path.relative(projectRoot, file)}`);
  }
  for (const file of listExpectedAgentFiles(projectRoot, modules)) {
    if (fs.existsSync(file) && file.endsWith('.md') && fs.statSync(file).size > 8 * 1024) {
      issues.push(`Agent prompt exceeds 8KB: ${path.relative(projectRoot, file)}`);
    }
  }
  checkProviderAgentCompatibility(projectRoot, modules, issues);
}

function checkAgentRegistry(issues, warnings) {
  const registry = readAgentRegistry();
  const validation = validateAgentRegistry(registry);
  issues.push(...validation.issues);
  warnings.push(...validation.warnings);
  const installedRegistryPath = path.join(process.cwd(), '.dw', 'agent-registry.json');
  if (!fs.existsSync(installedRegistryPath)) {
    issues.push(`Missing agent registry: ${path.relative(process.cwd(), installedRegistryPath)}`);
  } else {
    try {
      const installedRegistry = JSON.parse(fs.readFileSync(installedRegistryPath, 'utf-8'));
      if (installedRegistry.schema_version !== '2.0') {
        issues.push('Installed agent registry must use schema_version 2.0.');
      }
    } catch {
      issues.push(`Malformed agent registry: ${path.relative(process.cwd(), installedRegistryPath)}`);
    }
  }
  const agentNames = new Set(registry.agents.map((agent) => agent.name));
  for (const [commandName, agents] of Object.entries(registry.commands || {})) {
    if (!COMMANDS.en.some((cmd) => cmd.name === commandName)) {
      issues.push(`Agent registry references unknown command: ${commandName}`);
    }
    for (const agentName of agents) {
      if (!agentNames.has(agentName)) {
        issues.push(`Agent registry references missing agent: ${agentName}`);
      }
    }
  }
}

function checkProviderAgentCompatibility(projectRoot, modules, issues) {
  const expected = listExpectedAgentFiles(projectRoot, modules);
  for (const file of expected) {
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(projectRoot, file);
    const content = fs.readFileSync(file, 'utf-8');
    if (rel.startsWith(`${AGENT_TARGETS.copilot.dir}/`)) {
      for (const unsupported of ['permissionMode:', 'maxTurns:', 'model:', 'mode: subagent']) {
        if (content.includes(unsupported)) issues.push(`Copilot agent contains unsupported field ${unsupported} ${rel}`);
      }
    }
    if (rel.startsWith(`${AGENT_TARGETS.claude.dir}/`) && !content.includes('permissionMode:')) {
      issues.push(`Claude agent missing permissionMode: ${rel}`);
    }
    if (rel.startsWith(`${AGENT_TARGETS.opencode.dir}/`) && content.includes('\ntools:')) {
      issues.push(`OpenCode agent should use permission instead of tools: ${rel}`);
    }
  }
}

function checkSubtaskLayout(projectRoot, issues) {
  const gitignore = path.join(projectRoot, '.dw', 'subtasks', '.gitignore');
  if (!fs.existsSync(gitignore)) issues.push(`Missing subtask gitignore: ${path.relative(projectRoot, gitignore)}`);
}

function checkSkillRegistry(projectRoot, issues, warnings) {
  const validation = validateSkillRegistry();
  issues.push(...validation.issues);
  warnings.push(...validation.warnings);

  const installedRegistryPath = path.join(projectRoot, '.dw', 'skill-registry.json');
  if (!fs.existsSync(installedRegistryPath)) {
    issues.push(`Missing skill registry: ${path.relative(projectRoot, installedRegistryPath)}`);
  } else {
    try {
      const installedRegistry = JSON.parse(fs.readFileSync(installedRegistryPath, 'utf-8'));
      const currentRegistry = readSkillRegistry();
      if (installedRegistry.schema_version !== currentRegistry.schema_version) {
        warnings.push('Installed skill registry schema differs from package registry; run repair.');
      }
      const installedNames = new Set((installedRegistry.skills || []).map((entry) => entry.name));
      for (const entry of currentRegistry.skills) {
        if (entry.bundled && !installedNames.has(entry.name)) {
          warnings.push(`Installed skill registry missing bundled entry: ${entry.name}`);
        }
      }
    } catch {
      issues.push(`Malformed skill registry: ${path.relative(projectRoot, installedRegistryPath)}`);
    }
  }

  const registry = readSkillRegistry();
  for (const entry of registry.skills) {
    if (!entry.bundled) continue;
    const skillPath = path.join(projectRoot, '.agents', 'skills', entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      issues.push(`Missing bundled skill: ${path.relative(projectRoot, skillPath)}`);
    }
  }
}

function checkMcp(projectRoot, issues) {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    issues.push('Missing .claude/settings.json with MCP configuration');
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    for (const name of Object.keys(MCP_SERVERS)) {
      if (!settings.mcpServers || !settings.mcpServers[name]) {
        issues.push(`Missing MCP server: ${name}`);
      }
    }
  } catch {
    issues.push('Malformed .claude/settings.json');
  }
}

function checkLegacyCommands(projectRoot, warnings) {
  for (const entry of removedCommands) {
    const file = path.join(projectRoot, '.dw', 'commands', `${entry.name}.md`);
    if (fs.existsSync(file)) {
      warnings.push(`Legacy command source still exists: ${path.relative(projectRoot, file)} -> ${entry.replacedBy}`);
    }
  }
}

module.exports = { run };

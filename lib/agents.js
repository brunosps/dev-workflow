const fs = require('fs');
const path = require('path');
const { ensureDir, readJson, writeFile, log } = require('./utils');

const SCAFFOLD_DIR = path.join(__dirname, '..', 'scaffold');
const REGISTRY_PATH = path.join(SCAFFOLD_DIR, 'agent-registry.json');

const AGENT_TARGETS = {
  claude: {
    dir: '.claude/agents',
    fileName: (name) => `${name}.md`,
    render: renderClaudeAgent,
  },
  opencode: {
    dir: '.opencode/agent',
    fileName: (name) => `${name}.md`,
    render: renderOpenCodeAgent,
  },
  agents: {
    dir: '.agents/agents',
    fileName: (name) => `${name}.md`,
    render: renderFallbackAgent,
  },
  copilot: {
    dir: '.github/agents',
    fileName: (name) => `${name}.agent.md`,
    render: renderCopilotAgent,
  },
};

const LEGACY_AGENT_TARGETS = {
  copilot: {
    dir: '.github/copilot/agents',
    fileName: (name) => `${name}.agent.md`,
  },
};

const REQUIRED_AGENT_FIELDS = [
  'name',
  'module',
  'description',
  'mode',
  'context_mode',
  'tool_policy',
  'max_turns',
  'input_budget_words',
  'output_budget_words',
  'parallel_safe',
  'handoff_required',
  'skill_policy',
  'recommended_for',
  'avoid_when',
];

function readAgentRegistry() {
  const registry = readJson(REGISTRY_PATH, null);
  if (!registry || !Array.isArray(registry.agents)) {
    throw new Error('Invalid scaffold/agent-registry.json');
  }
  return registry;
}

function validateAgentRegistry(registry = readAgentRegistry()) {
  const issues = [];
  const warnings = [];
  if (registry.schema_version !== '2.0') {
    issues.push('Agent registry must use schema_version 2.0.');
  }

  const names = new Set();
  for (const agent of registry.agents || []) {
    for (const field of REQUIRED_AGENT_FIELDS) {
      if (agent[field] === undefined || agent[field] === null || agent[field] === '') {
        issues.push(`Agent ${agent.name || '<unnamed>'} is missing required field: ${field}`);
      }
    }
    if (names.has(agent.name)) issues.push(`Duplicate agent name: ${agent.name}`);
    names.add(agent.name);

    if (!Array.isArray(agent.recommended_for)) {
      issues.push(`Agent ${agent.name} recommended_for must be an array.`);
    }
    if (!Array.isArray(agent.avoid_when)) {
      issues.push(`Agent ${agent.name} avoid_when must be an array.`);
    }
    if (agent.mode === 'read-only' && agent.tool_policy !== 'read-only') {
      issues.push(`Read-only agent ${agent.name} must use tool_policy read-only.`);
    }
    if (agent.output_budget_words > 1500) {
      warnings.push(`Agent ${agent.name} output budget is above 1500 words.`);
    }
  }

  for (const [commandName, agents] of Object.entries(registry.commands || {})) {
    if (!Array.isArray(agents)) {
      issues.push(`Agent registry command ${commandName} must map to an array.`);
      continue;
    }
    for (const agentName of agents) {
      if (!names.has(agentName)) issues.push(`Agent registry references missing agent: ${agentName}`);
    }
  }

  return { issues, warnings };
}

function selectAgents(modules) {
  const registry = readAgentRegistry();
  const validation = validateAgentRegistry(registry);
  if (validation.issues.length) {
    throw new Error(`Invalid scaffold/agent-registry.json:\n- ${validation.issues.join('\n- ')}`);
  }
  const selectedModules = new Set(modules || []);
  return registry.agents.filter((agent) => selectedModules.has(agent.module));
}

function generateAgents(projectRoot, modules, force = false) {
  const results = { created: 0, skipped: 0, overwritten: 0, files: [] };
  const agents = selectAgents(modules);

  if (force) removeLegacyAgentTargets(projectRoot, agents);

  for (const agent of agents) {
    const source = readAgentSource(agent);
    for (const target of Object.values(AGENT_TARGETS)) {
      const dest = path.join(projectRoot, target.dir, target.fileName(agent.name));
      const status = writeFile(dest, target.render(agent, source), force);
      results[status]++;
      results.files.push(dest);
      log(status, dest);
    }
  }

  writeAgentIndex(projectRoot, agents, force);
  const indexPath = path.join(projectRoot, '.agents', 'agents', 'README.md');
  results.files.push(indexPath);

  return results;
}

function readAgentSource(agent) {
  const src = path.join(SCAFFOLD_DIR, 'agents', agent.module, `${agent.name}.md`);
  if (!fs.existsSync(src)) {
    throw new Error(`Agent source missing: ${path.relative(process.cwd(), src)}`);
  }
  const raw = fs.readFileSync(src, 'utf-8');
  const parsed = parseMarkdownFrontmatter(raw);
  return {
    path: src,
    metadata: parsed.metadata,
    body: parsed.body.trim(),
  };
}

function parseMarkdownFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { metadata: {}, body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { metadata: {}, body: raw };
  const metadata = {};
  const frontmatter = raw.slice(4, end).trim();
  for (const line of frontmatter.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    metadata[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return {
    metadata,
    body: raw.slice(end + 4).replace(/^\s+/, ''),
  };
}

function renderClaudeAgent(agent, source) {
  const tools = claudeToolsFor(agent, source);
  const lines = [
    '---',
    `name: ${agent.name}`,
    `description: "${yamlString(agent.description)}"`,
    `tools: ${tools.join(', ')}`,
    `model: ${source.metadata.model || 'sonnet'}`,
    `permissionMode: ${agent.tool_policy === 'read-only' ? 'plan' : 'default'}`,
    `maxTurns: ${agent.max_turns}`,
    '---',
    '',
    renderContract(agent, 'Claude Code project subagent'),
    '',
    source.body,
    '',
  ];
  return lines.join('\n');
}

function renderOpenCodeAgent(agent, source) {
  const canWrite = agent.tool_policy !== 'read-only';
  const lines = [
    '---',
    'mode: subagent',
    `description: "${yamlString(agent.description)}"`,
    `steps: ${agent.max_turns}`,
    'permission:',
    `  edit: ${canWrite ? 'allow' : 'deny'}`,
    `  write: ${canWrite ? 'allow' : 'deny'}`,
    `  bash: ${agent.tool_policy === 'read-only' ? 'deny' : 'allow'}`,
    '---',
    '',
    renderContract(agent, 'OpenCode project subagent'),
    '',
    source.body,
    '',
  ];
  return lines.join('\n');
}

function renderCopilotAgent(agent, source) {
  const tools = copilotToolsFor(agent);
  const lines = [
    '---',
    `name: ${agent.name}`,
    `description: "${yamlString(agent.description)}"`,
    `tools: ${tools.join(', ')}`,
    '---',
    '',
    renderContract(agent, 'GitHub Copilot custom agent'),
    '',
    source.body,
    '',
  ];
  return lines.join('\n');
}

function renderFallbackAgent(agent, source) {
  const lines = [
    '---',
    `name: ${agent.name}`,
    `description: "${yamlString(agent.description)}"`,
    `mode: ${agent.mode}`,
    `context_mode: ${agent.context_mode}`,
    `tool_policy: ${agent.tool_policy}`,
    `max_turns: ${agent.max_turns}`,
    `input_budget_words: ${agent.input_budget_words}`,
    `output_budget_words: ${agent.output_budget_words}`,
    `parallel_safe: ${agent.parallel_safe}`,
    '---',
    '',
    renderContract(agent, 'Fallback prompt profile'),
    '',
    source.body,
    '',
  ];
  return lines.join('\n');
}

function renderContract(agent, targetLabel) {
  return [
    `# ${agent.name}`,
    '',
    `Provider target: ${targetLabel}.`,
    '',
    '## Dispatch Contract',
    '',
    `- Context mode: \`${agent.context_mode}\`.`,
    `- Tool policy: \`${agent.tool_policy}\`.`,
    `- Max turns: ${agent.max_turns}.`,
    `- Input budget: ${agent.input_budget_words} words.`,
    `- Output budget: ${agent.output_budget_words} words.`,
    `- Parallel safe: ${agent.parallel_safe ? 'yes' : 'no'}.`,
    `- Handoff required: ${agent.handoff_required ? 'yes' : 'no'}.`,
    `- Skill policy: \`${agent.skill_policy}\`; do not preload large skills.`,
    '',
    '## Use When',
    ...agent.recommended_for.map((item) => `- ${item}.`),
    '',
    '## Do Not Use When',
    ...agent.avoid_when.map((item) => `- ${item}.`),
    '',
    '## Input Packet Expected',
    '',
    '- Objective and stop condition.',
    '- Allowed files, folders, commands, and write boundaries.',
    '- Relevant constraints from `.dw/rules/`, `.dw/intel/`, or the parent session.',
    '- Expected return packet shape and verification command, when applicable.',
    '',
    '## Context Rules',
    '',
    '- Do not request or paste the full parent transcript.',
    '- Read only the files needed for the objective.',
    '- Summarize logs; include only failing lines, paths, commands, and decisions.',
    '',
    '## Tool/Write Boundaries',
    '',
    toolBoundary(agent),
    '',
    '## Return Packet',
    '',
    '- Result: pass, findings, changed files, or blocked.',
    '- Files read and files changed.',
    '- Decisions made and risks that remain.',
    '- Verification run, including command and outcome.',
    '- Recommended next step for the parent session.',
    '',
    '## Stop Conditions',
    '',
    '- Stop when the requested packet is complete.',
    '- Stop if required context exceeds the input budget.',
    '- Stop if the task needs broader architecture, product, or permission decisions.',
  ].join('\n');
}

function toolBoundary(agent) {
  if (agent.tool_policy === 'read-only') {
    return '- Read-only. Do not edit, write, delete, or format files.';
  }
  if (agent.tool_policy === 'qa-write') {
    return '- Write only QA artifacts, test scripts, traces, screenshots, and reports unless the parent explicitly assigns a fix.';
  }
  if (agent.tool_policy === 'shell-limited') {
    return '- Shell commands are allowed only for inspection and targeted verification. Do not edit files unless explicitly assigned.';
  }
  return '- Edits are allowed only inside the files or module boundaries named in the input packet.';
}

function claudeToolsFor(agent, source) {
  if (source.metadata.tools) {
    return source.metadata.tools.split(',').map((tool) => tool.trim()).filter(Boolean);
  }
  return agent.tool_policy === 'read-only'
    ? ['Read', 'Grep', 'Glob']
    : ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'];
}

function copilotToolsFor(agent) {
  return agent.tool_policy === 'read-only'
    ? ['read', 'grep']
    : ['read', 'edit', 'terminal'];
}

function yamlString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function writeAgentIndex(projectRoot, agents, force) {
  const lines = [
    '# dev-workflow Agents',
    '',
    'These files are fallback prompt profiles for harnesses that do not expose native project subagents.',
    'Claude Code uses `.claude/agents/`; OpenCode uses `.opencode/agent/`; Copilot receives `.github/agents/*.agent.md`.',
    'Codex should treat this directory as delegable profiles when subagents are available, or as a manual prompt pack otherwise.',
    '',
    '| Agent | Module | Mode | Context | Output Budget | Purpose |',
    '|---|---|---|---|---:|---|',
  ];

  for (const agent of agents) {
    lines.push(`| \`${agent.name}\` | \`${agent.module}\` | \`${agent.mode}\` | \`${agent.context_mode}\` | ${agent.output_budget_words} words | ${agent.description} |`);
  }

  const content = lines.join('\n') + '\n';
  writeFile(path.join(projectRoot, '.agents', 'agents', 'README.md'), content, force);
}

function listExpectedAgentFiles(projectRoot, modules) {
  const files = [];
  for (const agent of selectAgents(modules)) {
    for (const target of Object.values(AGENT_TARGETS)) {
      files.push(path.join(projectRoot, target.dir, target.fileName(agent.name)));
    }
  }
  files.push(path.join(projectRoot, '.agents', 'agents', 'README.md'));
  return files;
}

function listLegacyAgentFiles(projectRoot, modules) {
  const files = [];
  for (const agent of selectAgents(modules)) {
    for (const target of Object.values(LEGACY_AGENT_TARGETS)) {
      files.push(path.join(projectRoot, target.dir, target.fileName(agent.name)));
    }
  }
  return files;
}

function ensureAgentDirs(projectRoot) {
  for (const target of Object.values(AGENT_TARGETS)) {
    ensureDir(path.join(projectRoot, target.dir));
  }
}

function removeLegacyAgentTargets(projectRoot, agents) {
  for (const target of Object.values(LEGACY_AGENT_TARGETS)) {
    for (const agent of agents) {
      const file = path.join(projectRoot, target.dir, target.fileName(agent.name));
      if (fs.existsSync(file)) fs.rmSync(file);
    }
    const dir = path.join(projectRoot, target.dir);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

module.exports = {
  AGENT_TARGETS,
  LEGACY_AGENT_TARGETS,
  readAgentRegistry,
  validateAgentRegistry,
  selectAgents,
  generateAgents,
  listExpectedAgentFiles,
  listLegacyAgentFiles,
  ensureAgentDirs,
};

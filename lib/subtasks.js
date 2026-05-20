const fs = require('fs');
const path = require('path');
const { ensureDir, writeFile } = require('./utils');
const { readAgentRegistry } = require('./agents');

const SUBTASKS_RELATIVE_DIR = path.join('.dw', 'subtasks');

function run(argv = []) {
  const action = argv[0];
  const flags = parseFlags(argv.slice(1));
  const projectRoot = process.cwd();

  switch (action) {
    case 'create':
      createSubtask(projectRoot, flags);
      break;
    case 'complete':
      completeSubtask(projectRoot, flags);
      break;
    case 'consume':
      consumeSubtasks(projectRoot);
      break;
    case 'list':
      listSubtasks(projectRoot);
      break;
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      throw new Error(`Unknown subtask action: ${action}`);
  }
}

function createSubtask(projectRoot, flags) {
  const agent = required(flags, 'agent');
  const goal = required(flags, 'goal');
  validateAgent(agent);
  ensureSubtaskLayout(projectRoot);

  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
  const slug = `${stamp}-${slugify(goal)}`;
  const dir = path.join(projectRoot, SUBTASKS_RELATIVE_DIR, 'pending', slug);
  ensureDir(dir);

  const task = [
    `# Subtask: ${goal}`,
    '',
    `- Slug: \`${slug}\``,
    `- Agent: \`${agent}\``,
    `- Created: ${now.toISOString()}`,
    '',
    '## Objective',
    goal,
    '',
    '## Allowed Files And Sources',
    flags.files || 'Parent must fill this before dispatch if the boundary is not obvious.',
    '',
    '## Constraints',
    flags.constraints || 'Use project rules. Do not request or paste the full parent transcript.',
    '',
    '## Expected Output',
    flags.output || 'Structured handoff with result, files read, files changed, decisions, risks, verification, next steps, and blockers.',
    '',
    '## Context Budget',
    flags.budget || 'Use the agent registry default. Return only summarized logs and relevant paths.',
    '',
    '## Stop Condition',
    flags.stop || 'Stop when the expected output packet is complete or the scope exceeds the packet.',
    '',
    '## Handoff Command',
    '',
    `When complete, write a handoff markdown file and run:`,
    '',
    '```bash',
    `npx @brunosps00/dev-workflow subtask complete --slug=${slug} --file=<handoff.md>`,
    '```',
    '',
  ].join('\n');

  writeFile(path.join(dir, 'TASK.md'), task, true);
  console.log(path.relative(projectRoot, path.join(dir, 'TASK.md')));
}

function completeSubtask(projectRoot, flags) {
  const slug = required(flags, 'slug');
  const handoffFile = required(flags, 'file');
  const taskDir = resolvePendingSubtask(projectRoot, slug);
  const sourcePath = path.resolve(projectRoot, handoffFile);
  if (!fs.existsSync(sourcePath)) throw new Error(`Handoff file not found: ${handoffFile}`);

  const content = fs.readFileSync(sourcePath, 'utf-8');
  validateHandoff(content);
  fs.writeFileSync(path.join(taskDir, 'HANDOFF.md'), content.endsWith('\n') ? content : `${content}\n`, 'utf-8');
  console.log(path.relative(projectRoot, path.join(taskDir, 'HANDOFF.md')));
}

function consumeSubtasks(projectRoot) {
  ensureSubtaskLayout(projectRoot);
  const pendingDir = path.join(projectRoot, SUBTASKS_RELATIVE_DIR, 'pending');
  const entries = fs.readdirSync(pendingDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const ready = entries
    .map((entry) => path.join(pendingDir, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'HANDOFF.md')));

  if (!ready.length) {
    console.log('No completed subtasks to consume.');
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const archiveDateDir = path.join(projectRoot, SUBTASKS_RELATIVE_DIR, 'archive', date);
  ensureDir(archiveDateDir);

  console.log('Subtask handoffs consumed:\n');
  for (const dir of ready) {
    const handoff = fs.readFileSync(path.join(dir, 'HANDOFF.md'), 'utf-8');
    const summary = summarizeHandoff(handoff);
    console.log(`- ${path.basename(dir)}: ${summary}`);
    fs.renameSync(dir, path.join(archiveDateDir, path.basename(dir)));
  }
  console.log('\nArchive updated. Promote durable lessons manually into .dw/STATE.md, .dw/rules/, or .dw/intel/ when they should survive beyond this workstream.');
}

function listSubtasks(projectRoot) {
  ensureSubtaskLayout(projectRoot);
  const pendingDir = path.join(projectRoot, SUBTASKS_RELATIVE_DIR, 'pending');
  const entries = fs.readdirSync(pendingDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (!entries.length) {
    console.log('No pending subtasks.');
    return;
  }
  for (const entry of entries) {
    const dir = path.join(pendingDir, entry.name);
    const state = fs.existsSync(path.join(dir, 'HANDOFF.md')) ? 'complete' : 'pending';
    console.log(`${entry.name}\t${state}`);
  }
}

function ensureSubtaskLayout(projectRoot) {
  const root = path.join(projectRoot, SUBTASKS_RELATIVE_DIR);
  ensureDir(path.join(root, 'pending'));
  ensureDir(path.join(root, 'archive'));
  const gitignore = ['pending/', 'archive/', '', '!/.gitignore', ''].join('\n');
  writeFile(path.join(root, '.gitignore'), gitignore, false);
}

function validateAgent(agentName) {
  const registry = readAgentRegistry();
  if (!registry.agents.some((agent) => agent.name === agentName)) {
    throw new Error(`Unknown agent: ${agentName}`);
  }
}

function validateHandoff(content) {
  const requiredHeadings = [
    'Objective',
    'Result',
    'Files Read',
    'Files Changed',
    'Decisions',
    'Risks',
    'Verification',
    'Next Steps',
    'Blocked Or Not Done',
  ];
  const missing = requiredHeadings.filter((heading) => !new RegExp(`^##\\s+${escapeRegExp(heading)}\\b`, 'mi').test(content));
  if (missing.length) {
    throw new Error(`Handoff is missing required headings: ${missing.join(', ')}`);
  }
}

function summarizeHandoff(content) {
  const result = extractSection(content, 'Result') || firstNonEmptyLine(content) || 'handoff recorded';
  const verification = extractSection(content, 'Verification');
  const next = extractSection(content, 'Next Steps');
  const parts = [compact(result)];
  if (verification) parts.push(`verification: ${compact(verification)}`);
  if (next) parts.push(`next: ${compact(next)}`);
  return parts.join(' | ');
}

function extractSection(content, heading) {
  const match = content.match(new RegExp(`^##\\s+${escapeRegExp(heading)}\\b\\s*\\n([\\s\\S]*?)(?=^##\\s+|\\s*$)`, 'mi'));
  return match ? match[1].trim() : '';
}

function firstNonEmptyLine(content) {
  return content.split('\n').map((line) => line.trim()).find(Boolean) || '';
}

function compact(value) {
  return value.replace(/\s+/g, ' ').slice(0, 220);
}

function resolvePendingSubtask(projectRoot, slug) {
  const pendingDir = path.join(projectRoot, SUBTASKS_RELATIVE_DIR, 'pending');
  if (!fs.existsSync(pendingDir)) throw new Error('No pending subtasks directory. Run subtask create first.');
  const direct = path.join(pendingDir, slug);
  if (fs.existsSync(direct)) return direct;
  const matches = fs.readdirSync(pendingDir).filter((entry) => entry === slug || entry.endsWith(`-${slug}`));
  if (matches.length === 1) return path.join(pendingDir, matches[0]);
  if (matches.length > 1) throw new Error(`Ambiguous slug: ${slug}`);
  throw new Error(`Pending subtask not found: ${slug}`);
}

function parseFlags(args) {
  const flags = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;
    const raw = arg.slice(2);
    if (raw.includes('=')) {
      const [key, ...rest] = raw.split('=');
      flags[key] = rest.join('=');
    } else {
      const next = args[index + 1];
      flags[raw] = next && !next.startsWith('--') ? next : true;
      if (flags[raw] === next) index++;
    }
  }
  return flags;
}

function required(flags, name) {
  if (!flags[name] || flags[name] === true) throw new Error(`Missing required flag: --${name}`);
  return String(flags[name]);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'subtask';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function printHelp() {
  console.log(`
  dev-workflow subtask

  Usage:
    npx @brunosps00/dev-workflow subtask create --agent=<name> --goal="<goal>"
    npx @brunosps00/dev-workflow subtask complete --slug=<slug> --file=<handoff.md>
    npx @brunosps00/dev-workflow subtask consume
    npx @brunosps00/dev-workflow subtask list
`);
}

module.exports = {
  run,
  ensureSubtaskLayout,
  createSubtask,
  completeSubtask,
  consumeSubtasks,
  listSubtasks,
};

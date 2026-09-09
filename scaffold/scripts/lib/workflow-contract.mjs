import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const tools = new Set(['local', 'codex', 'claude', 'copilot']);
const tiers = new Set(['light', 'standard', 'heavy']);

// A small executable contract for the agent-authored execution-plan.json.
// This validates assignments, not account access or authorization on its own.
export function validatePlan(plan) {
  const issues = [];
  if (!plan || !['1.0', '1.1'].includes(plan.schema_version)) return ['Unsupported execution plan schema'];
  if (!Array.isArray(plan.tasks) || !plan.tasks.length) return ['tasks must be a nonempty array'];
  if (typeof plan.approved !== 'boolean') issues.push('approved must be a boolean');
  const ids = new Set();
  for (const task of plan.tasks) {
    if (!task || typeof task.id !== 'string' || !task.id.trim()) {
      issues.push('Every task needs a nonempty string id');
      continue;
    }
    if (ids.has(task.id)) issues.push(`Duplicate task ${task.id}`);
    ids.add(task.id);
    if (!Array.isArray(task.depends_on) || task.depends_on.some(id => typeof id !== 'string')) issues.push(`${task.id}: depends_on must be a string array`);
    if (plan.schema_version === '1.1' && !task.execution) issues.push(`${task.id}: missing execution assignment`);
    if (task.execution) {
      const e = task.execution;
      if (typeof e !== 'object' || Array.isArray(e)) { issues.push(`${task.id}: execution must be an object`); continue; }
      if (!tiers.has(e.complexity)) issues.push(`${task.id}: invalid complexity`);
      if (typeof e.rationale !== 'string' || !e.rationale.trim()) issues.push(`${task.id}: missing rationale`);
      if (!Array.isArray(e.agents) || e.agents.some(a => typeof a !== 'string')) issues.push(`${task.id}: agents must be a string array`);
      for (const assignment of [e, ...(Array.isArray(e.fallbacks) ? e.fallbacks : [])]) {
        if (!assignment || typeof assignment !== 'object' || Array.isArray(assignment)) { issues.push(`${task.id}: invalid fallback assignment`); continue; }
        if (!tools.has(assignment.tool)) issues.push(`${task.id}: invalid tool`);
        if (typeof assignment.model !== 'string' || !assignment.model.trim()) issues.push(`${task.id}: missing model`);
        if (typeof assignment.effort !== 'string' || !assignment.effort.trim()) issues.push(`${task.id}: missing effort`);
        if (assignment.tool !== 'local' && [assignment.model, assignment.effort].includes('inherit')) issues.push(`${task.id}: external assignments must resolve model and effort`);
      }
      if (e.fallbacks !== undefined && !Array.isArray(e.fallbacks)) issues.push(`${task.id}: fallbacks must be an array`);
    }
  }
  const tasks = new Map(plan.tasks.filter(t => t?.id).map(t => [t.id, t]));
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { issues.push(`Dependency cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of tasks.get(id)?.depends_on || []) {
      if (!ids.has(dep)) issues.push(`${id}: unknown dependency ${dep}`);
      else visit(dep);
    }
    visiting.delete(id); visited.add(id);
  }
  if (!issues.length) for (const id of ids) visit(id);
  return issues;
}

export function resolveAssignment(plan, taskId, availableTools) {
  const issues = validatePlan(plan);
  if (issues.length) throw new Error(issues.join('; '));
  if (plan.approved !== true) throw new Error('Execution plan is not approved');
  const task = plan.tasks.find(t => t.id === taskId);
  if (!task) throw new Error(`Unknown task ${taskId}`);
  // Legacy plans never imply permission to start another CLI.
  const assignment = task.execution || { tool: 'local', model: 'inherit', effort: 'inherit', agents: [] };
  const candidates = [assignment, ...(assignment.fallbacks || [])];
  const chosen = candidates.find(c => availableTools.includes(c.tool));
  if (!chosen) throw new Error(`No approved executor available for ${taskId}`);
  return { ...chosen, agents: assignment.agents || [], fallback: chosen !== assignment };
}

export function readyTasks(plan, completedIds) {
  const issues = validatePlan(plan);
  if (issues.length) throw new Error(issues.join('; '));
  const done = new Set(completedIds);
  return plan.tasks.filter(t => !done.has(t.id) && t.depends_on.every(id => done.has(id))).map(t => t.id);
}

// Callers fingerprint actual inputs (including relevant untracked files) and
// environment. Unknown values fail closed. Time/message boundaries are irrelevant.
export function reusableEvidence(evidence, current) {
  if (!evidence || evidence.exit_code !== 0 || !current) return false;
  for (const key of ['command', 'input_fingerprint', 'environment_fingerprint']) {
    if (typeof current[key] !== 'string' || !current[key] || evidence[key] !== current[key]) return false;
  }
  return Array.isArray(current.scope) && current.scope.length > 0 && Array.isArray(evidence.scope)
    && current.scope.every(item => evidence.scope.includes(item));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, file, taskId, available = 'local'] = process.argv.slice(2);
    if (!['validate', 'resolve', 'ready'].includes(mode) || !file) throw new Error('Usage: workflow-contract.mjs validate|resolve|ready <plan.json> [task-id|completed-csv] [available-tools-csv]');
    const plan = JSON.parse(readFileSync(file, 'utf8'));
    if (mode === 'validate') {
      const issues = validatePlan(plan);
      console.log(JSON.stringify({ status: issues.length ? 'BLOCKED' : 'PASS', issues }));
      if (issues.length) process.exitCode = 1;
    } else if (mode === 'resolve') console.log(JSON.stringify(resolveAssignment(plan, taskId, available.split(','))));
    else console.log(JSON.stringify(readyTasks(plan, taskId ? taskId.split(',') : [])));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

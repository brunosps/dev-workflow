#!/usr/bin/env node
/**
 * dev-workflow session cost tracker — Claude Code SessionEnd hook.
 *
 * On session end, parses the session transcript (JSONL at `transcript_path`),
 * sums token usage per model, estimates USD via ../lib/model-prices.json, and
 * appends ONE cumulative row to .dw/metrics/costs.jsonl. The statusline and
 * `/dw-context-budget` (Part B) read that file to report real spend.
 *
 * Token counts are what Claude Code records per assistant turn (each turn bills
 * the full input, mostly cache_read); summing across turns matches billing.
 * USD is a best-effort ESTIMATE from a local price table — tokens are exact.
 *
 * The same pass also counts which skills the session's tool calls referenced,
 * emitted as `skills` on the row. `/dw-skill-health` reads it as usage evidence.
 * An absent `skills` key means the row predates this instrumentation; `{}` means
 * the session was observed and nothing fired — those are different facts.
 *
 * Contract: reads the SessionEnd payload as JSON on stdin. Fails SAFE — any
 * error exits 0 without writing, so a hook bug never disrupts the session.
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/.dw/scripts/hooks
const DW_DIR = resolve(HOOK_DIR, '..', '..'); // <root>/.dw
const PRICES_PATH = join(HOOK_DIR, '..', 'lib', 'model-prices.json'); // .dw/scripts/lib/
const PROJECT_ROOT = resolve(DW_DIR, '..'); // <root>

function readStdin() {
  return new Promise((resolve_) => {
    let data = '';
    if (process.stdin.isTTY) return resolve_('');
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve_(data));
    process.stdin.on('error', () => resolve_(''));
  });
}

function loadPrices() {
  try {
    return JSON.parse(readFileSync(PRICES_PATH, 'utf-8')).models || {};
  } catch {
    return {};
  }
}

function priceFor(models, model) {
  return models[model] || models['_default'] || { input: 3, output: 15, cache_write: 3.75, cache_read: 0.3 };
}

// Skills this project could plausibly load, as the keys usage counting is allowed
// to emit. Without this bound, any path segment under a skills/ directory would
// become a key and the metrics file would grow without limit.
function knownSkills() {
  const names = new Set();
  try {
    const registry = JSON.parse(readFileSync(join(DW_DIR, 'skill-registry.json'), 'utf-8'));
    for (const entry of registry.skills || []) if (entry && entry.name) names.add(entry.name);
  } catch {
    /* no installed registry — fall back to what is on disk */
  }
  const isDir = (p) => {
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  };
  for (const base of ['.agents/skills', '.claude/skills']) {
    const root = join(PROJECT_ROOT, base);
    if (!isDir(root)) continue;
    let top;
    try {
      top = readdirSync(root);
    } catch {
      continue;
    }
    for (const name of top) {
      const dir = join(root, name);
      if (!isDir(dir)) continue;
      if (existsSync(join(dir, 'SKILL.md'))) {
        names.add(name);
        continue;
      }
      // A grouping directory (e.g. vendor bundles installed under one folder):
      // the skill is one level deeper, and `group/skill` is its honest name.
      let nested;
      try {
        nested = readdirSync(dir);
      } catch {
        continue;
      }
      for (const child of nested) {
        if (existsSync(join(dir, child, 'SKILL.md'))) names.add(`${name}/${child}`);
      }
    }
  }
  return names;
}

// Matches a skills/ path inside a tool call's input, capturing at most two
// segments so a grouped `group/skill` is preserved.
const SKILL_PATH = /(?:\.agents|\.claude)\/skills\/([A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)?)\//g;

// Count skill references in ONE assistant message.
//
// Scope is deliberate and narrow: assistant turns only, `tool_use` blocks only,
// and only the block's `input`. Scanning the raw line would also count a
// `tool_result` that returned the CONTENTS of a SKILL.md (those cite other
// skills) and a user prompt that merely names one — both would report a skill as
// fired when it never was. What this measures is loading, not obedience.
function countSkillUses(msg, known, out) {
  const content = msg && msg.content;
  if (!Array.isArray(content)) return;
  for (const block of content) {
    if (!block || block.type !== 'tool_use' || !block.input) continue;
    // One tool call is one reference per skill, however many times its input
    // names that skill. A grep over three files under the same skill directory
    // is one load, not three.
    const seen = new Set();
    if (block.name === 'Skill' && typeof block.input.skill === 'string' && known.has(block.input.skill)) {
      seen.add(block.input.skill);
    }
    let serialized;
    try {
      serialized = JSON.stringify(block.input);
    } catch {
      serialized = '';
    }
    if (serialized) {
      SKILL_PATH.lastIndex = 0;
      let match;
      while ((match = SKILL_PATH.exec(serialized)) !== null) {
        const full = match[1];
        const name = known.has(full) ? full : full.split('/')[0];
        if (known.has(name)) seen.add(name);
      }
    }
    for (const name of seen) out[name] = (out[name] || 0) + 1;
  }
}

// Sum per-turn usage from the transcript, grouped by model, and count which
// skills the session's tool calls referenced.
function tallyTranscript(transcriptPath, known) {
  const byModel = {};
  const skills = {};
  let raw;
  try {
    raw = readFileSync(transcriptPath, 'utf-8');
  } catch {
    return { byModel, skills };
  }
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (obj.type !== 'assistant') continue;
    const msg = obj && obj.message;
    try {
      countSkillUses(msg, known, skills);
    } catch {
      /* usage evidence is best-effort — never let it break cost tracking */
    }
    const u = msg && msg.usage;
    if (!u) continue;
    const model = (msg && msg.model) || '_unknown';
    const m = (byModel[model] ||= { input: 0, output: 0, cache_write: 0, cache_read: 0 });
    m.input += u.input_tokens || 0;
    m.output += u.output_tokens || 0;
    m.cache_write += u.cache_creation_input_tokens || 0;
    m.cache_read += u.cache_read_input_tokens || 0;
  }
  return { byModel, skills };
}

async function main() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    return process.exit(0); // fail safe
  }
  const transcriptPath = payload && payload.transcript_path;
  if (!transcriptPath || !existsSync(transcriptPath)) return process.exit(0);

  let known;
  try {
    known = knownSkills();
  } catch {
    known = new Set();
  }
  const { byModel, skills } = tallyTranscript(transcriptPath, known);
  const modelNames = Object.keys(byModel);
  if (modelNames.length === 0) return process.exit(0); // nothing to record

  const prices = loadPrices();
  let totalUsd = 0;
  let totalTokens = 0;
  const models = {};
  for (const name of modelNames) {
    const t = byModel[name];
    const p = priceFor(prices, name);
    const usd =
      (t.input * p.input + t.output * p.output + t.cache_write * p.cache_write + t.cache_read * p.cache_read) / 1e6;
    totalUsd += usd;
    totalTokens += t.input + t.output + t.cache_write + t.cache_read;
    models[name] = { ...t, usd: Number(usd.toFixed(4)) };
  }

  const row = {
    ts: new Date().toISOString(),
    session_id: (payload && payload.session_id) || null,
    reason: (payload && payload.reason) || null,
    total_usd: Number(totalUsd.toFixed(4)),
    total_tokens: totalTokens,
    models,
    // Always emitted, even empty: `{}` records an observed session with no skill
    // reference, while an absent key marks a row written before this existed.
    skills,
  };

  try {
    const metricsDir = join(DW_DIR, 'metrics');
    if (!existsSync(metricsDir)) mkdirSync(metricsDir, { recursive: true });
    appendFileSync(join(metricsDir, 'costs.jsonl'), JSON.stringify(row) + '\n');
  } catch {
    /* fail safe — never disrupt the session */
  }
  process.exit(0);
}

main().catch(() => process.exit(0));

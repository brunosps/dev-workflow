'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read } = require('./_helpers');

const SKILL = 'scaffold/skills/dw-cli-run/SKILL.md';
const ADAPTERS = {
  claude: { en: 'scaffold/en/commands/dw-claude-run.md', pt: 'scaffold/pt-br/commands/dw-claude-run.md' },
  codex: { en: 'scaffold/en/commands/dw-codex-run.md', pt: 'scaffold/pt-br/commands/dw-codex-run.md' },
};

// The WRITE/READ-ONLY split is what lets a read-only dispatch skip the worktree.
// If either half of the rule goes missing, a writing CLI could land in the main
// checkout — the exact corruption the original hard rule existed to prevent.
test('dw-cli-run keeps the WRITE worktree rule while allowing READ-ONLY in the main checkout', () => {
  const skill = read(SKILL);

  assert.match(skill, /a WRITE dispatch runs \*\*only\*\* inside a \*\*dedicated git worktree\*\*/);
  assert.match(skill, /A READ-ONLY dispatch MAY run in the main checkout/);
  assert.match(skill, /When in doubt, treat it as WRITE/);
  assert.match(skill, /Never pass an auto-approve flag on a dispatch declared READ-ONLY/);
});

// Model/effort/no-mcp must be declared slots, otherwise the routing table has
// nothing to bind to and every dispatch silently inherits the CLI default.
test('dw-cli-run declares the dispatch slots the routing table binds to', () => {
  const skill = read(SKILL);
  for (const slot of ['`MODEL`', '`EFFORT`', '`AUTO`', '`AUTO_READONLY`', '`NO_MCP`']) {
    assert.ok(skill.includes(slot), `${SKILL}: missing adapter slot ${slot}`);
  }
  assert.match(skill, /\.dw\/config\/routing\.json/);
});

test('both adapters fill every dispatch slot, in both languages', () => {
  for (const [brand, files] of Object.entries(ADAPTERS)) {
    for (const [lang, rel] of Object.entries(files)) {
      const body = read(rel);
      for (const slot of ['`MODEL`', '`EFFORT`', '`AUTO`', '`AUTO_READONLY`', '`NO_MCP`']) {
        assert.ok(body.includes(slot), `${rel} (${brand}/${lang}): missing slot ${slot}`);
      }
    }
  }
});

// Verified against claude 2.1.220 and codex-cli 0.144.4. A wrong flag here means
// the dispatch boots every MCP server and pays the startup cost it meant to skip.
test('MCP kill switches use the flags each CLI actually supports', () => {
  for (const lang of ['en', 'pt']) {
    assert.match(read(ADAPTERS.claude[lang]), /--strict-mcp-config/);
    assert.match(read(ADAPTERS.codex[lang]), /mcp_servers='\{\}'/);
  }
});

test('routing.json ships a resolvable tier for every commit type it maps', () => {
  const routing = JSON.parse(read('scaffold/config/routing.json'));

  assert.equal(routing.schema_version, '1.0');
  assert.deepEqual(Object.keys(routing.brands).sort(), ['claude', 'codex']);

  for (const [type, tier] of Object.entries(routing.by_commit_type)) {
    if (type.startsWith('_')) continue;
    assert.ok(routing.tiers[tier], `by_commit_type.${type} points at unknown tier "${tier}"`);
  }
  assert.ok(routing.tiers[routing.escalate_on_surface.tier], 'escalate_on_surface points at unknown tier');

  for (const [name, tier] of Object.entries(routing.tiers)) {
    for (const brand of ['claude', 'codex']) {
      assert.ok(tier[brand] && tier[brand].model, `tier ${name} has no model for ${brand}`);
      assert.ok(tier[brand].effort, `tier ${name} has no effort for ${brand}`);
    }
  }
});

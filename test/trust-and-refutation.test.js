'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, exists, FILES } = require('./_helpers');

// Every command that ingests text the project does not own.
const INGESTING_COMMANDS = [
  'dw-triage',
  'dw-review',
  'dw-bugfix',
  'dw-secure-audit',
  'dw-find-skills',
  'dw-install-aws-skills',
  'dw-install-azure-skills',
];

test('the untrusted-input contract ships in both locales', () => {
  for (const locale of ['en', 'pt-br']) {
    const rel = `scaffold/${locale}/references/untrusted-input.md`;
    assert.ok(exists(rel), `${rel} must exist — it is the canonical rule the anchors point at`);
  }
});

test('every command that ingests external text cites the contract, in both locales', () => {
  for (const locale of ['en', 'pt-br']) {
    for (const command of INGESTING_COMMANDS) {
      const rel = `scaffold/${locale}/commands/${command}.md`;
      assert.match(
        read(rel),
        /\.dw\/references\/untrusted-input\.md/,
        `${rel} must point at the untrusted-input contract`
      );
    }
  }
});

test('the rule also loads unconditionally, not only inside a command', () => {
  // A pasted issue with no command invoked still has to be treated as data.
  for (const locale of ['en', 'pt-br']) {
    assert.match(read(FILES.agentInstructions[locale === 'en' ? 'en' : 'pt']), /untrusted-input\.md/);
  }
});

test('dw-review-rigor routes every candidate to exactly one of three exits', () => {
  const skill = read('scaffold/skills/dw-review-rigor/SKILL.md');
  for (const token of ['needs-validation', 'rejected', 'dw-finding-refuter', 'references/refutation-pass.md']) {
    assert.ok(skill.includes(token), `SKILL.md must mention ${token}`);
  }
  assert.ok(exists('scaffold/skills/dw-review-rigor/references/refutation-pass.md'));
});

test('the prior-round machine points at directories /dw-review actually writes', () => {
  const skill = read('scaffold/skills/dw-review-rigor/SKILL.md');
  assert.ok(
    !skill.includes('.dw/spec/prd-*/reviews/') && !skill.includes('.dw/spec/*/reviews/'),
    'that path is never created by any command — findings written there are lost'
  );
  assert.ok(skill.includes('<target>/QA/') && skill.includes('<target>/review/'));
});

test('dw-review-rigor keeps real headroom under the hard 8000-byte entrypoint ceiling', () => {
  const bytes = Buffer.byteLength(read('scaffold/skills/dw-review-rigor/SKILL.md'));
  assert.ok(
    bytes <= 7500,
    `SKILL.md is ${bytes} bytes; keep it at 7500 or below so the next edit does not discover the 8000 ceiling by failing validate`
  );
});

test('the refuter agent is registered read-only, dispatched by /dw-review, and inherits its model', () => {
  const registry = JSON.parse(read('scaffold/agent-registry.json'));
  const agent = registry.agents.find((a) => a.name === 'dw-finding-refuter');
  assert.ok(agent, 'dw-finding-refuter must be in the agent registry');
  assert.equal(agent.mode, 'read-only');
  assert.equal(agent.tool_policy, 'read-only');
  // A fresh context is what makes "without the reasoning that produced it" enforceable.
  assert.equal(agent.context_mode, 'fresh');
  assert.ok(registry.commands['dw-review'].includes('dw-finding-refuter'));

  const source = read('scaffold/agents/core/dw-finding-refuter.md');
  assert.ok(exists('scaffold/agents/core/dw-finding-refuter.md'));
  assert.ok(!/^model:/m.test(source), 'core agents must render as `model: inherit`');
  for (const verdict of ['REFUTED', 'HOLDS', 'UNRESOLVED']) {
    assert.ok(source.includes(verdict), `the agent must emit ${verdict}`);
  }
});

test('the skill that fetches the web treats what it fetched as data', () => {
  // dw-source-grounding declares WebFetch and feeds fetched docs into techspecs.
  // Fetched page text is text the project does not own.
  const skill = read('scaffold/skills/dw-source-grounding/SKILL.md');
  assert.match(skill, /\.dw\/references\/untrusted-input\.md/);
  assert.match(skill, /untrusted/i);
  // /dw-brainstorm --mode=research is the owner command; the rule must be visible
  // there too, before the fetching starts.
  for (const locale of ['en', 'pt-br']) {
    assert.match(read(`scaffold/${locale}/commands/dw-brainstorm.md`), /untrusted-input\.md/);
    // /dw-plan mandates web search + Context7 MCP before naming the grounding skill.
    assert.match(read(`scaffold/${locale}/commands/dw-plan.md`), /untrusted-input\.md/);
  }
});

test('the security gate carries the third verdict too', () => {
  assert.match(read('scaffold/skills/security-review/SKILL.md'), /needs-validation/);
  for (const locale of ['en', 'pt-br']) {
    assert.match(read(`scaffold/${locale}/commands/dw-secure-audit.md`), /needs-validation/);
  }
});

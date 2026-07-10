'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, exists, REGISTRY, SKILLS } = require('./_helpers');
const { validateSkillRegistry } = require('../lib/skill-registry');
const { buildManifests } = require('../lib/build-plugin');

const INTERNAL = ['dw-grilling', 'dw-domain-modeling'];

test('skill registry validates with no issues', () => {
  const { issues } = validateSkillRegistry();
  assert.deepEqual(issues, [], `registry issues: ${issues.join('; ')}`);
});

test('internal Grill skills are registered, bundled, and non-exportable', () => {
  const registry = JSON.parse(read(REGISTRY));
  for (const name of INTERNAL) {
    const entry = registry.skills.find((s) => s.name === name);
    assert.ok(entry, `registry entry missing: ${name}`);
    assert.equal(entry.kind, 'protocol', `${name} should be a protocol`);
    assert.equal(entry.exportable, false, `${name} must be exportable:false`);
    assert.equal(entry.bundled, true, `${name} must be bundled:true`);
    assert.ok(entry.owner && entry.owner.length, `${name} must declare an owner`);
    assert.ok(entry.context_limit > 0, `${name} needs a positive context_limit`);
  }
});

test('internal Grill skills own SKILL.md + reference files', () => {
  assert.ok(exists(SKILLS.grilling), 'dw-grilling SKILL.md missing');
  assert.ok(exists(SKILLS.domainModeling), 'dw-domain-modeling SKILL.md missing');
  assert.ok(exists('scaffold/skills/dw-grilling/references/interview-loop.md'));
  assert.ok(exists('scaffold/skills/dw-grilling/references/decision-tree.md'));
  assert.ok(exists('scaffold/skills/dw-domain-modeling/references/glossary-format.md'));
  assert.ok(exists('scaffold/skills/dw-domain-modeling/references/adr-policy.md'));
});

test('internal Grill skills do NOT leak into the à-la-carte plugin manifest', () => {
  const { exportable, plugin } = buildManifests();
  for (const name of INTERNAL) {
    assert.ok(!exportable.includes(name), `${name} must not be exportable`);
    assert.ok(
      !plugin.skills.some((p) => p.endsWith(`/${name}`)),
      `${name} must not appear in plugin.json skills`
    );
  }
});

test('both internal skills carry the required Structured Return contract', () => {
  for (const rel of [SKILLS.grilling, SKILLS.domainModeling]) {
    const body = read(rel);
    assert.ok(body.includes('## Structured Return'), `${rel} missing Structured Return`);
    for (const field of ['**Status:**', '**Scope:**', '**Evidence:**', '**Artifacts:**', '**Decisions:**', '**Risks:**', '**Next Step:**']) {
      assert.ok(body.includes(field), `${rel} missing ${field}`);
    }
    const statusLine = body.split(/\r?\n/).find((l) => l.includes('**Status:**')) || '';
    for (const status of ['`PASS`', '`FINDINGS`', '`BLOCKED`', '`NOT_APPLICABLE`']) {
      assert.ok(statusLine.includes(status), `${rel} Status line missing ${status}`);
    }
  }
});

test('internal skills use only skill-creator-allowed frontmatter keys', () => {
  const allowed = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
  for (const rel of [SKILLS.grilling, SKILLS.domainModeling]) {
    const body = read(rel);
    const fm = body.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(fm, `${rel} missing YAML frontmatter`);
    const keys = fm[1]
      .split(/\r?\n/)
      .filter((l) => /^[A-Za-z0-9_-]+:/.test(l))
      .map((l) => l.split(':')[0]);
    for (const k of keys) {
      assert.ok(allowed.has(k), `${rel} frontmatter has disallowed key: ${k}`);
    }
    // description must not contain angle brackets (skill-creator validator rule).
    const desc = (fm[1].match(/description:\s*"([\s\S]*?)"/) || [])[1] || '';
    assert.ok(!/[<>]/.test(desc), `${rel} description must not contain < or >`);
  }
});

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, exists } = require('./_helpers');

const SKILL = 'scaffold/skills/dw-chaos-engineering/SKILL.md';

test('the chaos skill is registered explicit-invocation and stays non-exportable', () => {
  const registry = JSON.parse(read('scaffold/skill-registry.json'));
  const entry = registry.skills.find((s) => s.name === 'dw-chaos-engineering');
  assert.ok(entry, 'missing registry entry');
  // ship-it locked theirs deliberately — it is the only one of their seven skills
  // with the lock. Chaos writes files, runs the whole suite and costs real time;
  // firing unprompted inside another flow would surprise.
  assert.equal(entry.invocation, 'explicit', 'chaos must never auto-invoke');
  assert.ok(!entry.exportable, 'chaos is tied to the .dw/ pipeline; keep it out of the plugin manifest');
  assert.ok(exists('scaffold/skills/dw-chaos-engineering/references/vector-catalog.md'));
});

test('the hard limits survive editing', () => {
  const skill = read(SKILL);
  for (const [token, why] of [
    ['Local only', 'a chaos run that reaches staging or prod is an incident, not a test'],
    ['Tests only', 'production code is read-only — finding and fixing are separate roles'],
    ['Three rounds', 'without a cap the skill always finds one more vector and never delivers'],
    ['theatrical chaos', 'padding the report with impossible scenarios makes the whole run worthless'],
  ]) {
    assert.ok(skill.includes(token), `${token} must stay: ${why}`);
  }
});

test('the baseline gate comes before the first attack', () => {
  const skill = read(SKILL);
  // With a red baseline you cannot distinguish a finding from a broken environment,
  // so every classification after it is worthless.
  const baseline = skill.indexOf('Baseline gate');
  const build = skill.indexOf('Build the arsenal');
  assert.ok(baseline > 0, 'no baseline gate');
  assert.ok(baseline < build, 'the baseline gate must precede building attacks');
  assert.match(skill, /red baseline/i);
});

test('each result has exactly one destination', () => {
  const skill = read(SKILL);
  for (const verdict of ['KILLED', 'SURVIVED', 'INCONCLUSIVE']) {
    assert.ok(skill.includes(verdict), `missing ${verdict}`);
  }
  // A kill found before merge must block it; a kill found after must not reopen
  // landed work. Collapsing the two is how a known defect reaches main.
  assert.match(skill, /open PR/);
  assert.match(skill, /\/dw-bugfix/);
  assert.match(skill, /unskipped/);
});

test('it composes with dw-testing-discipline instead of restating it', () => {
  const skill = read(SKILL);
  assert.match(skill, /dw-testing-discipline/, 'test-writing rules belong to that skill, not this one');
});

test('both locales cite it as by-name-only', () => {
  for (const locale of ['en', 'pt-br']) {
    for (const command of ['dw-qa', 'dw-review']) {
      const body = read(`scaffold/${locale}/commands/${command}.md`);
      assert.match(body, /dw-chaos-engineering/, `${locale} ${command} must cite the skill`);
      assert.match(body, /by name only|só por nome/, `${locale} ${command} must mark it as explicit`);
    }
  }
});

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, exists } = require('./_helpers');

// Nothing in lib/ validates a reference cited from a command body: the routed-reference
// regex in lib/instruction-health.js only reads SKILL.md and only matches skill-relative
// paths, so `.dw/references/*.md` never matches. Without this file the floor could be
// deleted, or its pointer dropped, and every gate would still pass.

test('the floor ships in both locales', () => {
  for (const locale of ['en', 'pt-br']) {
    assert.ok(
      exists(`scaffold/${locale}/references/invariants.md`),
      `scaffold/${locale}/references/invariants.md is the floor the constitution points at`
    );
  }
});

test('the constitution says the ADR escape does not reach the floor', () => {
  for (const locale of ['en', 'pt-br']) {
    const constitution = read(`scaffold/${locale}/templates/constitution-template.md`);
    assert.match(
      constitution,
      /\.dw\/references\/invariants\.md/,
      `${locale} constitution must name the floor — otherwise the ADR escape reads as unbounded`
    );
  }
});

test('the floor covers destructive git and secrets, and only those', () => {
  for (const locale of ['en', 'pt-br']) {
    const floor = read(`scaffold/${locale}/references/invariants.md`);
    for (const token of [
      'git push --force',
      'git reset --hard',
      'git clean -f',
      'git branch -D',
      'git worktree remove --force',
      'git restore .',
      '.git/**',
      '--no-verify',
      '`.env*`',
      '`*.pem`',
    ]) {
      assert.ok(floor.includes(token), `${locale} floor must name ${token}`);
    }
  }
});

test('the floor states the direction: project rules may only tighten', () => {
  for (const locale of ['en', 'pt-br']) {
    const floor = read(`scaffold/${locale}/references/invariants.md`);
    // A floor without this is just a list; the direction is what makes it a floor.
    assert.match(floor, /untrusted-input\.md/, `${locale}: loosening must route to the untrusted-content rule`);
    assert.match(floor, /CONTRIBUTING\.md/, `${locale}: the Layer 2 sources must be enumerated`);
  }
});

test('every automode surface cites the contract and enumerates its stops', () => {
  // The stop lists are per-command on purpose: a global list would be either too
  // broad to respect or too narrow to be true. This asserts each one exists and
  // routes to the shared contract — nothing validates a `.dw/references/*.md`
  // citation from a command body otherwise.
  const AUTOMODE = [
    'dw-autopilot', 'dw-run', 'dw-goal',
    'dw-codex-run', 'dw-claude-run', 'dw-copilot-run',
  ];
  for (const locale of ['en', 'pt-br']) {
    assert.ok(exists(`scaffold/${locale}/references/automode.md`), `${locale} automode contract missing`);
    for (const command of AUTOMODE) {
      const body = read(`scaffold/${locale}/commands/${command}.md`);
      assert.match(body, /\.dw\/references\/automode\.md/, `${locale} ${command} must cite the contract`);
      assert.match(body, /^## (Stops|Paradas)$/m, `${locale} ${command} must enumerate its stops`);
      assert.match(body, /invariants\.md/, `${locale} ${command} must name the floor as a stop`);
    }
  }
  assert.match(read('scaffold/skills/dw-cli-run/SKILL.md'), /automode\.md/);
});

test('the automode contract refuses a fifth status and says why', () => {
  for (const locale of ['en', 'pt-br']) {
    const contract = read(`scaffold/${locale}/references/automode.md`);
    assert.match(contract, /`BLOCKED`/, `${locale}: a stop maps to BLOCKED`);
    assert.match(contract, /`PARKED`/, `${locale}: must name the rejected status to keep the decision visible`);
    assert.match(contract, /second runtime|segundo runtime/, `${locale}: must disclaim the runtime reading`);
  }
});

test('the floor is honest about where the hook does not reach', () => {
  for (const locale of ['en', 'pt-br']) {
    const floor = read(`scaffold/${locale}/references/invariants.md`);
    // git-guardrails.mjs fails open in four places and only covers Bash under Claude Code.
    // A floor that implies the hook enforces it would be claiming a guarantee we do not have.
    assert.match(floor, /git-guardrails\.mjs/, `${locale} must name the partial implementation`);
    for (const uncovered of ['filter-branch', 'reflog expire', 'commit --amend']) {
      assert.ok(floor.includes(uncovered), `${locale} must name ${uncovered} as beyond the hook`);
    }
  }
});

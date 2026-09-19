const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const { COMMANDS } = require('../lib/constants');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('dw-new-project keeps the docs-first NestJS contract in both languages', () => {
  for (const locale of ['en', 'pt-br']) {
    const command = read(`scaffold/${locale}/commands/dw-new-project.md`);
    const onePager = read(`scaffold/${locale}/templates/project-onepager.md`);

    assert.match(command, /docs-first/);
    assert.match(command, /Next\.js \+ NestJS/);
    assert.match(command, /pnpm workspaces \+ Turborepo/);
    assert.match(command, /Postgres/);
    assert.match(command, /pg-boss/);
    assert.match(command, /Mailpit/);
    assert.match(command, /apps (?:on|no) host/);
    assert.match(command, /@nestjs\/cli@latest new/);
    assert.match(
      command,
      locale === 'en'
        ? /Apps scaffolded directly into `apps\/web\/` or `apps\/api\/` are already in place and must not be moved again/
        : /Apps scaffoldados diretamente em `apps\/web\/` ou `apps\/api\/` ja estao no lugar e nao devem ser movidos novamente/
    );

    assert.match(onePager, /NestJS/);
    assert.match(onePager, /Postgres/);
    assert.match(onePager, /pg-boss/);
    assert.match(onePager, /Mailpit/);
  }
});

// The recipe files are covered by compose-recipe-safety.test.js; this covers the
// prose around them, where a "just use app/app to get started" example is just as
// reachable and does not show up in a YAML scan.
test('no compose surface recommends a working credential', () => {
  const envConventions = read(
    'scaffold/skills/docker-compose-recipes/references/env-conventions.md'
  );
  const surfaces = [
    'scaffold/skills/docker-compose-recipes/references/env-conventions.md',
    'scaffold/skills/docker-compose-recipes/references/prod-vs-dev.md',
    'scaffold/skills/docker-compose-recipes/references/compose-composition.md',
    'scaffold/skills/docker-compose-recipes/SKILL.md',
    'scaffold/en/commands/dw-new-project.md',
    'scaffold/en/commands/dw-dockerize.md',
    'scaffold/en/templates/project-onepager.md',
    'scaffold/pt-br/commands/dw-new-project.md',
    'scaffold/pt-br/commands/dw-dockerize.md',
    'scaffold/pt-br/templates/project-onepager.md',
  ];
  const content = surfaces.map(read).join('\n');

  for (const pattern of [
    /POSTGRES_PASSWORD=app\b/,
    /MYSQL_ROOT_PASSWORD=root\b/,
    /MINIO_ROOT_PASSWORD=minio\d+/,
    /\$\{[A-Z0-9_]*(PASSWORD|PASS|MASTER_KEY|SECRET|TOKEN):-/,
  ]) {
    assert.doesNotMatch(content, pattern, `a compose surface documents a working credential: ${pattern}`);
  }

  assert.match(envConventions, /^POSTGRES_PASSWORD=$/m);
});

// Removed 2026-08-02: the bundled image carried CRITICALs with no upstream fix and
// no bundled artifact could clear them. If it returns, it must come back as a
// deliberate decision with its own audit — not by someone re-adding a recipe file.
test('no bundled pgvector recipe ships', () => {
  const servicesDir = path.join(
    root,
    'scaffold',
    'skills',
    'docker-compose-recipes',
    'services'
  );
  const recipes = fs.readdirSync(servicesDir);

  assert.ok(!recipes.includes('postgres-pgvector.yml'), 'postgres-pgvector.yml is back');

  const withPgvectorImage = recipes.filter((f) =>
    /image:\s*\S*pgvector/.test(fs.readFileSync(path.join(servicesDir, f), 'utf8'))
  );
  assert.deepEqual(withPgvectorImage, [], `recipe(s) reference a pgvector image: ${withPgvectorImage}`);
});

test('Mailpit is the maintained, pinned email capture default', () => {
  const skill = read('scaffold/skills/docker-compose-recipes/SKILL.md');
  const recipe = read('scaffold/skills/docker-compose-recipes/services/mailpit.yml');

  assert.match(skill, /Email-in-dev defaults to Mailpit/);
  assert.match(recipe, /axllent\/mailpit:v1\.30/);
  assert.match(recipe, /MP_DATABASE: \/data\/mailpit\.db/);
});

test('deep-modules documents seam dependency categories and interface alternatives', () => {
  const reference = read('scaffold/skills/dw-simplification/references/deep-modules.md');

  for (const token of [
    'Dependency categories decide seam tests',
    'Design It Twice for interface findings',
    'in-process',
    'local-substitutable',
    'remote owned',
    'true external',
    'dw-testing-discipline',
    'Interface alternatives considered',
  ]) {
    assert.match(reference, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('dw-triage is registered and documents local-first intake routing', () => {
  for (const locale of ['en', 'pt-br']) {
    const command = read(`scaffold/${locale}/commands/dw-triage.md`);
    const record = read(`scaffold/${locale}/templates/triage-record-template.md`);
    const needsInfo = read(`scaffold/${locale}/templates/triage-needs-info-template.md`);
    const outOfScope = read(`scaffold/${locale}/templates/triage-out-of-scope-template.md`);
    const entry = COMMANDS[locale].find((cmd) => cmd.name === 'dw-triage');

    assert.ok(entry, `missing dw-triage command registry entry for ${locale}`);
    assert.match(command, /\.dw\/triage\//);

    for (const token of [
      '.dw/triage/NNN-<slug>.md',
      '.dw/out-of-scope/<concept>.md',
      'needs-triage',
      'needs-info',
      'ready-for-work',
      'needs-human',
      'wontfix',
      '/dw-bugfix',
      '/dw-plan prd',
      '/dw-brainstorm --mode=grill',
      'gh',
      'already implemented',
      'insufficient-detail',
    ]) {
      assert.match(command, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.match(record, /type: triage-record/);
    assert.match(record, /category: "bug \| enhancement"/);
    assert.match(record, /state: "needs-triage \| needs-info \| ready-for-work \| needs-human \| wontfix"/);
    assert.match(needsInfo, /needs-info/);
    assert.match(needsInfo, /needs-triage/);
    assert.match(outOfScope, /type: out-of-scope/);
    assert.match(outOfScope, /wontfix/);
  }
});

test('idea one-pager carries a resumable Grill Decision Map contract', () => {
  for (const locale of ['en', 'pt-br']) {
    const onePager = read(`scaffold/${locale}/templates/idea-onepager.md`);

    for (const token of [
      '### Decision Map',
      '**Frontier:**',
      'Depends on:',
      '`resolved`',
      'open-ready',
      'open-blocked',
      '#### Decision Fog',
      'Resolved Decisions',
    ]) {
      assert.match(onePager, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});

test('dw-report is registered, documents the progress loop, and is auto-armed by long-running commands', () => {
  for (const locale of ['en', 'pt-br']) {
    const command = read(`scaffold/${locale}/commands/dw-report.md`);
    const run = read(`scaffold/${locale}/commands/dw-run.md`);
    const autopilot = read(`scaffold/${locale}/commands/dw-autopilot.md`);
    const help = read(`scaffold/${locale}/commands/dw-help.md`);
    // The routing surface is split: the managed block carries the common paths and
    // command-routing.md carries the full Trigger Map. A trigger may live in either,
    // so search both — and say so when it is missing, instead of blaming one file.
    const routing = read(`scaffold/${locale}/agent-instructions.md`) + read(`scaffold/${locale}/references/command-routing.md`);
    const entry = COMMANDS[locale].find((cmd) => cmd.name === 'dw-report');

    assert.ok(entry, `missing dw-report command registry entry for ${locale}`);
    assert.match(command, /\.dw\/reports\/YYYY-MM-DD\.md/);
    assert.match(command, /--every <N>m/);
    assert.ok(!entry.userInvoked, 'dw-report must stay model-invocable so the trigger map can fire it');

    for (const token of [
      '--every <N>m',
      '/dw-report now',
      '/dw-report status',
      '/dw-report stop',
      '.dw/reports/.active.json',
      'DW_REPORT_AUTO',
      'DW_REPORT_BELL',
      'wakeup | background-bash',
      '"working | blocked | finished"',
      '📊 FINAL Report —',
      '➕',
    ]) {
      assert.ok(command.includes(token), `${locale} dw-report missing ${JSON.stringify(token)}`);
    }

    // Auto-arm contract: the long-running commands arm the loop and respect the opt-out.
    assert.ok(run.includes('/dw-report'), `${locale} dw-run must arm /dw-report`);
    assert.ok(run.includes('DW_REPORT_AUTO=off'), `${locale} dw-run must honor DW_REPORT_AUTO=off`);
    assert.ok(autopilot.includes('/dw-report'), `${locale} dw-autopilot must arm /dw-report`);
    assert.ok(autopilot.includes('DW_REPORT_AUTO=off'), `${locale} dw-autopilot must honor DW_REPORT_AUTO=off`);
    assert.ok(help.includes('/dw-report [--every <N>m]'), `${locale} dw-help must list /dw-report`);
    assert.ok(routing.includes('/dw-report [--every <N>m]'), `${locale} routing surface (agent-instructions.md + references/command-routing.md) must trigger /dw-report`);
  }

  const cliRun = read('scaffold/skills/dw-cli-run/SKILL.md');
  assert.ok(cliRun.includes('/dw-report'), 'dw-cli-run must arm /dw-report before a WRITE run');
  assert.ok(cliRun.includes('DW_REPORT_AUTO=off'), 'dw-cli-run must honor DW_REPORT_AUTO=off');
  assert.ok(cliRun.includes('armed_by: dw-cli-run'), 'dw-cli-run must record itself as armed_by');
});

test('dw-worktree is registered, ships its GC script, and is wired into runners, pause, audit, and guardrails', () => {
  assert.ok(fs.existsSync(path.join(root, 'scaffold/scripts/lib/worktree-gc.mjs')), 'worktree-gc.mjs missing');
  for (const locale of ['en', 'pt-br']) {
    const command = read(`scaffold/${locale}/commands/dw-worktree.md`);
    const pause = read(`scaffold/${locale}/commands/dw-pause.md`);
    const audit = read(`scaffold/${locale}/commands/dw-harness-audit.md`);
    const help = read(`scaffold/${locale}/commands/dw-help.md`);
    // The routing surface is split: the managed block carries the common paths and
    // command-routing.md carries the full Trigger Map. A trigger may live in either,
    // so search both — and say so when it is missing, instead of blaming one file.
    const routing = read(`scaffold/${locale}/agent-instructions.md`) + read(`scaffold/${locale}/references/command-routing.md`);
    const entry = COMMANDS[locale].find((cmd) => cmd.name === 'dw-worktree');

    assert.ok(entry, `missing dw-worktree command registry entry for ${locale}`);
    assert.match(command, /worktree-gc\.mjs/);
    assert.match(command, /--force/);

    for (const token of ['REMOVABLE', 'KEEP:unmerged', 'KEEP:dirty', 'KEEP:in-use', '--ff-only', 'git worktree remove --force']) {
      assert.ok(command.includes(token), `${locale} dw-worktree missing ${JSON.stringify(token)}`);
    }
    assert.ok(pause.includes('worktree-gc.mjs list'), `${locale} dw-pause must sweep worktrees`);
    assert.ok(pause.includes('/dw-worktree clean --apply'), `${locale} dw-pause must close REMOVABLE loops`);
    assert.ok(audit.includes('Worktree hygiene'), `${locale} dw-harness-audit must score worktree hygiene`);
    assert.ok(audit.includes('worktree-gc.mjs list --strict'), `${locale} dw-harness-audit must run list --strict`);
    assert.ok(help.includes('/dw-worktree'), `${locale} dw-help must list /dw-worktree`);
    assert.ok(routing.includes('/dw-worktree clean --apply'), `${locale} routing surface (agent-instructions.md + references/command-routing.md) must trigger /dw-worktree`);

    for (const runner of ['dw-codex-run', 'dw-claude-run', 'dw-copilot-run']) {
      const adapter = read(`scaffold/${locale}/commands/${runner}.md`);
      assert.ok(adapter.includes('/dw-worktree create <slug>'), `${locale} ${runner} must create via /dw-worktree`);
      assert.ok(adapter.includes('/dw-worktree merge <slug>'), `${locale} ${runner} must remove via /dw-worktree merge`);
    }
  }

  const cliRun = read('scaffold/skills/dw-cli-run/SKILL.md');
  assert.ok(cliRun.includes('/dw-worktree create <slug>'), 'dw-cli-run pre-flight must create via /dw-worktree');
  assert.match(cliRun, /authorized merge and cleanup in the same turn/, 'runner cleanup follows authorized integration');
  assert.ok(cliRun.includes('/dw-worktree merge <slug>'), 'dw-cli-run discipline must merge+remove via /dw-worktree');

  const guardrails = read('scaffold/scripts/hooks/git-guardrails.mjs');
  assert.match(guardrails, /worktree\\s\+remove/);
});

// `userInvoked` renders `disable-model-invocation: true` into the Claude wrapper.
// The mechanism still exists for a consumer's own command, but NO bundled command
// uses it any more: the lock is not an authorization gate, and every place it was
// applied already had explicit approval upstream (`/dw-plan tasks` cross-tool
// assignment, the owner asking for the design run). On top of that approval it only
// made the user retype a command they had already authorized. Re-locking a bundled
// command is a product decision — make it here, deliberately, and update
// docs/skills-ecosystem-comparison.md in the same change.
test('no bundled command carries the invocation lock', () => {
  for (const locale of ['en', 'pt-br']) {
    const locked = COMMANDS[locale].filter((cmd) => cmd.userInvoked).map((cmd) => cmd.name);
    assert.deepEqual(
      locked,
      [],
      `${locale}: ${locked.join(', ')} carries userInvoked. If that is intended, say why here and in the comparison doc.`
    );
  }
});

test('the comparison doc does not claim a bundled command is user-invoked', () => {
  const doc = read('docs/skills-ecosystem-comparison.md');
  for (const locale of ['en']) {
    for (const cmd of COMMANDS[locale]) {
      assert.ok(
        !new RegExp(`\`${cmd.name}\`[^.]{0,200}recebem \`userInvoked: true\``).test(doc),
        `docs must not list ${cmd.name} as user-invoked — no bundled command is`
      );
    }
  }
});

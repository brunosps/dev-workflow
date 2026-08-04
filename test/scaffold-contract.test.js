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
    assert.match(entry.description, /\.dw\/triage\//);

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

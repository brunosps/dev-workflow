const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

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
    assert.match(command, /Postgres \+ pgvector/);
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
    assert.match(onePager, /Postgres\s?\+\s?pgvector/);
    assert.match(onePager, /pg-boss/);
    assert.match(onePager, /Mailpit/);
  }
});

// Deliberately a tag, not a digest. A digest pin froze the base image and the same
// bytes went from 1 to 22 CRITICAL in three weeks with no upgrade path. If someone
// re-adds a digest here, that regression comes back silently.
test('pgvector recipe tracks a rebuildable tag and requires local-only credentials', () => {
  const recipe = read('scaffold/skills/docker-compose-recipes/services/postgres-pgvector.yml');

  assert.match(recipe, /^  image: pgvector\/pgvector:0\.8\.6-pg18-trixie$/m);
  assert.doesNotMatch(recipe, /@sha256:/, 'digest pin blocks base-image security rebuilds');
  assert.match(
    recipe,
    /POSTGRES_PASSWORD: \$\{POSTGRES_PASSWORD:\?Set POSTGRES_PASSWORD in \.env\}/
  );
  assert.match(recipe, /- "127\.0\.0\.1:\$\{POSTGRES_PORT:-5432\}:5432"/);
  assert.match(recipe, /postgres_data:\/var\/lib\/postgresql/);
  assert.match(recipe, /CREATE EXTENSION IF NOT EXISTS vector/);
});

test('pgvector scaffold surfaces never recommend a known password', () => {
  const envConventions = read(
    'scaffold/skills/docker-compose-recipes/references/env-conventions.md'
  );
  const pgvectorSurfaces = [
    'scaffold/skills/docker-compose-recipes/services/postgres-pgvector.yml',
    'scaffold/skills/docker-compose-recipes/references/env-conventions.md',
    'scaffold/skills/docker-compose-recipes/references/prod-vs-dev.md',
    'scaffold/skills/docker-compose-recipes/SKILL.md',
    'scaffold/en/commands/dw-new-project.md',
    'scaffold/en/commands/dw-dockerize.md',
    'scaffold/en/templates/project-onepager.md',
    'scaffold/pt-br/commands/dw-new-project.md',
    'scaffold/pt-br/commands/dw-dockerize.md',
    'scaffold/pt-br/templates/project-onepager.md',
  ];
  const content = pgvectorSurfaces.map(read).join('\n');

  assert.doesNotMatch(content, /POSTGRES_PASSWORD=app\b/);
  assert.doesNotMatch(content, /\$\{POSTGRES_PASSWORD:-app\}/);
  assert.match(envConventions, /^POSTGRES_PASSWORD=$/m);
});

// The image reference is read from the recipe rather than hard-coded, so a version
// bump lands in one file instead of nine. Hard-coding it here is what let the docs
// drift from the recipe in the first place.
test('pgvector documentation restricts the bundled image to trusted local development', () => {
  const recipe = read('scaffold/skills/docker-compose-recipes/services/postgres-pgvector.yml');
  const imageRef = (recipe.match(/^\s*image:\s*(\S+)$/m) || [])[1];
  assert.ok(imageRef, 'pgvector recipe declares no image');

  const skill = read('scaffold/skills/docker-compose-recipes/SKILL.md');
  const prodVsDev = read('scaffold/skills/docker-compose-recipes/references/prod-vs-dev.md');

  assert.match(skill, /trusted single-user local workstation/i);
  assert.match(skill, /production, (?:on )?remote development hosts, or (?:on )?shared CI runners/i);
  assert.ok(prodVsDev.includes(imageRef), `prod-vs-dev.md must reference ${imageRef}`);
  assert.match(
    prodVsDev,
    /production, (?:on )?remote development hosts, or (?:on )?shared CI runners/i
  );

  for (const locale of ['en', 'pt-br']) {
    const surfaces = {
      [`${locale}/dw-new-project.md`]: read(`scaffold/${locale}/commands/dw-new-project.md`),
      [`${locale}/dw-dockerize.md`]: read(`scaffold/${locale}/commands/dw-dockerize.md`),
      [`${locale}/project-onepager.md`]: read(`scaffold/${locale}/templates/project-onepager.md`),
    };

    for (const [label, surface] of Object.entries(surfaces)) {
      assert.ok(surface.includes(imageRef), `${label} must reference ${imageRef}`);
      assert.match(surface, /shared CI runner|runner de CI compartilhado/i);
    }
  }
});

test('Mailpit is the maintained, pinned email capture default', () => {
  const skill = read('scaffold/skills/docker-compose-recipes/SKILL.md');
  const recipe = read('scaffold/skills/docker-compose-recipes/services/mailpit.yml');

  assert.match(skill, /Email-in-dev defaults to Mailpit/);
  assert.match(recipe, /axllent\/mailpit:v1\.30/);
  assert.match(recipe, /MP_DATABASE: \/data\/mailpit\.db/);
});

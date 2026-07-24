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

test('pgvector recipe pins the approved PostgreSQL 18 image and data path', () => {
  const recipe = read('scaffold/skills/docker-compose-recipes/services/postgres-pgvector.yml');

  assert.match(recipe, /pgvector\/pgvector:0\.8\.2-pg18/);
  assert.match(recipe, /postgres_data:\/var\/lib\/postgresql/);
  assert.match(recipe, /CREATE EXTENSION IF NOT EXISTS vector/);
});

test('Mailpit is the maintained, pinned email capture default', () => {
  const skill = read('scaffold/skills/docker-compose-recipes/SKILL.md');
  const recipe = read('scaffold/skills/docker-compose-recipes/services/mailpit.yml');

  assert.match(skill, /Email-in-dev defaults to Mailpit/);
  assert.match(recipe, /axllent\/mailpit:v1\.30/);
  assert.match(recipe, /MP_DATABASE: \/data\/mailpit\.db/);
});

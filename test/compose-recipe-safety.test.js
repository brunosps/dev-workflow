'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SERVICES_DIR = path.join(
  __dirname,
  '..',
  'scaffold',
  'skills',
  'docker-compose-recipes',
  'services'
);

const recipes = fs
  .readdirSync(SERVICES_DIR)
  .filter((f) => f.endsWith('.yml'))
  .map((f) => ({ name: f, body: fs.readFileSync(path.join(SERVICES_DIR, f), 'utf8') }));

// A credential written in a public repository is not a credential. `:-value` supplies
// a default when the variable is unset; `:?message` refuses to start instead. The
// 2026-07-15 audit raised this against the pgvector recipe, it was fixed only there,
// and the 2026-08-02 audit found the same defect in six siblings. These tests exist so
// the next fix cannot be scoped to whichever file happens to be in the diff.
const CREDENTIAL_KEY = /^\s*([A-Z0-9_]*(PASSWORD|PASS|MASTER_KEY|SECRET|TOKEN|API_KEY))\s*:\s*(.+)$/;

test('no compose recipe ships a default value for a credential', () => {
  const offenders = [];

  for (const { name, body } of recipes) {
    body.split('\n').forEach((line, i) => {
      if (line.trimStart().startsWith('#')) return;
      const m = line.match(CREDENTIAL_KEY);
      if (!m) return;
      // `${VAR:-default}` supplies a fallback; `${VAR:?msg}` and bare `${VAR}` do not.
      if (/\$\{[A-Z0-9_]+:-/.test(m[3])) {
        offenders.push(`${name}:${i + 1} ${m[1]} → ${m[3].trim()}`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `credential defaults must use \${VAR:?message}, not \${VAR:-value}:\n  ${offenders.join('\n  ')}`
  );
});

test('every credential-bearing recipe binds its published ports to loopback', () => {
  const offenders = [];

  for (const { name, body } of recipes) {
    const guardsACredential = /\$\{[A-Z0-9_]*(PASSWORD|PASS|MASTER_KEY|SECRET|TOKEN|API_KEY)[A-Z0-9_]*:\?/.test(body);
    if (!guardsACredential) continue;

    body.split('\n').forEach((line, i) => {
      const m = line.match(/^\s*-\s*"([^"]+)"\s*$/);
      if (!m || !/:\d+$/.test(m[1])) return;
      // Docker publishes HOST:CONTAINER on every host interface unless a host IP leads.
      if (!m[1].startsWith('127.0.0.1:')) {
        offenders.push(`${name}:${i + 1} → "${m[1]}"`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `authenticated services must publish on 127.0.0.1 only:\n  ${offenders.join('\n  ')}`
  );
});

// A digest freezes the base image. Between 2026-07-15 and 2026-08-02 the pinned
// pgvector digest went from 1 to 22 CRITICAL without the image changing at all,
// because only the vulnerability database moved. Tags let a rebuild reach users.
test('no recipe pins an image by digest', () => {
  const pinned = recipes
    .filter(({ body }) => /image:\s*\S+@sha256:/.test(body))
    .map(({ name }) => name);

  assert.deepEqual(pinned, [], `digest pins block base-image security rebuilds: ${pinned.join(', ')}`);
});

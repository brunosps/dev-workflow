'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, includes } = require('./_helpers');

// Language-neutral invariant tokens that must appear in BOTH the EN and PT-BR
// copy of each changed contract. These are the load-bearing strings other
// commands and tests rely on — parity means neither language drifts.
const PARITY = {
  brainstorm: [
    '--mode=grill',
    '.dw/domain/glossary.md',
    '.dw/domain/context-map.md',
    '.dw/domain/contexts/<slug>.md',
    'dw-grilling',
    'dw-domain-modeling',
    'schema `1.1`',
    '--scope=repo|prd',
    'status: aligned',
    '_Avoid:_',
    'mutu', // mutually / mutuamente exclusive
  ],
  adr: [
    '--scope=repo|prd',
    '.dw/adrs/adr-NNN.md',
    '{{PRD_PATH}}/adrs/adr-NNN.md',
    'scope: repo | prd',
    'schema_version: "1.1"',
    '.dw/STATE.md',
    'feat/prd-<slug>',
  ],
  adrTemplate: [
    'scope: repo | prd',
    'schema_version: "1.1"',
    '## Alternatives Considered',
    '## Consequences',
    '## Related',
  ],
  plan: [
    'coverage matri', // coverage matrix / matrices
    'status: aligned',
    '.dw/domain/',
    'schema `1.1`',
    'Resolved Decisions',
    'Canonical Vocabulary',
  ],
  analyze: [
    '.dw/domain/**',
    '../domain/glossary.md',
    '../domain/context-map.md',
    'PRESERVE',
  ],
  claudeRun: [
    '--effort <EFFORT>',
    '2.1.206',
    'xhigh',
  ],
  run: [
    'TDD',
    'test first',
    'red-green-refactor',
    'references/tdd-loop.md',
    'dw-simplification',
  ],
  bugfix: [
    'red-capable',
    'Loop command before fix',
    'Loop command after fix',
    'HITL',
    'references/six-step-triage.md',
  ],
  onepager: [
    'schema_version: "1.1"',
    'status: draft | paused | aligned',
    '## Grill Alignment',
    'Resolved Decisions',
    'Canonical Vocabulary',
    'Remaining Decisions',
    'Alignment State',
    '.dw/domain/',
    'confirmed_by_user',
  ],
  openDesign: [
    'OD_CLI_DIR',
    '~/.dw/vendor/open-design',
    'OD_DATA_DIR',
    '## 0.',
    '<target>/PROMPT-<slug>.md',
    '<OUTPUT_FILE>.artifact.json',
    '<=6',
    '--refactor',
    '--url <url>',
    '--viewports',
    '--screenshot <path>',
    'capture-current.mjs',
    '_refs/<slug>/',
    '1440x900,375x812',
    '1920x1080',
    '768x1024',
    'atual-1440-light.png',
    'atual-375-dark.png',
    'OD_CHAT_RUN_INACTIVITY_TIMEOUT_MS=1800000',
    '--agent "$AGENT"',
    'web-prototype',
    'design-system default',
    '.dw/.open-design/state.json',
    '.dw/.open-design/runs/',
    'gate-prototype.mjs',
    '?aberto=<id>',
    'replaceState',
    'role="dialog"',
    'codex_core::shell_snapshot',
    '`codex`',
    '`claude`',
  ],
};

for (const [name, tokens] of Object.entries(PARITY)) {
  const { en, pt } = FILES[name];
  const enBody = read(en);
  const ptBody = read(pt);
  test(`EN/PT parity — ${name}`, () => {
    for (const token of tokens) {
      includes(assert, enBody, token, `EN ${en}`);
      includes(assert, ptBody, token, `PT ${pt}`);
    }
  });
}

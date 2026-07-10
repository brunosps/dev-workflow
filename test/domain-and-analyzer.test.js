'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, SKILLS, includes } = require('./_helpers');

const domain = read(SKILLS.domainModeling);
const glossaryFmt = read('scaffold/skills/dw-domain-modeling/references/glossary-format.md');
const bEn = read(FILES.brainstorm.en);
const bPt = read(FILES.brainstorm.pt);
const aEn = read(FILES.analyze.en);
const aPt = read(FILES.analyze.pt);

test('native domain artifacts use the .dw/domain allowlist paths', () => {
  for (const src of [domain, glossaryFmt]) {
    includes(assert, src, '.dw/domain/glossary.md', 'domain-modeling');
    includes(assert, src, '.dw/domain/context-map.md', 'domain-modeling');
    includes(assert, src, '.dw/domain/contexts/<slug>.md', 'domain-modeling');
  }
});

test('single-context is the default; multi-context routes to context-map + per-context', () => {
  includes(assert, glossaryFmt, 'single-context default', 'glossary-format');
  includes(assert, glossaryFmt, 'clashes across bounded contexts', 'glossary-format');
});

test('domain artifacts are created lazily and only with authorization', () => {
  includes(assert, domain, 'lazily', 'domain-modeling');
  includes(assert, domain, 'authoriz', 'domain-modeling');
});

test('domain glossary is not stored in root CONTEXT.md or .dw/rules', () => {
  includes(assert, domain, 'never** to root `CONTEXT.md`', 'domain-modeling');
  includes(assert, domain, 'auto-generated', 'domain-modeling');
});

test('brainstorm grill lists the exact allowed stateful writes (EN)', () => {
  includes(assert, bEn, '`.dw/domain/**`', 'EN brainstorm');
  includes(assert, bEn, '`.dw/spec/ideas/<slug>.md`', 'EN brainstorm');
  includes(assert, bEn, 'after showing the proposed change', 'EN brainstorm');
  includes(assert, bEn, '/dw-adr --scope=repo|prd', 'EN brainstorm');
});

test('brainstorm grill lists the exact allowed stateful writes (PT)', () => {
  includes(assert, bPt, '`.dw/domain/**`', 'PT brainstorm');
  includes(assert, bPt, '`.dw/spec/ideas/<slug>.md`', 'PT brainstorm');
  includes(assert, bPt, 'depois de mostrar a mudança proposta', 'PT brainstorm');
  includes(assert, bPt, '/dw-adr --scope=repo|prd', 'PT brainstorm');
});

test('analyzer reads/links .dw/domain and never regenerates it (EN)', () => {
  includes(assert, aEn, 'NEVER regenerate, merge, or overwrite it', 'EN analyze');
  includes(assert, aEn, '../domain/glossary.md', 'EN analyze');
  includes(assert, aEn, 'the Grill flow owns `.dw/domain/**`', 'EN analyze');
  includes(assert, aEn, 'never regenerated or overwritten', 'EN analyze');
});

test('analyzer reads/links .dw/domain and never regenerates it (PT)', () => {
  includes(assert, aPt, 'NUNCA pode regenerar, mesclar ou sobrescrevê-lo', 'PT analyze');
  includes(assert, aPt, '../domain/glossary.md', 'PT analyze');
  includes(assert, aPt, 'o fluxo de Grill é dono de `.dw/domain/**`', 'PT analyze');
  includes(assert, aPt, 'nunca regenerado ou sobrescrito', 'PT analyze');
});

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, includes } = require('./_helpers');

const aEn = read(FILES.adr.en);
const aPt = read(FILES.adr.pt);

test('ADR routes repo vs prd scope to the right directory (EN + PT)', () => {
  for (const [label, body] of [['EN adr', aEn], ['PT adr', aPt]]) {
    includes(assert, body, '--scope=repo|prd', label);
    includes(assert, body, '.dw/adrs/adr-NNN.md', label);
    includes(assert, body, '{{PRD_PATH}}/adrs/adr-NNN.md', label);
    includes(assert, body, 'scope: repo | prd', label);
  }
});

test('repo scope works before any PRD (EN + PT)', () => {
  includes(assert, aEn, 'before any PRD exists', 'EN adr');
  includes(assert, aPt, 'antes de qualquer PRD existir', 'PT adr');
});

test('default resolution: unique PRD -> prd, none -> repo, multiple -> ask (EN)', () => {
  includes(assert, aEn, 'Exactly one active PRD', 'EN adr');
  includes(assert, aEn, 'No PRD exists', 'EN adr');
  includes(assert, aEn, 'do not guess', 'EN adr');
});

test('default resolution: unique PRD -> prd, none -> repo, multiple -> ask (PT)', () => {
  includes(assert, aPt, 'Exatamente um PRD ativo', 'PT adr');
  includes(assert, aPt, 'Nenhum PRD existe', 'PT adr');
  includes(assert, aPt, 'não adivinhe', 'PT adr');
});

test('ADR gate requires all three criteria plus explicit approval (EN)', () => {
  includes(assert, aEn, 'hard to reverse', 'EN adr');
  includes(assert, aEn, 'surprising without context', 'EN adr');
  includes(assert, aEn, 'genuine trade-off', 'EN adr');
  includes(assert, aEn, 'explicit user approval', 'EN adr');
});

test('ADR gate requires all three criteria plus explicit approval (PT)', () => {
  includes(assert, aPt, 'difícil de reverter', 'PT adr');
  includes(assert, aPt, 'surpreendente sem contexto', 'PT adr');
  includes(assert, aPt, 'trade-off real', 'PT adr');
  includes(assert, aPt, 'aprovação explícita do usuário', 'PT adr');
});

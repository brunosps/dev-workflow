'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, includes } = require('./_helpers');

const pEn = read(FILES.plan.en);
const pPt = read(FILES.plan.pt);
const oEn = read(FILES.onepager.en);
const oPt = read(FILES.onepager.pt);

test('idea one-pager is at schema 1.1 with the alignment sections (EN + PT)', () => {
  for (const [label, body] of [['EN onepager', oEn], ['PT onepager', oPt]]) {
    includes(assert, body, 'schema_version: "1.1"', label);
    includes(assert, body, 'status: draft | paused | aligned', label);
    includes(assert, body, 'Resolved Decisions', label);
    includes(assert, body, 'Evidence', label);
    includes(assert, body, 'Canonical Vocabulary', label);
    includes(assert, body, 'Remaining Decisions', label);
    includes(assert, body, 'Alignment State', label);
    includes(assert, body, 'confirmed_by_user', label);
  }
});

test('/dw-plan consumes an aligned handoff and does not re-ask resolved decisions (EN)', () => {
  includes(assert, pEn, 'does NOT ask a fixed number of questions', 'EN plan');
  includes(assert, pEn, 'Never re-ask a product decision the user already resolved during Grill', 'EN plan');
  includes(assert, pEn, 'status: aligned', 'EN plan');
  includes(assert, pEn, 'Resolved Decisions', 'EN plan');
  includes(assert, pEn, 'coverage matrix', 'EN plan');
});

test('/dw-plan consumes an aligned handoff and does not re-ask resolved decisions (PT)', () => {
  includes(assert, pPt, 'NÃO faz um número fixo de perguntas', 'PT plan');
  includes(assert, pPt, 'Nunca re-pergunte uma decisão de produto que o usuário já resolveu no Grill', 'PT plan');
  includes(assert, pPt, 'status: aligned', 'PT plan');
  includes(assert, pPt, 'Resolved Decisions', 'PT plan');
  includes(assert, pPt, 'coverage matrix', 'PT plan');
});

test('coverage matrices cover the required PRD + TechSpec dimensions (EN + PT)', () => {
  for (const [label, body] of [['EN plan', pEn], ['PT plan', pPt]]) {
    // PRD dimension (English term kept verbatim in both copies)
    includes(assert, body, 'edge cases', label);
    // TechSpec dimensions (English terms kept verbatim in both copies)
    includes(assert, body, 'domain placement', label);
    includes(assert, body, 'data flow', label);
    includes(assert, body, 'reuse-vs-build', label);
  }
  // Language-specific PRD metric dimension.
  includes(assert, pEn, 'success metrics', 'EN plan');
  includes(assert, pPt, 'métricas de sucesso', 'PT plan');
});

test('the fixed 7-question quotas are gone (EN + PT)', () => {
  assert.ok(!pEn.includes('MINIMUM 7'), 'EN plan still has a MINIMUM 7 quota');
  assert.ok(!pPt.includes('MÍNIMO 7'), 'PT plan still has a MÍNIMO 7 quota');
});

test('technical decisions may still be asked during TechSpec (EN + PT)', () => {
  includes(assert, pEn, 'may still be asked during TechSpec', 'EN plan');
  includes(assert, pPt, 'ainda podem ser perguntadas durante o TechSpec', 'PT plan');
});

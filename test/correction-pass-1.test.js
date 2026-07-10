'use strict';

// Regression tests for parent-gate correction pass 1. Each assertion is written
// to FAIL on the pre-correction behavior and PASS after the fix.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, includes, excludes } = require('./_helpers');

const adrEn = read(FILES.adr.en);
const adrPt = read(FILES.adr.pt);
const tplEn = read(FILES.adrTemplate.en);
const tplPt = read(FILES.adrTemplate.pt);
const planEn = read(FILES.plan.en);
const planPt = read(FILES.plan.pt);
const bEn = read(FILES.brainstorm.en);
const bPt = read(FILES.brainstorm.pt);
const adrPolicy = read('scaffold/skills/dw-domain-modeling/references/adr-policy.md');

// ---- Finding 1: ADR template/command schema coherence -----------------------

test('F1: ADR templates carry scope + schema 1.1 + conditional prd (EN + PT)', () => {
  for (const [label, body] of [['EN adr-template', tplEn], ['PT adr-template', tplPt]]) {
    includes(assert, body, 'scope: repo | prd', label);
    includes(assert, body, 'schema_version: "1.1"', label);
    includes(assert, body, 'n/a', label); // conditional prd for repo scope
    includes(assert, body, 'scope=repo', label); // Related section conditionality
    excludes(assert, body, 'schema_version: "1.0"', label); // old schema gone
  }
});

test('F1: templates keep the required Consequences/Alternatives shape (EN + PT)', () => {
  for (const [label, body] of [['EN adr-template', tplEn], ['PT adr-template', tplPt]]) {
    includes(assert, body, '## Alternatives Considered', label);
    includes(assert, body, '## Consequences', label);
    includes(assert, body, '## Related', label);
  }
});

test('F1: ADR command embedded example matches the template schema (EN + PT)', () => {
  for (const [label, body] of [['EN adr', adrEn], ['PT adr', adrPt]]) {
    includes(assert, body, 'schema_version: "1.1"', label);
    excludes(assert, body, 'schema_version: "1.0"', label);
    includes(assert, body, 'scope: repo | prd', label);
  }
});

test('F1: ADR command no longer scopes itself to the current PRD phase', () => {
  excludes(assert, adrEn, 'during the current PRD phase', 'EN adr');
  excludes(assert, adrPt, 'fase atual do PRD', 'PT adr');
});

// ---- Finding 2: fail-closed aligned handoff ---------------------------------

test('F2: /dw-plan fails closed and requires confirmed_by_user (EN)', () => {
  includes(assert, planEn, 'FAIL CLOSED', 'EN plan');
  includes(assert, planEn, 'alignment.confirmed_by_user: true', 'EN plan');
  includes(assert, planEn, 'input, not a trusted handoff', 'EN plan');
  includes(assert, planEn, 'Never suppress a product question on the strength of `status: aligned` alone', 'EN plan');
  includes(assert, planEn, 'blocking', 'EN plan');
});

test('F2: /dw-plan fails closed and requires confirmed_by_user (PT)', () => {
  includes(assert, planPt, 'FALHE FECHADO', 'PT plan');
  includes(assert, planPt, 'alignment.confirmed_by_user: true', 'PT plan');
  includes(assert, planPt, 'input, não handoff confiável', 'PT plan');
  includes(assert, planPt, 'Nunca suprima uma pergunta de produto só pela força do `status: aligned`', 'PT plan');
  includes(assert, planPt, 'bloqueante', 'PT plan');
});

// ---- Finding 3: recommendation contradiction --------------------------------

test('F3: Grill no longer says it omits "a recommendation" (EN + PT)', () => {
  excludes(assert, bEn, 'an option matrix or a recommendation', 'EN brainstorm');
  excludes(assert, bEn, 'option matrix or recommendation', 'EN brainstorm');
  excludes(assert, bPt, 'matriz de opções nem recomendação', 'PT brainstorm');
  excludes(assert, bPt, 'option matrix ou recomendação', 'PT brainstorm');
});

test('F3: Grill keeps a recommended answer on every interview question (EN + PT)', () => {
  includes(assert, bEn, 'every interview question still carries a recommended answer', 'EN brainstorm');
  includes(assert, bEn, 'option-matrix verdict', 'EN brainstorm');
  includes(assert, bPt, 'cada pergunta da entrevista ainda carrega uma resposta recomendada', 'PT brainstorm');
  includes(assert, bPt, 'veredito final de option-matrix', 'PT brainstorm');
});

// ---- Finding 4: operational active-PRD definition ---------------------------

test('F4: ADR command defines active vs historical PRD deterministically (EN)', () => {
  includes(assert, adrEn, 'Active PRD (operational definition)', 'EN adr');
  includes(assert, adrEn, 'terminal/historical', 'EN adr');
  includes(assert, adrEn, '.dw/STATE.md', 'EN adr');
  includes(assert, adrEn, 'feat/prd-<slug>', 'EN adr');
  includes(assert, adrEn, '`--scope=` is always authoritative', 'EN adr');
});

test('F4: ADR command defines active vs historical PRD deterministically (PT)', () => {
  includes(assert, adrPt, 'PRD ativo (definição operacional)', 'PT adr');
  includes(assert, adrPt, 'terminal/histórico', 'PT adr');
  includes(assert, adrPt, '.dw/STATE.md', 'PT adr');
  includes(assert, adrPt, 'feat/prd-<slug>', 'PT adr');
  includes(assert, adrPt, '`--scope=` é sempre autoritativo', 'PT adr');
});

test('F4: domain-modeling ADR policy mirrors the active-PRD resolution', () => {
  includes(assert, adrPolicy, 'Active vs historical PRD', 'adr-policy');
  includes(assert, adrPolicy, '.dw/STATE.md', 'adr-policy');
  includes(assert, adrPolicy, 'feat/prd-<slug>', 'adr-policy');
  includes(assert, adrPolicy, 'not terminal', 'adr-policy');
});

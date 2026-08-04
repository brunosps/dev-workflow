'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, SKILLS, includes, excludes } = require('./_helpers');

const grilling = read(SKILLS.grilling);
const domain = read(SKILLS.domainModeling);
const bEn = read(FILES.brainstorm.en);
const bPt = read(FILES.brainstorm.pt);

test('dw-grilling encodes the one-decision/recommendation/facts/gate/no-impl contract', () => {
  includes(assert, grilling, 'Exactly one unresolved decision per turn', 'dw-grilling');
  includes(assert, grilling, 'Every question carries a recommendation', 'dw-grilling');
  includes(assert, grilling, 'Facts are discovered, decisions are asked', 'dw-grilling');
  includes(assert, grilling, 'shared understanding', 'dw-grilling');
  includes(assert, grilling, 'No implementation, ever', 'dw-grilling');
  // decisions are the user's, not the agent's
  includes(assert, grilling, 'Decisions belong to the user', 'dw-grilling');
});

test('brainstorm grill mode asks exactly one decision per turn (EN + PT)', () => {
  includes(assert, bEn, 'exactly ONE unresolved decision per interaction', 'EN brainstorm');
  includes(assert, bPt, 'exatamente UMA decisão não-resolvida por interação', 'PT brainstorm');
});

test('brainstorm grill mode requires a recommended answer per question (EN + PT)', () => {
  includes(assert, bEn, 'the recommended answer', 'EN brainstorm');
  includes(assert, bPt, 'a resposta recomendada', 'PT brainstorm');
});

test('brainstorm grill mode discovers facts and leaves decisions to the user (EN + PT)', () => {
  includes(assert, bEn, 'Facts are discovered, decisions are asked', 'EN brainstorm');
  includes(assert, bEn, 'leave the choice to the user', 'EN brainstorm');
  includes(assert, bPt, 'Fatos são descobertos, decisões são perguntadas', 'PT brainstorm');
  includes(assert, bPt, 'deixe a escolha com o usuário', 'PT brainstorm');
});

test('brainstorm grill mode gates alignment on explicit shared understanding (EN + PT)', () => {
  includes(assert, bEn, 'explicitly confirms', 'EN brainstorm');
  includes(assert, bEn, 'shared', 'EN brainstorm');
  includes(assert, bPt, 'confirma explicitamente', 'PT brainstorm');
});

test('no stateful write before explicit authorization (EN + PT)', () => {
  includes(assert, bEn, 'explicit authorization', 'EN brainstorm');
  includes(assert, bEn, 'before starting the session or writing ANY file', 'EN brainstorm');
  includes(assert, bPt, 'autorização explícita', 'PT brainstorm');
  includes(assert, bPt, 'antes de iniciar a sessão ou escrever QUALQUER arquivo', 'PT brainstorm');
});

test('a normal brainstorm stays non-mutating for unstable vocabulary (EN + PT)', () => {
  includes(assert, bEn, 'normal brainstorm must not write Grill artifacts', 'EN brainstorm');
  includes(assert, bEn, 'do not modify files', 'EN brainstorm');
  includes(assert, bPt, 'brainstorm normal não pode escrever artefatos de Grill', 'PT brainstorm');
  includes(assert, bPt, 'nao modifique arquivos', 'PT brainstorm');
});

test('grill never edits source code (EN + PT)', () => {
  includes(assert, bEn, 'Never edit source code during Grill', 'EN brainstorm');
  includes(assert, bPt, 'Nunca edite código-fonte durante o Grill', 'PT brainstorm');
});

test('grill and option-matrix are mutually exclusive (EN + PT)', () => {
  includes(assert, bEn, 'mutually exclusive', 'EN brainstorm');
  includes(assert, bPt, 'mutuamente exclusiv', 'PT brainstorm');
});

test('grill mode builds a dependency-ordered decision tree first (EN + PT)', () => {
  includes(assert, bEn, 'ordered by dependencies', 'EN brainstorm');
  includes(assert, bPt, 'ordenada por dependências', 'PT brainstorm');
});

test('grill mode resumes from Decision Map before rebuilding (EN + PT)', () => {
  includes(assert, bEn, 'read the active one-pager for an', 'EN brainstorm');
  includes(assert, bEn, 'existing **Decision Map**', 'EN brainstorm');
  includes(assert, bEn, 'explicit **Frontier**', 'EN brainstorm');
  includes(assert, bPt, 'leia o one-pager ativo', 'PT brainstorm');
  includes(assert, bPt, '**Frontier** explícita', 'PT brainstorm');
  includes(assert, grilling, 'read it before reconstructing', 'dw-grilling');
  includes(assert, grilling, 'Decision Fog', 'dw-grilling');
});

test('the old .dw/rules glossary-write discipline is gone from grill (EN + PT)', () => {
  excludes(assert, bEn, 'Update `.dw/rules/` inline', 'EN brainstorm');
  excludes(assert, bPt, 'Atualize `.dw/rules/` inline', 'PT brainstorm');
});

test('domain-modeling defines the glossary shape and exclusions', () => {
  includes(assert, domain, 'one or two sentences', 'dw-domain-modeling');
  includes(assert, domain, 'discouraged synonyms', 'dw-domain-modeling');
  includes(assert, domain, 'general programming', 'dw-domain-modeling');
});

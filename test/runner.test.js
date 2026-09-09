'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, SKILLS, includes, excludes } = require('./_helpers');

const cEn = read(FILES.claudeRun.en);
const cPt = read(FILES.claudeRun.pt);
const cli = read(SKILLS.cliRun);
// dw-cli-run is `load_policy: lazy-references`: the router lives in SKILL.md and the
// full protocol in references/. Provider-neutrality is a property of the protocol as a
// whole, so assert against both — otherwise the invariant silently "passes" by moving
// between files.
const cliProtocol = cli + '\n' + read('scaffold/skills/dw-cli-run/references/dispatch-tuning.md');

test('Claude adapter DISPATCH + RESUME accept an <EFFORT> slot (EN + PT)', () => {
  for (const [label, body] of [['EN claude-run', cEn], ['PT claude-run', cPt]]) {
    includes(assert, body, '--model "<MODEL>" --effort "<EFFORT>"', label); // DISPATCH
    includes(assert, body, 'claude --resume "<SESSION_ID>" -p --model "<MODEL>" --effort "<EFFORT>"', label); // RESUME
    includes(assert, body, '<RESUME_PERMISSIONS>', label);
    includes(assert, body, 'xhigh', label);
  }
});

test('the stale "Claude has no effort flag" claim is removed (EN + PT)', () => {
  excludes(assert, cEn, 'no numeric', 'EN claude-run');
  excludes(assert, cEn, 'has no effort flag', 'EN claude-run');
  excludes(assert, cPt, 'flag numerica', 'PT claude-run');
});

test('the full effort ladder is documented (EN + PT)', () => {
  for (const [label, body] of [['EN claude-run', cEn], ['PT claude-run', cPt]]) {
    for (const level of ['low', 'medium', 'high', 'xhigh', 'max']) {
      includes(assert, body, level, label);
    }
  }
});

test('dw-cli-run acceptance uses independent evidence rather than self-score', () => {
  includes(assert, cliProtocol, 'the parent re-gates', 'dw-cli-run protocol');
  includes(assert, cliProtocol, 'Parent re-gate (independent)', 'dw-cli-run protocol');
  includes(assert, cliProtocol, "A numeric score is optional diagnostic information, never an acceptance gate", 'dw-cli-run protocol');
});

test('dw-cli-run no longer hard-codes "Claude re-gates" / "Claude\'s score"', () => {
  excludes(assert, cliProtocol, 'Claude re-gates', 'dw-cli-run protocol');
  excludes(assert, cliProtocol, 'Claude re-gate (independent)', 'dw-cli-run protocol');
  excludes(assert, cliProtocol, "score that counts for acceptance is Claude's", 'dw-cli-run protocol');
  excludes(assert, cliProtocol, "**Claude's score**", 'dw-cli-run protocol');
});

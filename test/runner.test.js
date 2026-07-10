'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { read, FILES, SKILLS, includes, excludes } = require('./_helpers');

const cEn = read(FILES.claudeRun.en);
const cPt = read(FILES.claudeRun.pt);
const cli = read(SKILLS.cliRun);

test('Claude adapter DISPATCH + RESUME accept an <EFFORT> slot (EN + PT)', () => {
  for (const [label, body] of [['EN claude-run', cEn], ['PT claude-run', cPt]]) {
    includes(assert, body, '--model <MODEL> --effort <EFFORT>', label); // DISPATCH
    includes(assert, body, 'claude --resume "$UUID" -p --effort <EFFORT>', label); // RESUME
    includes(assert, body, '2.1.206', label);
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

test('dw-cli-run acceptance score is provider-neutral (parent re-gate, not Claude)', () => {
  includes(assert, cli, 'the parent re-gates', 'dw-cli-run');
  includes(assert, cli, 'Parent re-gate (independent)', 'dw-cli-run');
  includes(assert, cli, "score that counts for acceptance is the parent's", 'dw-cli-run');
});

test('dw-cli-run no longer hard-codes "Claude re-gates" / "Claude\'s score"', () => {
  excludes(assert, cli, 'Claude re-gates', 'dw-cli-run');
  excludes(assert, cli, 'Claude re-gate (independent)', 'dw-cli-run');
  excludes(assert, cli, "score that counts for acceptance is Claude's", 'dw-cli-run');
  excludes(assert, cli, "**Claude's score**", 'dw-cli-run');
});

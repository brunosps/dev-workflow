'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// Canonical paths for the files touched by the Grill hardening. EN/PT pairs are
// grouped so parity tests can iterate them.
const FILES = {
  brainstorm: {
    en: 'scaffold/en/commands/dw-brainstorm.md',
    pt: 'scaffold/pt-br/commands/dw-brainstorm.md',
  },
  adr: {
    en: 'scaffold/en/commands/dw-adr.md',
    pt: 'scaffold/pt-br/commands/dw-adr.md',
  },
  adrTemplate: {
    en: 'scaffold/en/templates/adr-template.md',
    pt: 'scaffold/pt-br/templates/adr-template.md',
  },
  plan: {
    en: 'scaffold/en/commands/dw-plan.md',
    pt: 'scaffold/pt-br/commands/dw-plan.md',
  },
  analyze: {
    en: 'scaffold/en/commands/dw-analyze-project.md',
    pt: 'scaffold/pt-br/commands/dw-analyze-project.md',
  },
  claudeRun: {
    en: 'scaffold/en/commands/dw-claude-run.md',
    pt: 'scaffold/pt-br/commands/dw-claude-run.md',
  },
  run: {
    en: 'scaffold/en/commands/dw-run.md',
    pt: 'scaffold/pt-br/commands/dw-run.md',
  },
  bugfix: {
    en: 'scaffold/en/commands/dw-bugfix.md',
    pt: 'scaffold/pt-br/commands/dw-bugfix.md',
  },
  triage: {
    en: 'scaffold/en/commands/dw-triage.md',
    pt: 'scaffold/pt-br/commands/dw-triage.md',
  },
  triageRecordTemplate: {
    en: 'scaffold/en/templates/triage-record-template.md',
    pt: 'scaffold/pt-br/templates/triage-record-template.md',
  },
  triageNeedsInfoTemplate: {
    en: 'scaffold/en/templates/triage-needs-info-template.md',
    pt: 'scaffold/pt-br/templates/triage-needs-info-template.md',
  },
  triageOutOfScopeTemplate: {
    en: 'scaffold/en/templates/triage-out-of-scope-template.md',
    pt: 'scaffold/pt-br/templates/triage-out-of-scope-template.md',
  },
  onepager: {
    en: 'scaffold/en/templates/idea-onepager.md',
    pt: 'scaffold/pt-br/templates/idea-onepager.md',
  },
  openDesign: {
    en: 'scaffold/en/commands/dw-open-design.md',
    pt: 'scaffold/pt-br/commands/dw-open-design.md',
  },
  review: {
    en: 'scaffold/en/commands/dw-review.md',
    pt: 'scaffold/pt-br/commands/dw-review.md',
  },
  refactor: {
    en: 'scaffold/en/commands/dw-refactor.md',
    pt: 'scaffold/pt-br/commands/dw-refactor.md',
  },
};

const SKILLS = {
  grilling: 'scaffold/skills/dw-grilling/SKILL.md',
  domainModeling: 'scaffold/skills/dw-domain-modeling/SKILL.md',
  cliRun: 'scaffold/skills/dw-cli-run/SKILL.md',
};

const REGISTRY = 'scaffold/skill-registry.json';

// Assert a substring appears in `haystack`; message names the file for triage.
function includes(assert, haystack, needle, label) {
  assert.ok(
    haystack.includes(needle),
    `${label}: expected to contain ${JSON.stringify(needle)}`
  );
}

function excludes(assert, haystack, needle, label) {
  assert.ok(
    !haystack.includes(needle),
    `${label}: expected NOT to contain ${JSON.stringify(needle)}`
  );
}

module.exports = { ROOT, read, exists, FILES, SKILLS, REGISTRY, includes, excludes };

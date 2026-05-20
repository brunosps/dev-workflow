const fs = require('fs');
const path = require('path');
const { readJson } = require('./utils');

const SCAFFOLD_DIR = path.join(__dirname, '..', 'scaffold');
const REGISTRY_PATH = path.join(SCAFFOLD_DIR, 'skill-registry.json');
const SKILLS_DIR = path.join(SCAFFOLD_DIR, 'skills');

const VALID_KINDS = new Set(['protocol', 'domain-pack', 'recipe-pack', 'asset-pack']);
const VALID_LOAD_POLICIES = new Set(['always-small', 'lazy-references', 'opt-in-runtime']);

function readSkillRegistry() {
  const registry = readJson(REGISTRY_PATH, null);
  if (!registry || !Array.isArray(registry.skills)) {
    throw new Error('Invalid scaffold/skill-registry.json');
  }
  return registry;
}

function listScaffoldSkillNames() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function validateSkillRegistry() {
  const registry = readSkillRegistry();
  const issues = [];
  const warnings = [];
  const entriesByName = new Map();
  const scaffoldNames = new Set(listScaffoldSkillNames());

  for (const entry of registry.skills) {
    validateEntry(entry, issues);
    if (entriesByName.has(entry.name)) {
      issues.push(`Skill registry duplicates entry: ${entry.name}`);
    }
    entriesByName.set(entry.name, entry);

    if (!scaffoldNames.has(entry.name)) {
      issues.push(`Skill registry references missing scaffold skill: ${entry.name}`);
      continue;
    }

    const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      issues.push(`Scaffold skill missing SKILL.md: ${entry.name}`);
      continue;
    }

    const size = fs.statSync(skillPath).size;
    if (entry.context_limit && size > entry.context_limit) {
      warnings.push(`Skill ${entry.name} SKILL.md is ${size} bytes; registry limit is ${entry.context_limit}`);
    }

    if (entry.load_policy === 'always-small' && size > 8000) {
      warnings.push(`Skill ${entry.name} is marked always-small but SKILL.md is ${size} bytes`);
    }
  }

  for (const skillName of scaffoldNames) {
    if (!entriesByName.has(skillName)) {
      issues.push(`Scaffold skill missing from registry: ${skillName}`);
    }
  }

  return { issues, warnings, registry };
}

function validateEntry(entry, issues) {
  for (const field of ['name', 'kind', 'tier', 'owner', 'trigger', 'expected_output', 'load_policy', 'context_limit']) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
      issues.push(`Skill registry entry ${entry.name || '(unknown)'} missing field: ${field}`);
    }
  }

  if (entry.kind && !VALID_KINDS.has(entry.kind)) {
    issues.push(`Skill registry entry ${entry.name} has invalid kind: ${entry.kind}`);
  }

  if (entry.load_policy && !VALID_LOAD_POLICIES.has(entry.load_policy)) {
    issues.push(`Skill registry entry ${entry.name} has invalid load_policy: ${entry.load_policy}`);
  }

  if (typeof entry.context_limit !== 'number' || entry.context_limit <= 0) {
    issues.push(`Skill registry entry ${entry.name} must set a positive numeric context_limit`);
  }
}

function listInstalledSkillNames(projectRoot) {
  const installedDir = path.join(projectRoot, '.agents', 'skills');
  if (!fs.existsSync(installedDir)) return [];
  return fs
    .readdirSync(installedDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(installedDir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

module.exports = {
  REGISTRY_PATH,
  readSkillRegistry,
  validateSkillRegistry,
  listScaffoldSkillNames,
  listInstalledSkillNames,
};

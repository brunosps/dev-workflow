const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const { readJson, writeJson } = require('./utils');

const STATE_RELATIVE_PATH = path.join('.dw', 'install-state.json');

function statePath(projectRoot) {
  return path.join(projectRoot, STATE_RELATIVE_PATH);
}

function readInstallState(projectRoot) {
  return readJson(statePath(projectRoot), null);
}

function hasExistingInstall(projectRoot) {
  return Boolean(
    fs.existsSync(path.join(projectRoot, '.dw', 'commands')) ||
    fs.existsSync(path.join(projectRoot, 'CLAUDE.md')) ||
    fs.existsSync(path.join(projectRoot, 'AGENTS.md')) ||
    readInstallState(projectRoot)
  );
}

function writeInstallState(projectRoot, state) {
  const existing = readInstallState(projectRoot);
  const now = new Date().toISOString();
  const next = {
    schema_version: '1.0',
    package: pkg.name,
    version: pkg.version,
    lang: state.lang,
    profile: state.profile,
    modules: state.modules || [],
    platforms: state.platforms || [],
    managed_files: state.managedFiles || [],
    installed_at: existing && existing.installed_at ? existing.installed_at : now,
    updated_at: now,
  };
  writeJson(statePath(projectRoot), next);
  return next;
}

function listManagedFiles(projectRoot, relativeFiles) {
  return relativeFiles
    .filter(Boolean)
    .map((filePath) => path.relative(projectRoot, filePath))
    .sort();
}

module.exports = {
  STATE_RELATIVE_PATH,
  hasExistingInstall,
  readInstallState,
  writeInstallState,
  listManagedFiles,
};

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const { readSkillRegistry } = require('./skill-registry');

/**
 * Generate the à-la-carte distribution manifests from the skill registry.
 *
 * Single source of truth: scaffold/skill-registry.json. Only skills marked
 * `exportable: true` (standalone, no .dw/ pipeline dependency) are published.
 * Re-run `npm run build:plugin` whenever the registry changes; CI validates
 * that the committed manifests match.
 *
 * Writes:
 *   .claude-plugin/plugin.json      — the dev-workflow skills plugin
 *   .claude-plugin/marketplace.json — single-plugin marketplace listing
 *
 * This does NOT change the full-pipeline installer (`dev-workflow init`), which
 * scaffolds all skills + commands into a project. The plugin is the parallel
 * "install one skill" path.
 */

const REPO_ROOT = path.join(__dirname, '..');
const PLUGIN_DIR = path.join(REPO_ROOT, '.claude-plugin');

function buildManifests() {
  const registry = readSkillRegistry();
  const exportable = registry.skills
    .filter((s) => s.exportable === true)
    .map((s) => s.name)
    .sort();

  const author = typeof pkg.author === 'string' ? { name: pkg.author } : pkg.author || { name: 'Bruno Santos' };

  const plugin = {
    name: 'dev-workflow',
    description:
      'Standalone, à-la-carte skills from the dev-workflow pipeline: minimalism, search-first, simplification, verification, security review, and more.',
    version: pkg.version,
    author,
    homepage: (pkg.repository && pkg.repository.url) || undefined,
    license: pkg.license,
    keywords: ['ai', 'workflow', 'skills', 'claude', 'minimalism', 'verification', 'security'],
    skills: exportable.map((name) => `./scaffold/skills/${name}`),
  };

  const marketplace = {
    name: 'brunosps00-dev-workflow',
    owner: author,
    plugins: [
      {
        name: 'dev-workflow',
        source: './',
        description: plugin.description,
      },
    ],
  };

  return { plugin, marketplace, exportable };
}

function writeJsonStable(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function run() {
  const { plugin, marketplace, exportable } = buildManifests();
  writeJsonStable(path.join(PLUGIN_DIR, 'plugin.json'), plugin);
  writeJsonStable(path.join(PLUGIN_DIR, 'marketplace.json'), marketplace);
  console.log(`Wrote .claude-plugin/plugin.json + marketplace.json (${exportable.length} exportable skills):`);
  for (const name of exportable) console.log(`  - ${name}`);
}

module.exports = { buildManifests, run };

if (require.main === module) {
  run();
}

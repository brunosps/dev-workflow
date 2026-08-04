const fs = require('fs');
const path = require('path');
const { validateSkillRegistry } = require('./skill-registry');
const { validateAgentRegistry, readAgentRegistry } = require('./agents');
const { buildManifests } = require('./build-plugin');

/**
 * Repo quality gate (npm run validate). Validates the skill + agent registries
 * and confirms the committed .claude-plugin/ manifests match what the registry
 * would generate (no drift). Exits non-zero on any issue.
 */
function run() {
  const issues = [];
  const warnings = [];

  const skill = validateSkillRegistry();
  issues.push(...skill.issues);
  warnings.push(...skill.warnings);

  const agent = validateAgentRegistry(readAgentRegistry());
  issues.push(...agent.issues);
  warnings.push(...agent.warnings);

  // Plugin manifest drift check.
  const { plugin, marketplace } = buildManifests();
  checkMarketplaceDescription(marketplace, issues);
  checkManifestDrift('.claude-plugin/plugin.json', plugin, issues);
  checkManifestDrift('.claude-plugin/marketplace.json', marketplace, issues);
  checkMarketplaceFileDescription('.claude-plugin/marketplace.json', issues);

  console.log('dev-workflow validate\n');
  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`- ${w}`);
    console.log();
  }
  if (issues.length) {
    console.log('Issues:');
    for (const i of issues) console.log(`- ${i}`);
    console.log();
    console.log('FAIL');
    process.exit(1);
  }
  console.log('PASS: skill + agent registries valid; plugin manifests in sync.');
}

function checkManifestDrift(relPath, expected, issues) {
  const file = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(file)) {
    issues.push(`Missing ${relPath}; run \`npm run build:plugin\`.`);
    return;
  }
  const onDisk = fs.readFileSync(file, 'utf-8');
  const want = JSON.stringify(expected, null, 2) + '\n';
  if (onDisk !== want) {
    issues.push(`${relPath} is out of sync with the registry; run \`npm run build:plugin\`.`);
  }
}

function checkMarketplaceDescription(marketplace, issues) {
  if (!marketplace || typeof marketplace.description !== 'string' || !marketplace.description.trim()) {
    issues.push('Generated marketplace manifest must include a root-level description.');
  }
}

function checkMarketplaceFileDescription(relPath, issues) {
  const file = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(file)) return;
  try {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (typeof manifest.description !== 'string' || !manifest.description.trim()) {
      issues.push(`${relPath} must include a root-level description.`);
    }
  } catch {
    issues.push(`${relPath} is not valid JSON.`);
  }
}

module.exports = { run };

if (require.main === module) {
  run();
}

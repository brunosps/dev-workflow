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
  checkManifestDrift('.claude-plugin/plugin.json', plugin, issues);
  checkManifestDrift('.claude-plugin/marketplace.json', marketplace, issues);

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

module.exports = { run };

if (require.main === module) {
  run();
}

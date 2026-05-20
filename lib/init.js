const path = require('path');
const { COMMANDS } = require('./constants');
const { ensureDir, copyDir, writeFile, upsertDelimitedBlock, log, listFilesRecursive } = require('./utils');
const { selectLanguage } = require('./prompts');
const { generateWrappers } = require('./wrappers');
const { installMCPs } = require('./mcp');
const { generateAgents } = require('./agents');
const { migrate: migrateGsd } = require('./migrate-gsd');
const { migrate: migrateSkills } = require('./migrate-skills');
const { hasExistingInstall, readInstallState, writeInstallState, listManagedFiles } = require('./install-state');
const { resolveInstallSelection } = require('./profiles');
const { ensureSubtaskLayout } = require('./subtasks');

const SCAFFOLD_DIR = path.join(__dirname, '..', 'scaffold');

async function run({ force = false, lang = null, mode = 'init', profile = null, modules = null }) {
  const projectRoot = process.cwd();
  const isUpdate = mode === 'update';
  const isRepair = mode === 'repair';
  const existingInstall = hasExistingInstall(projectRoot);
  const priorState = readInstallState(projectRoot);

  // Update/repair and init over an existing dev-workflow install reconcile managed
  // files to the current scaffold. Fresh init keeps normal non-destructive behavior.
  const shouldReconcile = isUpdate || isRepair || (mode === 'init' && existingInstall);
  const managedForce = shouldReconcile ? true : force;

  console.log(`\n  dev-workflow ${isRepair ? 'repair' : (isUpdate ? 'update' : 'init')}`);
  console.log(`  ${'='.repeat(40)}\n`);
  if (mode === 'init' && existingInstall) {
    console.log('  Existing dev-workflow install detected; reconciling managed files.\n');
  }

  // 0. GSD migration (idempotent; only runs if legacy GSD artifacts are detected)
  // 0.1. Skill migration: removed bundled skills + orphan dw-* wrappers (idempotent)
  if (shouldReconcile) {
    migrateGsd(projectRoot);
    migrateSkills(projectRoot);
  }

  // 1. Select language
  const selectedLang = await selectLanguage(lang || (priorState && priorState.lang));
  const selection = resolveInstallSelection({
    profile: profile || (priorState && priorState.profile),
    modules: modules || (priorState && Array.isArray(priorState.modules) ? priorState.modules.join(',') : null),
  });
  console.log(`\n  Language: ${selectedLang}\n`);
  console.log(`  Profile: ${selection.profile} (${selection.modules.join(', ')})\n`);

  const commands = COMMANDS[selectedLang];
  const langDir = path.join(SCAFFOLD_DIR, selectedLang);
  const touchedFiles = [];

  // Track totals
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalOverwritten = 0;

  // 2. Copy commands
  console.log('  Commands:');
  const cmdResults = copyDir(
    path.join(langDir, 'commands'),
    path.join(projectRoot, '.dw', 'commands'),
    managedForce
  );
  totalCreated += cmdResults.created;
  totalSkipped += cmdResults.skipped;
  totalOverwritten += cmdResults.overwritten;
  touchedFiles.push(...listFilesRecursive(path.join(projectRoot, '.dw', 'commands')));
  console.log(`    ${cmdResults.created} created, ${cmdResults.skipped} skipped, ${cmdResults.overwritten} overwritten\n`);

  // 3. Copy templates (override-aware: .dw/templates/overrides/<name> wins over scaffold core)
  console.log('  Templates:');
  const templatesDir = path.join(projectRoot, '.dw', 'templates');
  const overridesDir = path.join(templatesDir, 'overrides');
  const tplResults = copyDir(
    path.join(langDir, 'templates'),
    templatesDir,
    managedForce,
    overridesDir
  );
  totalCreated += tplResults.created;
  totalSkipped += tplResults.skipped;
  totalOverwritten += tplResults.overwritten;
  touchedFiles.push(...listFilesRecursive(templatesDir));
  console.log(`    ${tplResults.created} created, ${tplResults.skipped} skipped, ${tplResults.overwritten} overwritten\n`);

  // 3.1. Seed .dw/templates/overrides/ with README on first init (never overwritten)
  ensureDir(overridesDir);
  const overridesReadmeSrc = path.join(SCAFFOLD_DIR, 'templates-overrides-readme.md');
  const overridesReadmeDest = path.join(overridesDir, 'README.md');
  if (require('fs').existsSync(overridesReadmeSrc)) {
    const ovrStatus = writeFile(
      overridesReadmeDest,
      require('fs').readFileSync(overridesReadmeSrc, 'utf-8'),
      false
    );
    if (ovrStatus === 'created') totalCreated++;
    else totalSkipped++;
    touchedFiles.push(overridesReadmeDest);
  }

  // 3.5. Copy references (language-specific)
  const refsSrcDir = path.join(langDir, 'references');
  if (require('fs').existsSync(refsSrcDir)) {
    console.log('  References:');
    const refsResults = copyDir(
      refsSrcDir,
      path.join(projectRoot, '.dw', 'references'),
      managedForce
    );
    totalCreated += refsResults.created;
    totalSkipped += refsResults.skipped;
    totalOverwritten += refsResults.overwritten;
    touchedFiles.push(...listFilesRecursive(path.join(projectRoot, '.dw', 'references')));
    console.log(`    ${refsResults.created} created, ${refsResults.skipped} skipped, ${refsResults.overwritten} overwritten\n`);
  }

  // 3.6. Copy scripts (language-independent)
  const scriptsSrcDir = path.join(SCAFFOLD_DIR, 'scripts');
  if (require('fs').existsSync(scriptsSrcDir)) {
    console.log('  Scripts:');
    const scriptsResults = copyDir(
      scriptsSrcDir,
      path.join(projectRoot, '.dw', 'scripts'),
      managedForce
    );
    totalCreated += scriptsResults.created;
    totalSkipped += scriptsResults.skipped;
    totalOverwritten += scriptsResults.overwritten;
    touchedFiles.push(...listFilesRecursive(path.join(projectRoot, '.dw', 'scripts')));
    console.log(`    ${scriptsResults.created} created, ${scriptsResults.skipped} skipped, ${scriptsResults.overwritten} overwritten\n`);
  }

  // 3.7. Copy skill registry for agent-facing skill health audits.
  const skillRegistrySrc = path.join(SCAFFOLD_DIR, 'skill-registry.json');
  if (require('fs').existsSync(skillRegistrySrc)) {
    console.log('  Skill registry:');
    const skillRegistryDest = path.join(projectRoot, '.dw', 'skill-registry.json');
    const registryStatus = writeFile(
      skillRegistryDest,
      require('fs').readFileSync(skillRegistrySrc, 'utf-8'),
      managedForce
    );
    log(registryStatus, skillRegistryDest);
    if (registryStatus === 'created') totalCreated++;
    else if (registryStatus === 'overwritten') totalOverwritten++;
    else totalSkipped++;
    touchedFiles.push(skillRegistryDest);
    console.log();
  }

  // 3.8. Copy agent registry for dispatch, budgets, and provider health audits.
  const agentRegistrySrc = path.join(SCAFFOLD_DIR, 'agent-registry.json');
  if (require('fs').existsSync(agentRegistrySrc)) {
    console.log('  Agent registry:');
    const agentRegistryDest = path.join(projectRoot, '.dw', 'agent-registry.json');
    const registryStatus = writeFile(
      agentRegistryDest,
      require('fs').readFileSync(agentRegistrySrc, 'utf-8'),
      managedForce
    );
    log(registryStatus, agentRegistryDest);
    if (registryStatus === 'created') totalCreated++;
    else if (registryStatus === 'overwritten') totalOverwritten++;
    else totalSkipped++;
    touchedFiles.push(agentRegistryDest);
    console.log();
  }

  // 4. Create .dw/rules/ with README
  if (!isUpdate) {
    console.log('  Rules:');
    ensureDir(path.join(projectRoot, '.dw', 'rules'));
    const rulesReadmeSrc = path.join(SCAFFOLD_DIR, 'rules-readme.md');
    const rulesReadmeDest = path.join(projectRoot, '.dw', 'rules', 'README.md');
    const status = writeFile(
      rulesReadmeDest,
      require('fs').readFileSync(rulesReadmeSrc, 'utf-8'),
      false
    );
    log(status, rulesReadmeDest);
    if (status === 'created') totalCreated++;
    else totalSkipped++;
    touchedFiles.push(rulesReadmeDest);
    console.log();
  }

  // 5. Create .dw/spec/
  if (!isUpdate) {
    ensureDir(path.join(projectRoot, '.dw', 'spec'));
  }

  // 5.1. Seed .dw/STATE.md from template (init only; never overwritten on update)
  if (!isUpdate) {
    console.log('  Session state:');
    const stateTemplatePath = path.join(langDir, 'templates', 'state-template.md');
    const stateDestPath = path.join(projectRoot, '.dw', 'STATE.md');
    if (require('fs').existsSync(stateTemplatePath)) {
      const stateStatus = writeFile(
        stateDestPath,
        require('fs').readFileSync(stateTemplatePath, 'utf-8'),
        false
      );
      log(stateStatus, stateDestPath);
      if (stateStatus === 'created') totalCreated++;
      else totalSkipped++;
      touchedFiles.push(stateDestPath);
    }
    console.log();
  }

  // 5.2. Create .dw/bugfixes/ with .gitkeep (init only; preserved on update)
  if (!isUpdate) {
    const bugfixesDir = path.join(projectRoot, '.dw', 'bugfixes');
    ensureDir(bugfixesDir);
    const gitkeepPath = path.join(bugfixesDir, '.gitkeep');
    const gitkeepStatus = writeFile(gitkeepPath, '', false);
    if (gitkeepStatus === 'created') totalCreated++;
    else totalSkipped++;
    touchedFiles.push(gitkeepPath);
  }

  // 5.3. Create local ephemeral subtask handoff directories.
  ensureSubtaskLayout(projectRoot);
  touchedFiles.push(path.join(projectRoot, '.dw', 'subtasks', '.gitignore'));

  // 5.5. Copy bundled skills to .agents/skills/
  const skillsSrcDir = path.join(SCAFFOLD_DIR, 'skills');
  if (require('fs').existsSync(skillsSrcDir)) {
    console.log('  Bundled skills:');
    const skillsResults = copyDir(
      skillsSrcDir,
      path.join(projectRoot, '.agents', 'skills'),
      managedForce
    );
    totalCreated += skillsResults.created;
    totalSkipped += skillsResults.skipped;
    totalOverwritten += skillsResults.overwritten;
    touchedFiles.push(...listFilesRecursive(path.join(projectRoot, '.agents', 'skills')));
    console.log(`    ${skillsResults.created} created, ${skillsResults.skipped} skipped, ${skillsResults.overwritten} overwritten\n`);
  }

  // 5.6. Generate platform-native/fallback agents from the selected modules.
  console.log('  Agents:');
  const agentResults = generateAgents(projectRoot, selection.modules, managedForce);
  totalCreated += agentResults.created;
  totalSkipped += agentResults.skipped;
  totalOverwritten += agentResults.overwritten;
  touchedFiles.push(...agentResults.files);
  console.log(`    ${agentResults.created} created, ${agentResults.skipped} skipped, ${agentResults.overwritten} overwritten\n`);

  // 5.7. Install CLAUDE.md + AGENTS.md with auto-trigger decision tree
  // Both files receive the same content (Claude Code reads CLAUDE.md; Codex/Copilot/OpenCode
  // converge on AGENTS.md). Merge-aware: user edits outside the dev-workflow markers are preserved.
  const agentInstructionsSrc = path.join(langDir, 'agent-instructions.md');
  if (require('fs').existsSync(agentInstructionsSrc)) {
    console.log('  Agent instructions:');
    const blockContent = require('fs').readFileSync(agentInstructionsSrc, 'utf-8');
    const startMarker = '<!-- dev-workflow:start -->';
    const endMarker = '<!-- dev-workflow:end -->';
    for (const fileName of ['CLAUDE.md', 'AGENTS.md']) {
      const target = path.join(projectRoot, fileName);
      const status = upsertDelimitedBlock(target, blockContent, startMarker, endMarker);
      log(status === 'unchanged' ? 'skipped' : (status === 'created' ? 'created' : 'overwritten'), target);
      if (status === 'created') totalCreated++;
      else if (status === 'updated') totalOverwritten++;
      else totalSkipped++;
      touchedFiles.push(target);
    }
    console.log();
  }

  // 6. Create .opencode/package.json
  const opencodePackageJson = path.join(projectRoot, '.opencode', 'package.json');
  const opencodeContent = JSON.stringify({ dependencies: { '@opencode-ai/plugin': '1.2.17' } }, null, 2) + '\n';
  const opcStatus = writeFile(opencodePackageJson, opencodeContent, false);
  if (opcStatus === 'created') totalCreated++;
  else totalSkipped++;
  touchedFiles.push(opencodePackageJson);

  // 6.5. Clean up legacy .codex/skills/ (now served by .agents/skills/)
  const legacyCodexDir = path.join(projectRoot, '.codex', 'skills');
  if (require('fs').existsSync(legacyCodexDir)) {
    console.log('  Legacy cleanup:');
    require('fs').rmSync(legacyCodexDir, { recursive: true });
    console.log('    Removed .codex/skills/ (now served by .agents/skills/)\n');
  }

  // 7. Generate platform wrappers
  console.log('  Platform wrappers:');
  const wrapperResults = generateWrappers(projectRoot, commands, managedForce);
  totalCreated += wrapperResults.created;
  totalSkipped += wrapperResults.skipped;
  totalOverwritten += wrapperResults.overwritten;
  touchedFiles.push(...wrapperResults.files);
  console.log();

  // 9. Install MCPs (always, including updates)
  console.log('  MCP Servers:');
  const mcpResults = installMCPs(projectRoot);
  console.log(`    ${mcpResults.added} configured, ${mcpResults.skipped} already present\n`);

  // 9.5. Persist install state for diagnostics and repair.
  const installState = writeInstallState(projectRoot, {
    lang: selectedLang,
    profile: selection.profile,
    modules: selection.modules,
    platforms: ['claude', 'agents', 'opencode', 'copilot'],
    managedFiles: listManagedFiles(projectRoot, touchedFiles),
  });
  console.log(`  Install state: ${path.relative(projectRoot, path.join(projectRoot, '.dw', 'install-state.json'))} (${installState.managed_files.length} files tracked)\n`);

  // 10. Summary
  console.log(`  ${'='.repeat(40)}`);
  console.log(`  Done! ${totalCreated} created, ${totalSkipped} skipped, ${totalOverwritten} overwritten`);
  console.log();
  console.log('  Next steps:');
  console.log('    1. Run /dw-analyze-project to generate project rules');
  console.log('    2. Run /dw-brainstorm to start a new feature');
  console.log('    3. Run /dw-help to see all available commands');
  console.log();
}

module.exports = { run };

const path = require('path');
const { readInstallState, STATE_RELATIVE_PATH } = require('./install-state');

function run() {
  const projectRoot = process.cwd();
  const state = readInstallState(projectRoot);

  if (!state) {
    console.log(`No dev-workflow install state found at ${STATE_RELATIVE_PATH}.`);
    console.log('Run `npx @brunosps00/dev-workflow init` or `update` to create it.');
    return;
  }

  console.log('dev-workflow install\n');
  console.log(`Root: ${projectRoot}`);
  console.log(`Package: ${state.package || '@brunosps00/dev-workflow'}@${state.version || '(unknown)'}`);
  console.log(`Language: ${state.lang || '(unknown)'}`);
  console.log(`Profile: ${state.profile || '(unknown)'}`);
  console.log(`Modules: ${(state.modules || []).join(', ') || '(none)'}`);
  console.log(`Platforms: ${(state.platforms || []).join(', ') || '(none)'}`);
  console.log(`Managed files tracked: ${(state.managed_files || []).length}`);
  console.log(`Installed at: ${state.installed_at || '(unknown)'}`);
  console.log(`Updated at: ${state.updated_at || '(unknown)'}`);
  console.log(`State: ${path.join(projectRoot, STATE_RELATIVE_PATH)}`);
}

module.exports = { run };

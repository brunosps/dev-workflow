#!/usr/bin/env node

const { run } = require('../lib/init');
const installDeps = require('../lib/install-deps');
const uninstall = require('../lib/uninstall');

const args = process.argv.slice(2);
const command = args[0];

const flags = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    flags[key] = value || true;
  }
}

const HELP_TEXT = `
  dev-workflow - AI-driven development workflow commands

  Usage:
    npx dev-workflow init [--force] [--lang=en|pt-br]
    npx dev-workflow update [--lang=en|pt-br]
    npx dev-workflow install-deps
    npx dev-workflow help

  Commands:
    init           Scaffold .dw/ (commands, templates, references, scripts, skills, rules, MCPs)
    update         Update managed files (commands, templates, references, scripts, skills, wrappers, MCPs)
                   Preserves: .dw/rules/, .dw/spec/, user data
    install-deps   Install system dependencies (Playwright browsers, MCP servers)
    uninstall      Remove all managed files (commands, templates, wrappers, skills, MCPs)
                   Preserves: .dw/rules/, .dw/spec/, .planning/ (user data)
    help           Show this help message

  Options:
    --force        Overwrite existing files (init only; update always overwrites managed files)
    --lang=LANG    Set language without prompt (en or pt-br)

  Examples:
    npx dev-workflow init                  # Interactive language selection
    npx dev-workflow init --lang=en        # English, no prompt
    npx dev-workflow init --lang=pt-br     # Portuguese, no prompt
    npx dev-workflow init --force          # Overwrite existing files
    npx dev-workflow update --lang=en      # Update all managed files to latest version
    npx dev-workflow install-deps          # Install Playwright browsers and MCP servers
    npx dev-workflow uninstall             # Remove all managed files (preserves user data)
`;

async function main() {
  switch (command) {
    case 'init':
      await run({ force: !!flags.force, lang: flags.lang, mode: 'init' });
      break;
    case 'update':
      await run({ force: !!flags.force, lang: flags.lang, mode: 'update' });
      break;
    case 'install-deps':
      installDeps.run();
      break;
    case 'uninstall':
      uninstall.run();
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      console.log(HELP_TEXT);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP_TEXT);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

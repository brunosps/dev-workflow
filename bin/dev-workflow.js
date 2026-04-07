#!/usr/bin/env node

const { run } = require('../lib/init');

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
    npx dev-workflow update [--force]
    npx dev-workflow help

  Commands:
    init      Scaffold .dw/commands, templates, rules, and platform wrappers
    update    Update commands and templates (preserves rules and tasks)
    help      Show this help message

  Options:
    --force        Overwrite existing files
    --lang=LANG    Set language without prompt (en or pt-br)

  Examples:
    npx dev-workflow init                  # Interactive language selection
    npx dev-workflow init --lang=en        # English, no prompt
    npx dev-workflow init --lang=pt-br     # Portuguese, no prompt
    npx dev-workflow init --force          # Overwrite existing files
`;

async function main() {
  switch (command) {
    case 'init':
      await run({ force: !!flags.force, lang: flags.lang, mode: 'init' });
      break;
    case 'update':
      await run({ force: !!flags.force, lang: flags.lang, mode: 'update' });
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

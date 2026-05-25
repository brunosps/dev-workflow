#!/usr/bin/env node

const { run } = require('../lib/init');
const installDeps = require('../lib/install-deps');
const installAzureSkills = require('../lib/install-azure-skills');
const installAwsSkills = require('../lib/install-aws-skills');
const uninstall = require('../lib/uninstall');
const setupWslBrowser = require('../lib/setup-wsl-browser');

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
    npx dev-workflow init [--force] [--lang=en|pt-br] [--profile=core|standard|full] [--modules=<csv>]
    npx dev-workflow update [--lang=en|pt-br] [--profile=core|standard|full] [--modules=<csv>]
    npx dev-workflow install-deps
    npx dev-workflow list-installed
    npx dev-workflow doctor
    npx dev-workflow repair
    npx dev-workflow subtask create --agent=<name> --goal="<goal>"
    npx dev-workflow subtask complete --slug=<slug> --file=<handoff.md>
    npx dev-workflow subtask consume
    npx dev-workflow subtask list
    npx dev-workflow install-azure-skills [--products=<csv>]
    npx dev-workflow install-aws-skills [--region=<aws-region>]
    npx dev-workflow help

  Commands:
    init                   Scaffold .dw/ (commands, templates, references, scripts, skills, rules, MCPs)
    update                 Update managed files (commands, templates, references, scripts, skills, wrappers, MCPs)
                           and print post-update agent actions for project-derived docs/health checks
                           Preserves: .dw/rules/, .dw/spec/, .dw/bugfixes/, .dw/STATE.md, .agents/skills/azure/, user data
    list-installed         Show dev-workflow install state for this project
    doctor                 Check managed files, wrappers, agents, and MCP configuration
    repair                 Reconcile managed files using the recorded install state
    subtask                Create, complete, consume, and list local subagent handoffs
    install-deps           Install system dependencies (Playwright browsers, MCP servers)
    setup-wsl-browser      (WSL) Install the user-level prebuilt CDP relay so flows can drive the real Windows browser without admin
    install-azure-skills   Opt-in: clone curated Azure skills from MicrosoftDocs/Agent-Skills
                           into .agents/skills/azure/ and register the Microsoft Learn MCP
                           server (HTTP, no-auth). Interactive category selection.
    install-aws-skills     Opt-in: clone curated AWS skills from aws/agent-toolkit-for-aws
                           into .agents/skills/aws/ and register the unified AWS MCP Server
                           (stdio via mcp-proxy-for-aws). Requires uv, aws cli, and AWS
                           credentials. Interactive category selection.
    uninstall              Remove all managed files (commands, templates, wrappers, skills, MCPs)
                           Preserves: .dw/rules/, .dw/spec/, .dw/intel/ (user data)
    help                   Show this help message

  Options:
    --force        Overwrite existing files (init only; update always overwrites managed files)
    --lang=LANG    Set language without prompt (en or pt-br)
    --profile=NAME Install profile for agents (core, standard, full)
    --modules=CSV  Extra agent modules to install (typescript, python, csharp, rust, security, frontend)

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
      await run({ force: !!flags.force, lang: flags.lang, mode: 'init', profile: flags.profile, modules: flags.modules });
      break;
    case 'update':
      await run({ force: !!flags.force, lang: flags.lang, mode: 'update', profile: flags.profile, modules: flags.modules });
      break;
    case 'list-installed':
      require('../lib/list-installed').run();
      break;
    case 'doctor':
      require('../lib/doctor').run({ repair: false });
      break;
    case 'repair':
      await run({ force: true, lang: flags.lang, mode: 'repair', profile: flags.profile, modules: flags.modules });
      break;
    case 'subtask':
      require('../lib/subtasks').run(args.slice(1));
      break;
    case 'install-deps':
      installDeps.run();
      break;
    case 'setup-wsl-browser':
      setupWslBrowser.run();
      break;
    case 'install-azure-skills':
      await installAzureSkills.run();
      break;
    case 'install-aws-skills':
      await installAwsSkills.run();
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

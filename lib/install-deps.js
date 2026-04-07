const { execSync } = require('child_process');

function run() {
  console.log('\n  dev-workflow install-deps');
  console.log(`  ${'='.repeat(40)}\n`);

  const deps = [
    {
      name: 'Playwright browsers',
      check: 'npx playwright --version',
      install: 'npx playwright install --with-deps',
    },
    {
      name: 'Context7 MCP',
      check: null,
      install: 'npx -y @upstash/context7-mcp --help',
    },
  ];

  let installed = 0;
  let skipped = 0;
  let failed = 0;

  for (const dep of deps) {
    process.stdout.write(`  Installing ${dep.name}...`);
    try {
      execSync(dep.install, { stdio: 'pipe', timeout: 300000 });
      console.log(' \x1b[32m✓\x1b[0m');
      installed++;
    } catch (err) {
      console.log(' \x1b[31m✗\x1b[0m');
      console.log(`    Error: ${err.message.split('\n')[0]}`);
      failed++;
    }
  }

  console.log(`\n  ${'='.repeat(40)}`);
  console.log(`  Done! ${installed} installed, ${skipped} skipped, ${failed} failed`);
  console.log();
}

module.exports = { run };

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
    {
      name: 'React Doctor',
      check: null,
      install: 'npx react-doctor@latest --help',
    },
    {
      name: 'Trivy (security scanner)',
      check: 'trivy --version',
      install: null,
      instructions: [
        'Trivy is a native binary and cannot be installed via npm. Install it using your OS package manager:',
        '  macOS:    brew install trivy',
        '  Linux:    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin',
        '  Windows:  choco install trivy   (or: scoop install trivy)',
        '  Docker:   docker pull aquasec/trivy:latest   (use via alias or wrapper)',
        '',
        'Once installed, /dw-security-check will use it for CVE, secret, and IaC scanning.',
      ],
    },
    {
      name: 'Docker + Docker Compose',
      check: 'docker --version && (docker compose version || docker-compose --version)',
      install: null,
      instructions: [
        'Docker is required by /dw-new-project and /dw-dockerize for dev dependency seeding and image generation.',
        '  macOS:    https://docs.docker.com/desktop/install/mac-install/',
        '  Windows:  https://docs.docker.com/desktop/install/windows-install/',
        '  Linux:    https://docs.docker.com/engine/install/  (then enable the Compose plugin: https://docs.docker.com/compose/install/linux/)',
        '',
        'Verify after install:  docker --version && docker compose version',
      ],
    },
  ];

  let installed = 0;
  let skipped = 0;
  let failed = 0;
  let missing = 0;

  for (const dep of deps) {
    // Detect-only dependencies (install === null): check presence, print instructions if missing
    if (dep.install === null) {
      process.stdout.write(`  Checking ${dep.name}...`);
      try {
        execSync(dep.check, { stdio: 'pipe', timeout: 10000 });
        console.log(' \x1b[32m✓ already installed\x1b[0m');
        installed++;
      } catch (err) {
        console.log(' \x1b[33m— not found\x1b[0m');
        if (Array.isArray(dep.instructions)) {
          for (const line of dep.instructions) {
            console.log(`    ${line}`);
          }
        }
        missing++;
      }
      continue;
    }

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
  const parts = [`${installed} installed`];
  if (skipped) parts.push(`${skipped} skipped`);
  if (missing) parts.push(`${missing} require manual install (see instructions above)`);
  if (failed) parts.push(`${failed} failed`);
  console.log(`  Done! ${parts.join(', ')}`);
  console.log();
}

module.exports = { run };

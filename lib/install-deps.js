const { execSync } = require('child_process');

function run() {
  console.log('\n  dev-workflow install-deps');
  console.log(`  ${'='.repeat(40)}\n`);

  const deps = [
    {
      name: 'Playwright browsers (Chromium + deps)',
      check: 'npx playwright --version',
      install: 'npx playwright install --with-deps chromium',
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
        'Once installed, /dw-secure-audit will use it for CVE, secret, and IaC scanning.',
      ],
    },
    {
      name: 'Semgrep (SAST)',
      check: 'semgrep --version',
      install: null,
      instructions: [
        'Semgrep powers the SAST layer of /dw-secure-audit (semantic analysis of generated code).',
        '  pipx:     pipx install semgrep   (recommended — isolated)',
        '  pip:      python3 -m pip install --user semgrep',
        '  macOS:    brew install semgrep',
        '  Docker:   docker pull semgrep/semgrep:latest   (use via alias or wrapper)',
        '',
        'The gate runs pinned rulesets (p/security-audit, p/owasp-top-ten, p/secrets) on the diff.',
      ],
    },
    {
      name: 'gitleaks (secret scanner)',
      check: 'gitleaks version',
      install: null,
      instructions: [
        'gitleaks is the dedicated secret scanner for /dw-secure-audit (any hit blocks the gate).',
        '  macOS:    brew install gitleaks',
        '  Linux:    download from https://github.com/gitleaks/gitleaks/releases (or: go install github.com/gitleaks/gitleaks/v8@latest)',
        '  Windows:  scoop install gitleaks   (or: choco install gitleaks)',
        '  Docker:   docker pull zricethezav/gitleaks:latest',
      ],
    },
    {
      name: 'syft (SBOM, optional)',
      check: 'syft version',
      install: null,
      instructions: [
        'syft generates the SBOM for the advisory SBOM/license layer of /dw-secure-audit (optional, non-blocking).',
        '  macOS:    brew install syft',
        '  Linux:    curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin',
        '  Windows:  scoop install syft',
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

  checkPlaywrightVersion();
  printBrowserGuidance();
}

// page.screencast (used by /dw-functional-doc to record video, including over CDP) needs
// Playwright >= 1.60. Warn if the installed version is older.
function checkPlaywrightVersion() {
  try {
    const raw = execSync('npx playwright --version', { stdio: 'pipe', timeout: 15000 }).toString();
    const match = raw.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return;
    const [, major, minor] = match.map(Number);
    if (major < 1 || (major === 1 && minor < 60)) {
      console.log(`  \x1b[33m⚠ Playwright ${match[0]} detected.\x1b[0m /dw-functional-doc video needs >= 1.60 (page.screencast).`);
      console.log('    Upgrade in your project:  npm i -D @playwright/test@latest');
      console.log();
    }
  } catch {
    // playwright not resolvable here; the flow runner reports it at runtime
  }
}

function isWsl() {
  if (process.env.WSL_DISTRO_NAME) return true;
  try {
    return /microsoft/i.test(require('fs').readFileSync('/proc/version', 'utf8'));
  } catch {
    return false;
  }
}

function printBrowserGuidance() {
  if (!isWsl()) return;
  const mirrored = require('fs').existsSync('/sys/class/net/loopback0');
  console.log('  Browser automation on WSL (dw-qa / dw-functional-doc / dw-redesign-ui):');
  console.log('    Default: full headless Chromium (desktop-faithful, no WSLg) — works out of the box.');
  console.log('    To drive the real Windows browser, set BROWSER_TEST to its exe path, e.g.');
  console.log('    BROWSER_TEST="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe".');
  if (mirrored) {
    console.log('    Mirrored networking detected — connects to the Windows browser on 127.0.0.1 directly.');
  } else {
    console.log('    NAT networking — run `npx @brunosps00/dev-workflow setup-wsl-browser` once to build the');
    console.log('    cdp-relay.exe (needs Rust on Windows) and add the Hyper-V firewall rule. Otherwise flows');
    console.log('    fall back to the local headless Chromium (faithful video, no Windows browser).');
  }
  console.log('    Details: .dw/skills/dw-testing-discipline/references/playwright-recipes.md ("Browser on WSL").');
  console.log();
}

module.exports = { run };

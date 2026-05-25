const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Installs the prebuilt CDP relay (cdp-relay.exe) in the Windows user profile. Idempotent.
//
// Why: Chromium binds its debug port to Windows loopback only. On WSL NAT, dev-workflow uses
// a reverse relay where the Windows-side .exe connects outbound to a WSL broker, so no admin
// prompt, firewall rule, Rust, Node, or Python runtime is required on the Windows target.
// The relay is a tiny prebuilt .exe — no Rust/Node/Python runtime dependency on the Windows target.

const RELAY_EXE_SRC = path.join(__dirname, '..', 'scaffold', 'scripts', 'cdp-relay', 'bin', 'cdp-relay.exe');

function isWsl() {
  if (process.env.WSL_DISTRO_NAME) return true;
  try {
    return /microsoft/i.test(fs.readFileSync('/proc/version', 'utf8'));
  } catch {
    return false;
  }
}

function winEnv(name) {
  try {
    const out = execSync(`cmd.exe /c "echo %${name}%"`, { stdio: 'pipe' }).toString().split(/\r?\n/)[0].trim();
    return /^[A-Za-z]:\\/.test(out) ? out : null;
  } catch {
    return null;
  }
}

function run() {
  console.log('\n  dev-workflow setup-wsl-browser');
  console.log(`  ${'='.repeat(40)}\n`);

  if (!isWsl()) {
    console.log('  This command is only needed on WSL. On native Windows/macOS/Linux, flows use the local browser directly.');
    return;
  }

  const localAppData = winEnv('LOCALAPPDATA');
  if (!localAppData) {
    console.log('  \x1b[31m✗\x1b[0m Could not resolve %LOCALAPPDATA% on Windows. Is Windows interop enabled?');
    return;
  }
  const destWin = `${localAppData}\\dev-workflow`;
  const destWsl = execSync(`wslpath -u "${destWin}"`, { stdio: 'pipe' }).toString().trim();

  // Install the prebuilt Windows relay bundled in the npm package.
  if (!fs.existsSync(RELAY_EXE_SRC)) {
    console.log(`  \x1b[31m✗\x1b[0m Prebuilt relay not found at ${RELAY_EXE_SRC}`);
    console.log('    The dev-workflow package is incomplete. Reinstall or update @brunosps00/dev-workflow.');
    return;
  }

  process.stdout.write('  Installing cdp-relay.exe (prebuilt Windows x64)...');
  try {
    fs.mkdirSync(destWsl, { recursive: true });
    fs.copyFileSync(RELAY_EXE_SRC, path.join(destWsl, 'cdp-relay.exe'));
    console.log(' \x1b[32m✓\x1b[0m');
    console.log(`    ${destWin}\\cdp-relay.exe`);
  } catch (err) {
    console.log(' \x1b[31m✗\x1b[0m');
    console.log(`    ${String(err.message).split('\n')[0]}`);
    return;
  }

  console.log(`  ${'='.repeat(40)}`);
  console.log('  \x1b[32m✓ Done.\x1b[0m The CDP relay is installed in the Windows user profile.');
  console.log('    No admin prompt, firewall rule, or Windows Rust toolchain is required.');
  console.log(`    Set BROWSER_TEST to a Windows browser exe to use it, e.g.`);
  console.log('    BROWSER_TEST="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"');
  console.log();
}

module.exports = { run };

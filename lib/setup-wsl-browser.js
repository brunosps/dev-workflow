const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Installs the prebuilt CDP relay (cdp-relay.exe) on Windows and adds the one-time
// Hyper-V firewall rule so WSL (NAT networking) can drive the real Windows browser over CDP.
// Idempotent.
//
// Why: Chromium binds its debug port to Windows loopback only, and the WSL Hyper-V firewall
// defaults inbound to Block. A fixed-port relay + one Hyper-V allow rule bridges WSL -> browser.
// The relay is a tiny prebuilt .exe — no Rust/Node/Python runtime dependency on the Windows target.

const RELAY_PORT = 39222;
const WSL_VM_CREATOR_ID = '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}'; // standard WSL VM creator id
const RULE_NAME = 'dw-cdp-relay';
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

  // 1) Install the prebuilt Windows relay bundled in the npm package.
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

  // 2) Add the Hyper-V firewall inbound rule (one-time, elevated -> UAC prompt).
  console.log(`\n  Adding Hyper-V firewall rule for TCP ${RELAY_PORT} (a UAC prompt will appear — accept it)...`);
  const inner = [
    `Remove-NetFirewallHyperVRule -Name '${RULE_NAME}' -ErrorAction SilentlyContinue;`,
    `New-NetFirewallHyperVRule -Name '${RULE_NAME}' -DisplayName 'dev-workflow cdp-relay'`,
    `-Direction Inbound -Action Allow -VMCreatorId '${WSL_VM_CREATOR_ID}' -Protocol TCP -LocalPorts ${RELAY_PORT}`,
  ].join(' ');
  try {
    execSync(
      `powershell.exe -NoProfile -Command "Start-Process powershell -Verb RunAs -WindowStyle Hidden -ArgumentList '-NoProfile','-Command',\\"${inner}\\""`,
      { stdio: 'pipe', timeout: 60000 },
    );
  } catch {
    // Start-Process returns before the elevated process finishes; verify below regardless.
  }

  // 3) Verify.
  let ok = false;
  for (let i = 0; i < 10 && !ok; i += 1) {
    try {
      const out = execSync(
        `powershell.exe -NoProfile -c "Get-NetFirewallHyperVRule -Name '${RULE_NAME}' -ErrorAction SilentlyContinue | Select-Object -Expand Action"`,
        { stdio: 'pipe', timeout: 15000 },
      ).toString();
      ok = /Allow/i.test(out);
    } catch {
      ok = false;
    }
    if (!ok) execSync('sleep 1');
  }

  console.log(`  ${'='.repeat(40)}`);
  if (ok) {
    console.log('  \x1b[32m✓ Done.\x1b[0m The Windows browser is reachable from WSL over CDP.');
    console.log(`    Set BROWSER_TEST to a Windows browser exe to use it, e.g.`);
    console.log('    BROWSER_TEST="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"');
  } else {
    console.log('  \x1b[33m⚠ Hyper-V firewall rule not confirmed.\x1b[0m UAC may have been declined, or this Windows lacks');
    console.log('    Hyper-V firewall cmdlets. Flows will fall back to the local headless Chromium (faithful video, no');
    console.log('    Windows browser). You can also enable mirrored networking instead. Re-run to retry.');
  }
  console.log();
}

module.exports = { run, RELAY_PORT };

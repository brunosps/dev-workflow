const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Builds the Rust CDP relay (cdp-relay.exe) on Windows and adds the one-time Hyper-V firewall
// rule so WSL (NAT networking) can drive the real Windows browser over CDP. Idempotent.
//
// Why: Chromium binds its debug port to Windows loopback only, and the WSL Hyper-V firewall
// defaults inbound to Block. A fixed-port relay + one Hyper-V allow rule bridges WSL -> browser.
// The relay is a tiny static .exe — no Node/Python/PowerShell runtime dependency at run time.

const RELAY_PORT = 39222;
const WSL_VM_CREATOR_ID = '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}'; // standard WSL VM creator id
const RULE_NAME = 'dw-cdp-relay';

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

function findWindowsCargo() {
  try {
    const line = execSync('cmd.exe /c where cargo', { stdio: 'pipe' })
      .toString()
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find((s) => /cargo\.exe$/i.test(s));
    if (!line) return null;
    const wsl = execSync(`wslpath -u "${line}"`, { stdio: 'pipe' }).toString().trim();
    return fs.existsSync(wsl) ? { winPath: line, wslPath: wsl } : null;
  } catch {
    return null;
  }
}

function copyCrate(srcDir, destWslDir) {
  fs.mkdirSync(path.join(destWslDir, 'src'), { recursive: true });
  fs.copyFileSync(path.join(srcDir, 'Cargo.toml'), path.join(destWslDir, 'Cargo.toml'));
  fs.copyFileSync(path.join(srcDir, 'src', 'main.rs'), path.join(destWslDir, 'src', 'main.rs'));
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
  const srcWslDir = `${destWsl}/cdp-relay-src`;
  const srcWinDir = `${destWin}\\cdp-relay-src`;

  // 1) Build the relay with the Windows Rust toolchain.
  const cargo = findWindowsCargo();
  if (!cargo) {
    console.log('  \x1b[33m—\x1b[0m No Windows `cargo` found (where cargo). Install Rust on Windows: https://rustup.rs');
    console.log('    Without the relay, WSL flows fall back to the local headless Chromium (faithful, no Windows browser).');
    return;
  }

  const crateSrc = path.join(__dirname, '..', 'scaffold', 'scripts', 'cdp-relay');
  if (!fs.existsSync(path.join(crateSrc, 'Cargo.toml'))) {
    console.log(`  \x1b[31m✗\x1b[0m Relay crate source not found at ${crateSrc}`);
    return;
  }

  process.stdout.write('  Building cdp-relay.exe (Windows cargo, release)...');
  try {
    fs.mkdirSync(destWsl, { recursive: true });
    copyCrate(crateSrc, srcWslDir);
    execSync(`"${cargo.wslPath}" build --release --manifest-path "${srcWinDir}\\Cargo.toml"`, {
      stdio: 'pipe',
      timeout: 180000,
    });
    fs.copyFileSync(path.join(srcWslDir, 'target', 'release', 'cdp-relay.exe'), path.join(destWsl, 'cdp-relay.exe'));
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

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const cli = path.join(__dirname, '..', 'bin', 'dev-workflow.js');
const { listManagedFiles } = require('../lib/install-state');

function runCli(cwd, ...args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
  });
  assert.equal(
    result.status,
    0,
    `dev-workflow ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`
  );
}

function readManagedFiles(projectRoot) {
  const state = JSON.parse(
    fs.readFileSync(path.join(projectRoot, '.dw', 'install-state.json'), 'utf8')
  );
  return state.managed_files;
}

test('legacy updates refresh managed candidates without rewriting owner routing, plans or overrides', (t) => {
  const sourceRoot = path.join(__dirname, '..');
  const defaults = fs.readFileSync(path.join(sourceRoot, 'scaffold/config/routing.json'), 'utf8');
  for (const lang of ['en', 'pt-br']) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-legacy-upgrade-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const write = (file, content) => {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), content);
    };
    const preserved = {
      '.dw/config/routing.json': '{"schema_version":"1.0","tiers":{"standard":{"codex":{"model":"owner-model","effort":"low"}}}}\n',
      '.dw/spec/prd-existing/execution-plan.json': '{"schema_version":"1.0","approved":true,"tasks":[{"id":"1","depends_on":[]}]}\n',
      '.dw/spec/prd-existing/execution-state.json': '{"completed":["1"],"session":"owner-session"}\n',
      '.dw/goals/existing/goal.json': '{"status":"active"}\n',
      '.dw/STATE.md': '# Active owner task\n',
      '.dw/rules/project.md': '# Existing project policy\n',
      '.dw/templates/overrides/task-template.md': '# Owner task template\n',
    };
    for (const [file, content] of Object.entries(preserved)) write(file, content);
    write('.dw/install-state.json', JSON.stringify({ version: '2.2.0', lang, profile: 'core', modules: ['core'] }));
    write('.dw/commands/dw-run.md', 'Old managed execution instructions\n');
    for (let pass = 0; pass < 2; pass++) {
      // The managed reference must refresh even if an older copy already exists.
      if (pass) write('.dw/config/routing-defaults.json', '{"outdated":true}\n');
      runCli(dir, 'update', `--lang=${lang}`);
      for (const [file, content] of Object.entries(preserved)) {
        assert.equal(fs.readFileSync(path.join(dir, file), 'utf8'), content, `${lang}: changed ${file}`);
      }
      assert.equal(fs.readFileSync(path.join(dir, '.dw/config/routing-defaults.json'), 'utf8'), defaults);
      assert.equal(fs.readFileSync(path.join(dir, '.dw/templates/task-template.md'), 'utf8'), preserved['.dw/templates/overrides/task-template.md']);
      for (const file of ['commands/dw-run.md', 'commands/dw-update.md', 'references/execution-contract.md', 'templates/frontend-quality-template.md']) {
        assert.equal(fs.readFileSync(path.join(dir, '.dw', file), 'utf8'), fs.readFileSync(path.join(sourceRoot, 'scaffold', lang, file), 'utf8'));
      }
      const state = JSON.parse(fs.readFileSync(path.join(dir, '.dw/install-state.json'), 'utf8'));
      assert.equal(state.version, require('../package.json').version);
      assert.ok(state.managed_files.includes(path.join('.dw', 'config', 'routing-defaults.json')));
      const result = spawnSync(process.execPath, [path.join(dir, '.dw/scripts/lib/workflow-contract.mjs'), 'resolve', path.join(dir, '.dw/spec/prd-existing/execution-plan.json'), '1', 'local,codex'], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(JSON.parse(result.stdout).tool, 'local');
    }
  }
});

test('managed files are sorted deterministically while removing duplicates', () => {
  const projectRoot = path.join(os.tmpdir(), 'dev-workflow-managed-files');
  const first = path.join(projectRoot, 'z-last.md');
  const second = path.join(projectRoot, 'a-first.md');

  assert.deepEqual(listManagedFiles(projectRoot, [first, second, first]), [
    'a-first.md',
    'z-last.md',
  ]);
});

test('init and update persist each managed file exactly once', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-managed-files-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  runCli(tempDir, 'init', '--lang=en', '--profile=core');
  const afterInit = readManagedFiles(tempDir);
  assert.equal(afterInit.length, new Set(afterInit).size);

  runCli(tempDir, 'update', '--lang=en');
  const afterUpdate = readManagedFiles(tempDir);
  assert.equal(afterUpdate.length, new Set(afterUpdate).size);
});

test('repeated update preserves agent instruction tails with inline marker mentions', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-update-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  runCli(tempDir, 'init', '--lang=en', '--profile=core');

  const targets = ['AGENTS.md', 'CLAUDE.md'].map((name) => path.join(tempDir, name));
  const localTail = '\n# Local rules\nKeep this project-specific tail once.\n';
  for (const target of targets) {
    fs.appendFileSync(target, localTail, 'utf8');
  }

  runCli(tempDir, 'update', '--lang=en');
  const afterFirstUpdate = targets.map((target) => fs.readFileSync(target, 'utf8'));

  runCli(tempDir, 'update', '--lang=en');
  const afterSecondUpdate = targets.map((target) => fs.readFileSync(target, 'utf8'));

  assert.deepEqual(afterSecondUpdate, afterFirstUpdate);
  for (const content of afterSecondUpdate) {
    assert.match(content, /between `<!-- dev-workflow:start -->` and `<!-- dev-workflow:end -->` markers/);
    assert.equal(content.match(/^<!-- dev-workflow:start -->$/gm)?.length, 1);
    assert.equal(content.match(/^<!-- dev-workflow:end -->$/gm)?.length, 1);
    assert.equal(content.split('Keep this project-specific tail once.').length - 1, 1);
  }
});

test('init and update create .dw/reports/ with a machine-local .gitignore for the report loop', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-workflow-reports-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  runCli(tempDir, 'init', '--lang=en', '--profile=core');
  const gitignorePath = path.join(tempDir, '.dw', 'reports', '.gitignore');
  assert.ok(fs.existsSync(gitignorePath), '.dw/reports/.gitignore missing after init');
  const content = fs.readFileSync(gitignorePath, 'utf8');
  assert.match(content, /^\?\?\?\?-\?\?-\?\?\.md$/m);
  assert.match(content, /^\.active\.json$/m);

  const cliRunIgnore = path.join(tempDir, '.dw', 'cli-run', '.gitignore');
  assert.ok(fs.existsSync(cliRunIgnore), '.dw/cli-run/.gitignore missing after init');
  assert.match(fs.readFileSync(cliRunIgnore, 'utf8'), /^\*$/m);

  // A user customization survives update (writeFile with overwrite=false).
  fs.writeFileSync(gitignorePath, content + 'custom.log\n', 'utf8');
  runCli(tempDir, 'update', '--lang=en');
  assert.ok(fs.readFileSync(gitignorePath, 'utf8').includes('custom.log'));
  assert.ok(readManagedFiles(tempDir).includes(path.join('.dw', 'reports', '.gitignore')));
});

test('update moves bundled skills out of .agents/skills/ and keeps what is not ours', (t) => {
  const sourceRoot = path.join(__dirname, '..');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-skill-relocation-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  };
  const ourVerify = fs.readFileSync(path.join(sourceRoot, 'scaffold/skills/dw-verify/SKILL.md'), 'utf8');
  const thirdPartyHumanizer = '---\nname: humanizer\ndescription: upstream copy the user installed\n---\n# Humanizer\n';
  write('.dw/install-state.json', JSON.stringify({ version: '2.6.0', lang: 'en', profile: 'core', modules: ['core'] }));
  // Legacy layout from releases up to 2.6.0.
  write('.agents/skills/dw-verify/SKILL.md', ourVerify);
  write('.agents/skills/dw-verify/references/stale.md', 'old reference\n');
  // Same name as a bundled skill, but installed from elsewhere: must survive.
  write('.agents/skills/humanizer/SKILL.md', thirdPartyHumanizer);
  // The user's own skill and a vendor bundle: never touched.
  write('.agents/skills/my-own-skill/SKILL.md', '# mine\n');
  write('.agents/skills/aws/core/SKILL.md', '# aws\n');

  runCli(dir, 'update', '--lang=en');

  assert.ok(fs.existsSync(path.join(dir, '.dw/skills/dw-verify/SKILL.md')), 'bundled skill installed in .dw/skills/');
  assert.ok(!fs.existsSync(path.join(dir, '.agents/skills/dw-verify')), 'legacy copy of a bundled skill removed');
  const migratedRoot = path.join(dir, '.dw/.migrated');
  const [stamp] = fs.readdirSync(migratedRoot);
  assert.equal(
    fs.readFileSync(path.join(migratedRoot, stamp, '.agents/skills/dw-verify/references/stale.md'), 'utf8'),
    'old reference\n',
    'a retired legacy copy is moved, not deleted'
  );
  assert.equal(fs.readFileSync(path.join(dir, '.agents/skills/humanizer/SKILL.md'), 'utf8'), thirdPartyHumanizer);
  assert.ok(fs.existsSync(path.join(dir, '.agents/skills/my-own-skill/SKILL.md')));
  assert.ok(fs.existsSync(path.join(dir, '.agents/skills/aws/core/SKILL.md')));
  // Command wrappers stay discoverable: they are the entry points.
  assert.ok(fs.existsSync(path.join(dir, '.agents/skills/dw-review/SKILL.md')));
  // No bundled skill (other than the user's same-named humanizer) remains in an agent index.
  for (const name of fs.readdirSync(path.join(sourceRoot, 'scaffold/skills'))) {
    if (name === 'humanizer') continue;
    assert.ok(!fs.existsSync(path.join(dir, '.agents/skills', name)), `${name} still under .agents/skills/`);
    assert.ok(!fs.existsSync(path.join(dir, '.claude/skills', name)), `${name} under .claude/skills/`);
  }

  const uninstall = spawnSync(process.execPath, [cli, 'uninstall'], { cwd: dir, encoding: 'utf8' });
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.ok(!fs.existsSync(path.join(dir, '.dw/skills')), 'uninstall removes .dw/skills/');
  assert.equal(fs.readFileSync(path.join(dir, '.agents/skills/humanizer/SKILL.md'), 'utf8'), thirdPartyHumanizer);
  assert.ok(fs.existsSync(path.join(dir, '.agents/skills/my-own-skill/SKILL.md')));
});

test('update keeps foreign skills, saves team additions and never deletes outright', (t) => {
  const sourceRoot = path.join(__dirname, '..');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-skill-ownership-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  };
  const ourUi = fs.readFileSync(path.join(sourceRoot, 'scaffold/skills/dw-ui-discipline/SKILL.md'), 'utf8');
  // A third-party skill that happens to use the same two Structured Return labels.
  const lookalike = '---\nname: security-review\n---\n# Upstream\n- **Status:** ok\n- **Next Step:** none\n';
  write('.dw/install-state.json', JSON.stringify({
    version: '2.6.0', lang: 'en', profile: 'core', modules: ['core'],
    // 2.6.0 tracked the copy it installed; the look-alike arrived after that update.
    managed_files: ['.agents/skills/dw-ui-discipline/SKILL.md'],
  }));
  write('.agents/skills/dw-ui-discipline/SKILL.md', ourUi);
  write('.agents/skills/dw-ui-discipline/references/our-brand.md', 'team rules\n');
  write('.agents/skills/security-review/SKILL.md', lookalike);
  // Name listed in removed-bundled-skills.js: retired by name, so it must be recoverable.
  write('.agents/skills/webapp-testing/SKILL.md', '# webapp-testing\n');

  const result = spawnSync(process.execPath, [cli, 'update', '--lang=en'], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);

  assert.equal(fs.readFileSync(path.join(dir, '.agents/skills/security-review/SKILL.md'), 'utf8'), lookalike);
  assert.match(result.stdout, /\[kept\] \.agents\/skills\/security-review .*not in the previous install state/);

  assert.ok(!fs.existsSync(path.join(dir, '.agents/skills/dw-ui-discipline')));
  assert.match(result.stdout, /references\/our-brand\.md was not installed by dev-workflow/);
  const [stamp] = fs.readdirSync(path.join(dir, '.dw/.migrated'));
  const saved = path.join(dir, '.dw/.migrated', stamp, '.agents/skills');
  assert.equal(fs.readFileSync(path.join(saved, 'dw-ui-discipline/references/our-brand.md'), 'utf8'), 'team rules\n');
  assert.ok(fs.existsSync(path.join(saved, 'webapp-testing/SKILL.md')), 'name-matched removal is a move');
  assert.ok(fs.existsSync(path.join(dir, '.dw/skills/dw-ui-discipline/SKILL.md')));
});

test('uninstall keeps template overrides and only retires dev-workflow entries from .codex/skills', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-codex-skills-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  runCli(dir, 'init', '--lang=en');
  fs.mkdirSync(path.join(dir, '.codex/skills/dw-review'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.codex/skills/dw-review/SKILL.md'), '# old wrapper\n');
  fs.mkdirSync(path.join(dir, '.codex/skills/my-tool'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.codex/skills/my-tool/SKILL.md'), '# mine\n');

  fs.writeFileSync(path.join(dir, '.dw/templates/overrides/prd-template.md'), '# ours\n');

  runCli(dir, 'uninstall');

  assert.ok(!fs.existsSync(path.join(dir, '.codex/skills/dw-review')));
  const [stamp] = fs.readdirSync(path.join(dir, '.dw/.migrated'));
  assert.ok(fs.existsSync(path.join(dir, '.dw/.migrated', stamp, '.codex/skills/dw-review/SKILL.md')));
  assert.ok(fs.existsSync(path.join(dir, '.codex/skills/my-tool/SKILL.md')));
  assert.equal(fs.readFileSync(path.join(dir, '.dw/templates/overrides/prd-template.md'), 'utf8'), '# ours\n');
  assert.ok(!fs.existsSync(path.join(dir, '.dw/templates/prd-template.md')), 'managed templates removed');
});

test('update retires legacy skills only after the new copies are installed', () => {
  const init = fs.readFileSync(path.join(__dirname, '..', 'lib', 'init.js'), 'utf8');
  const copy = init.indexOf('path.join(projectRoot, BUNDLED_SKILLS_REL)');
  const migrate = init.indexOf('migrateSkills(projectRoot');
  assert.ok(copy > 0 && migrate > copy, 'migrateSkills must run after the .dw/skills copy');
});

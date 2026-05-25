const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set([
  '.git',
  '.dw',
  '.agents',
  '.claude',
  '.codex',
  '.github',
  '.opencode',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
]);

const FRONTEND_DEPS = [
  '@angular/core',
  '@remix-run/react',
  'astro',
  'next',
  'nuxt',
  'react',
  'solid-js',
  'svelte',
  'vue',
];

function listPostUpdateActions(projectRoot) {
  const actions = [];
  const analysisReasons = [];

  if (!exists(projectRoot, '.dw/rules/index.md')) {
    analysisReasons.push('missing .dw/rules/index.md');
  }
  if (!exists(projectRoot, '.dw/rules/concerns.md')) {
    analysisReasons.push('missing .dw/rules/concerns.md');
  }
  if (!exists(projectRoot, '.dw/constitution.md')) {
    analysisReasons.push('missing .dw/constitution.md');
  }

  const frontendProjects = findFrontendProjects(projectRoot);
  const missingDesignAuthority = frontendProjects.filter((dir) => !hasDesignAuthority(dir));
  if (missingDesignAuthority.length) {
    analysisReasons.push(
      `frontend design authority missing for ${formatPaths(projectRoot, missingDesignAuthority)}`,
    );
  }

  if (analysisReasons.length) {
    actions.push({
      command: '/dw-analyze-project',
      reason: `refresh project-derived docs (${analysisReasons.join('; ')})`,
    });
  }

  if (!hasCodebaseIntel(projectRoot)) {
    actions.push({
      command: '/dw-intel --build',
      reason: 'build .dw/intel/ codebase index for the refreshed command surface',
    });
  }

  actions.push({
    command: '/dw-harness-audit',
    reason: 'validate commands, wrappers, agents, MCPs, and gates after update',
  });
  actions.push({
    command: '/dw-skill-health',
    reason: 'audit refreshed bundled skills and agents for bloat, duplication, and stale references',
  });

  return actions;
}

function printPostUpdateActions(projectRoot) {
  const actions = listPostUpdateActions(projectRoot);
  console.log('  Post-update agent actions:');
  console.log('    The CLI refreshed managed files. Project-derived docs require the agent to run commands:');
  for (const action of actions) {
    console.log(`    - ${action.command} - ${action.reason}`);
  }
  console.log('    /dw-update consumes this list and runs the applicable commands after the update.');
  console.log();
}

function hasCodebaseIntel(projectRoot) {
  return ['.dw/intel/stack.json', '.dw/intel/files.json', '.dw/intel/arch.md'].every((rel) =>
    exists(projectRoot, rel),
  );
}

function findFrontendProjects(projectRoot) {
  const projects = [];
  walk(projectRoot, (dir) => {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
        ...(pkg.peerDependencies || {}),
      };
      if (FRONTEND_DEPS.some((dep) => Object.prototype.hasOwnProperty.call(deps, dep))) {
        projects.push(dir);
      }
    } catch {
      // Ignore malformed package.json here; doctor handles managed-file validation.
    }
  });
  return projects;
}

function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  visit(dir);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
    walk(path.join(dir, entry.name), visit);
  }
}

function hasDesignAuthority(projectDir) {
  return ['DESIGN.md', 'BRAND.md', 'STYLE_GUIDE.md'].some((name) =>
    fs.existsSync(path.join(projectDir, name)),
  );
}

function exists(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function formatPaths(projectRoot, dirs) {
  const formatted = dirs.slice(0, 3).map((dir) => path.relative(projectRoot, dir) || '.');
  if (dirs.length > formatted.length) formatted.push(`+${dirs.length - formatted.length} more`);
  return formatted.join(', ');
}

module.exports = {
  listPostUpdateActions,
  printPostUpdateActions,
};

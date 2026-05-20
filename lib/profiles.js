const PROFILES = {
  core: {
    description: 'Core workflow agents only.',
    modules: ['core'],
  },
  standard: {
    description: 'Core workflow plus security and frontend QA agents.',
    modules: ['core', 'security', 'frontend'],
  },
  full: {
    description: 'All bundled dev-workflow agents.',
    modules: ['core', 'security', 'frontend', 'typescript', 'python', 'csharp', 'rust'],
  },
};

const DEFAULT_PROFILE = 'standard';

function parseCsv(value) {
  if (!value || value === true) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveInstallSelection({ profile, modules }) {
  const selectedProfile = profile || DEFAULT_PROFILE;
  if (!PROFILES[selectedProfile]) {
    throw new Error(`Unknown profile: ${selectedProfile}. Valid profiles: ${Object.keys(PROFILES).join(', ')}`);
  }

  const explicitModules = parseCsv(modules);
  const selectedModules = new Set(PROFILES[selectedProfile].modules);
  for (const moduleName of explicitModules) {
    selectedModules.add(moduleName);
  }

  return {
    profile: selectedProfile,
    modules: Array.from(selectedModules).sort(),
  };
}

module.exports = { DEFAULT_PROFILE, PROFILES, resolveInstallSelection };

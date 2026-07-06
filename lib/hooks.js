const { readSettings, writeSettings } = require('./mcp');

// dev-workflow-owned hook/statusline scripts live under this path. The substring
// is the marker used to identify OUR entries in .claude/settings.json so we can
// add/refresh them on update without ever touching the user's own hooks.
const HOOKS_DIR_MARKER = '.dw/scripts/hooks/';
const GIT_GUARDRAILS_CMD = 'node .dw/scripts/hooks/git-guardrails.mjs';
const STATUSLINE_CMD = 'node .dw/scripts/hooks/statusline.mjs';
const GIT_GUARDRAILS_SCRIPT = 'git-guardrails.mjs';
const SESSION_COST_CMD = 'node .dw/scripts/hooks/session-cost.mjs';
const SESSION_COST_SCRIPT = 'session-cost.mjs';

function isOurs(command) {
  return typeof command === 'string' && command.includes(HOOKS_DIR_MARKER);
}

/**
 * Reconcile dev-workflow hooks + statusLine into .claude/settings.json.
 *
 * Marker-based and merge-aware (unlike installMCPs' add-if-missing):
 *  - adds our entries when absent;
 *  - refreshes our entries in place when the script path/shape changed (so an
 *    update actually updates);
 *  - never removes or rewrites hooks/statusLine the user added;
 *  - leaves a user-defined statusLine untouched (reports it so the caller can
 *    surface a post-update note).
 *
 * Returns { hooks, statusLine } where each is 'added' | 'updated' | 'unchanged'
 * (statusLine may also be 'skipped-user').
 */
function installHooks(projectRoot) {
  const settings = readSettings(projectRoot);
  const before = JSON.stringify(settings);

  const hooksResult = reconcilePreToolUseGitGuardrails(settings);
  const sessionCostResult = reconcileSessionEndCost(settings);
  const statusLineResult = reconcileStatusLine(settings);

  if (JSON.stringify(settings) !== before) {
    writeSettings(projectRoot, settings);
  }

  return { hooks: hooksResult, sessionCost: sessionCostResult, statusLine: statusLineResult };
}

/**
 * Reconcile the SessionEnd cost-tracking hook (marker-based, merge-aware — same
 * contract as the git guardrail). No matcher: fires on every session end.
 * Returns 'added' | 'updated' | 'unchanged'.
 */
function reconcileSessionEndCost(settings) {
  if (!settings.hooks || typeof settings.hooks !== 'object') settings.hooks = {};
  if (!Array.isArray(settings.hooks.SessionEnd)) settings.hooks.SessionEnd = [];

  const groups = settings.hooks.SessionEnd;

  const existed = groups.some(
    (g) => g && Array.isArray(g.hooks) && g.hooks.some((h) => h && typeof h.command === 'string' && h.command.includes(SESSION_COST_SCRIPT)),
  );
  const exactPresent = groups.some(
    (g) => g && Array.isArray(g.hooks) && g.hooks.some((h) => h && h.command === SESSION_COST_CMD),
  );

  if (exactPresent) return 'unchanged';

  // Drop any stale/relocated copies of OUR hook, preserving user hooks.
  for (const group of groups) {
    if (!group || !Array.isArray(group.hooks)) continue;
    group.hooks = group.hooks.filter(
      (h) => !(h && typeof h.command === 'string' && h.command.includes(SESSION_COST_SCRIPT)),
    );
  }
  settings.hooks.SessionEnd = groups.filter((g) => g && Array.isArray(g.hooks) && g.hooks.length > 0);

  settings.hooks.SessionEnd.push({ hooks: [{ type: 'command', command: SESSION_COST_CMD }] });

  return existed ? 'updated' : 'added';
}

function reconcilePreToolUseGitGuardrails(settings) {
  if (!settings.hooks || typeof settings.hooks !== 'object') settings.hooks = {};
  if (!Array.isArray(settings.hooks.PreToolUse)) settings.hooks.PreToolUse = [];

  const groups = settings.hooks.PreToolUse;

  // Was our guardrail already wired (anywhere, any shape)?
  const existed = groups.some(
    (g) =>
      g && Array.isArray(g.hooks) && g.hooks.some((h) => h && typeof h.command === 'string' && h.command.includes(GIT_GUARDRAILS_SCRIPT)),
  );
  // Already wired with the exact canonical command in a Bash group?
  const exactPresent = groups.some(
    (g) =>
      g && g.matcher === 'Bash' && Array.isArray(g.hooks) && g.hooks.some((h) => h && h.command === GIT_GUARDRAILS_CMD),
  );

  if (exactPresent) return 'unchanged';

  // Drop any stale/relocated copies of OUR guardrail, preserving user hooks.
  for (const group of groups) {
    if (!group || !Array.isArray(group.hooks)) continue;
    group.hooks = group.hooks.filter(
      (h) => !(h && typeof h.command === 'string' && h.command.includes(GIT_GUARDRAILS_SCRIPT)),
    );
  }
  // Prune groups we just emptied (only those left with zero hooks).
  settings.hooks.PreToolUse = groups.filter((g) => g && Array.isArray(g.hooks) && g.hooks.length > 0);

  // Re-add the canonical entry: into an existing Bash group if present, else new.
  const bashGroup = settings.hooks.PreToolUse.find((g) => g && g.matcher === 'Bash' && Array.isArray(g.hooks));
  if (bashGroup) {
    bashGroup.hooks.push({ type: 'command', command: GIT_GUARDRAILS_CMD });
  } else {
    settings.hooks.PreToolUse.push({ matcher: 'Bash', hooks: [{ type: 'command', command: GIT_GUARDRAILS_CMD }] });
  }

  return existed ? 'updated' : 'added';
}

function reconcileStatusLine(settings) {
  const desired = { type: 'command', command: STATUSLINE_CMD };
  const current = settings.statusLine;

  if (!current) {
    settings.statusLine = desired;
    return 'added';
  }
  // Only manage a statusLine we own; never clobber a user's custom one.
  if (current.command === STATUSLINE_CMD) return 'unchanged';
  if (isOurs(current.command)) {
    settings.statusLine = desired; // our script moved/renamed — refresh
    return 'updated';
  }
  return 'skipped-user';
}

/**
 * Remove ONLY dev-workflow-owned hook + statusLine entries (used by uninstall).
 * Returns the number of entries removed.
 */
function removeHooks(projectRoot) {
  const settings = readSettings(projectRoot);
  let removed = 0;

  // Remove OUR hook entries from every event (PreToolUse, SessionEnd, PostToolUse, …),
  // identified by the .dw/scripts/hooks/ marker; never touch user-added hooks.
  if (settings.hooks && typeof settings.hooks === 'object') {
    for (const event of Object.keys(settings.hooks)) {
      const groups = settings.hooks[event];
      if (!Array.isArray(groups)) continue;
      for (const group of groups) {
        if (!group || !Array.isArray(group.hooks)) continue;
        const kept = group.hooks.filter((h) => !(h && isOurs(h.command)));
        removed += group.hooks.length - kept.length;
        group.hooks = kept;
      }
      settings.hooks[event] = groups.filter((g) => g && Array.isArray(g.hooks) && g.hooks.length > 0);
      if (settings.hooks[event].length === 0) delete settings.hooks[event];
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  }

  if (settings.statusLine && isOurs(settings.statusLine.command)) {
    delete settings.statusLine;
    removed++;
  }

  if (removed > 0) writeSettings(projectRoot, settings);
  return removed;
}

module.exports = {
  installHooks,
  removeHooks,
  HOOKS_DIR_MARKER,
  GIT_GUARDRAILS_CMD,
  STATUSLINE_CMD,
  SESSION_COST_CMD,
};

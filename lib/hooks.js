const fs = require('fs');
const path = require('path');
const { readSettings, writeSettings } = require('./mcp');

// dev-workflow-owned hook/statusline scripts live under this path. The substring
// is the marker used to identify OUR entries in .claude/settings.json and
// .codex/hooks.json so we can add/refresh them on update without ever touching
// the user's own hooks.
const HOOKS_DIR_MARKER = '.dw/scripts/hooks/';

// Hooks run in the session's *current* directory, which in Claude Code follows
// every `cd` in the Bash tool. A cwd-relative `node .dw/...` breaks with "Cannot
// find module" as soon as the shell sits in a subdirectory, and a failing
// PreToolUse hook is non-blocking: the command runs unguarded. Claude Code exports
// $CLAUDE_PROJECT_DIR to hooks; Codex exports no project variable, so fall back to
// the git root (a worktree's own root), then to the cwd. The fallback is only
// evaluated when the variable is unset.
const PROJECT_ROOT = '${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}';
const hookCommand = (script) => `node "${PROJECT_ROOT}/${HOOKS_DIR_MARKER}${script}"`;

// Codex reads project hooks from .codex/hooks.json (same shape as Claude Code's
// "hooks" block; PreToolUse matches tool_name "Bash"). It only runs them once the
// project's .codex/ layer and the hook itself are trusted in Codex.
const CODEX_HOOKS_FILE = path.join('.codex', 'hooks.json');

const GIT_GUARDRAILS_SCRIPT = 'git-guardrails.mjs';
const GIT_GUARDRAILS_CMD = hookCommand(GIT_GUARDRAILS_SCRIPT);
const STATUSLINE_CMD = hookCommand('statusline.mjs');
const SESSION_COST_SCRIPT = 'session-cost.mjs';
const SESSION_COST_CMD = hookCommand(SESSION_COST_SCRIPT);

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
 * Also reconciles the git guardrail into .codex/hooks.json (see installCodexHooks).
 *
 * Returns { hooks, sessionCost, statusLine, codex } where each is 'added' |
 * 'updated' | 'unchanged' (statusLine may also be 'skipped-user', codex
 * 'skipped-malformed').
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

  return {
    hooks: hooksResult,
    sessionCost: sessionCostResult,
    statusLine: statusLineResult,
    codex: installCodexHooks(projectRoot),
  };
}

function readCodexHooks(projectRoot) {
  const file = path.join(projectRoot, CODEX_HOOKS_FILE);
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCodexHooks(projectRoot, config) {
  const file = path.join(projectRoot, CODEX_HOOKS_FILE);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Reconcile the git guardrail into .codex/hooks.json — the only dev-workflow hook
 * Codex gets: session-cost parses Claude Code transcripts and Codex has no
 * statusLine command. Same marker-based contract as the Claude side.
 * Returns 'added' | 'updated' | 'unchanged' | 'skipped-malformed'.
 */
function installCodexHooks(projectRoot) {
  const config = readCodexHooks(projectRoot);
  if (config === null) return 'skipped-malformed';
  const before = JSON.stringify(config);
  const result = reconcilePreToolUseGitGuardrails(config);
  if (JSON.stringify(config) !== before) writeCodexHooks(projectRoot, config);
  return result;
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
 * Remove ONLY dev-workflow-owned hook + statusLine entries from .claude/settings.json
 * and .codex/hooks.json (used by uninstall). Returns the number of entries removed.
 */
function removeHooks(projectRoot) {
  const settings = readSettings(projectRoot);
  // Remove OUR hook entries from every event (PreToolUse, SessionEnd, PostToolUse, …),
  // identified by the .dw/scripts/hooks/ marker; never touch user-added hooks.
  let removed = removeOurHookEntries(settings);

  if (settings.statusLine && isOurs(settings.statusLine.command)) {
    delete settings.statusLine;
    removed++;
  }

  if (removed > 0) writeSettings(projectRoot, settings);
  return removed + removeCodexHooks(projectRoot);
}

function removeOurHookEntries(config) {
  let removed = 0;
  if (!config.hooks || typeof config.hooks !== 'object') return 0;
  for (const event of Object.keys(config.hooks)) {
    const groups = config.hooks[event];
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      if (!group || !Array.isArray(group.hooks)) continue;
      const kept = group.hooks.filter((h) => !(h && isOurs(h.command)));
      removed += group.hooks.length - kept.length;
      group.hooks = kept;
    }
    config.hooks[event] = groups.filter((g) => g && Array.isArray(g.hooks) && g.hooks.length > 0);
    if (config.hooks[event].length === 0) delete config.hooks[event];
  }
  if (Object.keys(config.hooks).length === 0) delete config.hooks;
  return removed;
}

// Remove OUR entries from .codex/hooks.json; delete the file only when nothing
// of the user's is left in it.
function removeCodexHooks(projectRoot) {
  const config = readCodexHooks(projectRoot);
  if (!config) return 0;
  const removed = removeOurHookEntries(config);
  if (removed === 0) return 0;
  const file = path.join(projectRoot, CODEX_HOOKS_FILE);
  if (Object.keys(config).length === 0) {
    fs.rmSync(file);
    try {
      fs.rmdirSync(path.dirname(file));
    } catch {
      /* .codex/ still holds other files */
    }
  } else {
    writeCodexHooks(projectRoot, config);
  }
  return removed;
}

module.exports = {
  installHooks,
  removeHooks,
  HOOKS_DIR_MARKER,
  CODEX_HOOKS_FILE,
  GIT_GUARDRAILS_SCRIPT,
  GIT_GUARDRAILS_CMD,
  STATUSLINE_CMD,
  SESSION_COST_CMD,
};

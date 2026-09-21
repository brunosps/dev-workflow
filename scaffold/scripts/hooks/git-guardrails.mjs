#!/usr/bin/env node
/**
 * dev-workflow git guardrails — Claude Code PreToolUse hook (matcher: Bash).
 *
 * Blocks irreversible git commands (force push, hard reset, clean -f, branch
 * deletion, remote branch deletion). Everything else is allowed.
 *
 * Enforces the destructive-command rules from the `dw-git-discipline` skill at
 * the harness level instead of relying on prose. Inspired by mattpocock/skills
 * `git-guardrails-claude-code` (MIT).
 *
 * Contract: reads the PreToolUse payload as JSON on stdin, emits a
 * permissionDecision via hookSpecificOutput. Fails OPEN — any parsing/runtime
 * error allows the command, so a hook bug never blocks the user.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DANGEROUS = [
  { re: /\bgit\s+push\b[^\n|&;]*(--force\b|--force-with-lease\b|\s-f\b)/, why: 'force push rewrites remote history' },
  { re: /\bgit\s+push\b[^\n|&;]*(--delete\b|\s-d\b|\s:\S)/, why: 'deletes a remote branch' },
  { re: /\bgit\s+reset\b[^\n|&;]*--hard\b/, why: 'hard reset discards uncommitted work and rewrites the branch' },
  { re: /\bgit\s+clean\b[^\n|&;]*-[a-z]*f/, why: 'git clean -f permanently deletes untracked files' },
  { re: /\bgit\s+branch\b[^\n|&;]*\s-D\b/, why: 'force-deletes a branch that may be unmerged' },
  { re: /\bgit\s+worktree\s+remove\b[^\n|&;]*(--force\b|\s-f\b)/, why: 'force-removes a worktree that may hold uncommitted work — commit first or use /dw-worktree clean (never --force)' },
  { re: /\bgit\s+checkout\b[^\n|&;]*\s(--\s+\.|\.\s*$)/, why: 'discards all local changes in the working tree' },
  { re: /\bgit\s+restore\b[^\n|&;]*\s(--\s+)?\.(?=\s*(?:$|[|&;]))/, why: 'discards all local changes in the working tree' },
  { re: /\bgit\s+filter-branch\b/, why: 'filter-branch rewrites every commit it touches' },
  { re: /\bgit\s+reflog\s+expire\b/, why: 'expiring the reflog destroys the recovery net for everything above' },
  { re: /\bgit\s+gc\b[^\n|&;]*--prune\b/, why: 'pruning unreachable objects makes a bad reset or rebase unrecoverable' },
  { re: /\bgit\s+stash\s+(drop|clear)\b/, why: 'drops stashed work that has no other copy' },
  { re: /\bgit\s+branch\b[^\n|&;]*\s-M\b/, why: 'force-renames over an existing branch, discarding it' },
  { re: /\bgit\s+update-ref\b[^\n|&;]*\s-d\b/, why: 'deletes a ref directly, bypassing every branch-level guard' },
];

// Deliberately NOT here: `git rebase` and `git commit --amend`. Both are routine on
// unpushed local work, and the command line cannot tell pushed from unpushed — blocking
// them would produce false denials often enough to train people into disabling the hook,
// which costs more than the two cases it would catch. `.dw/references/invariants.md`
// carries the rule for the pushed case, where the hook cannot decide it.

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function allow() {
  process.exit(0);
}

export function evaluatePayload(input) {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    return null; // fail open
  }

  const command = payload && payload.tool_input && typeof payload.tool_input.command === 'string'
    ? payload.tool_input.command
    : '';
  if (!command) return null;

  for (const rule of DANGEROUS) {
    if (rule.re.test(command)) {
      return {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `Blocked by dev-workflow git guardrails: ${rule.why}. ` +
            `If this is intentional, run it yourself outside the agent, or adjust .claude/settings.json hooks.`,
        },
      };
    }
  }

  return null;
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }) + '\n',
  );
  process.exit(0);
}

async function main() {
  const result = evaluatePayload(await readStdin());
  if (!result) return allow();
  return deny(result.hookSpecificOutput.permissionDecisionReason);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => allow());
}

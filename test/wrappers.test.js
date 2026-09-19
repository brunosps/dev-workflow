'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { COMMANDS, PLATFORMS } = require('../lib/constants');

// No bundled command sets `userInvoked` any more, so nothing else in the suite walks
// this branch. The mechanism is kept for a consumer's own commands — these tests are
// what stop it from rotting silently while unused.
test('the claude wrapper emits the lock when a command asks for it', () => {
  const locked = PLATFORMS.claude.wrapperTemplate('dw-example', 'Does a thing.', { userInvoked: true });
  assert.match(locked, /^disable-model-invocation: true$/m);
  // The field must sit inside the frontmatter block, not after it.
  const [, frontmatter] = locked.split('---');
  assert.match(frontmatter, /disable-model-invocation: true/);
});

test('the claude wrapper omits the lock by default', () => {
  for (const opts of [{}, { userInvoked: false }, undefined]) {
    const open = PLATFORMS.claude.wrapperTemplate('dw-example', 'Does a thing.', opts);
    assert.ok(!open.includes('disable-model-invocation'), `opts=${JSON.stringify(opts)} must not lock`);
  }
});

test('a description with quotes stays valid frontmatter', () => {
  const out = PLATFORMS.claude.wrapperTemplate('dw-example', 'Say "hi" to the user.', { userInvoked: true });
  assert.match(out, /description: "Say \\"hi\\" to the user\."/);
  assert.match(out, /^disable-model-invocation: true$/m);
});

test('every real command description survives the template', () => {
  for (const locale of ['en', 'pt-br']) {
    for (const cmd of COMMANDS[locale]) {
      const out = PLATFORMS.claude.wrapperTemplate(cmd.name, cmd.description, cmd);
      assert.ok(out.includes(`name: ${cmd.name}`), `${locale} ${cmd.name}`);
      assert.ok(out.includes(`.dw/commands/${cmd.name}.md`), `${locale} ${cmd.name} body pointer`);
      // Nothing is locked today; the previous test guards the branch itself.
      assert.equal(out.includes('disable-model-invocation'), Boolean(cmd.userInvoked), `${locale} ${cmd.name}`);
    }
  }
});

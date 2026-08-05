const { test } = require('node:test');
const assert = require('node:assert/strict');

const { step, stepUp, stepDown } = require('../index');

test('stepUp: nudges strength up by one step', () => {
  assert.deepEqual(stepUp({ name: 'cat', strength: 1 }), { name: 'cat', strength: 1.1 });
  assert.deepEqual(stepUp({ name: 'cat', strength: 1.1 }), { name: 'cat', strength: 1.2 });
});

test('stepDown: nudges strength down by one step', () => {
  assert.deepEqual(stepDown({ name: 'cat', strength: 1 }), { name: 'cat', strength: 0.9 });
  assert.deepEqual(stepDown({ name: 'cat', strength: 0.9 }), { name: 'cat', strength: 0.8 });
});

test('step: applies a signed step in one call', () => {
  assert.deepEqual(step({ name: 'cat', strength: 1 }, 2), { name: 'cat', strength: 1.2 });
  assert.deepEqual(step({ name: 'cat', strength: 1 }, -2), { name: 'cat', strength: 0.8 });
});

test('step: never drifts into float noise', () => {
  assert.deepEqual(stepUp(stepUp({ name: 'cat', strength: 1 })), { name: 'cat', strength: 1.2 });
  assert.deepEqual(stepDown(stepDown({ name: 'cat', strength: 1 })), { name: 'cat', strength: 0.8 });
});

test('step: works from non-standard strengths', () => {
  assert.deepEqual(stepUp({ name: 'cat', strength: 1.21 }), { name: 'cat', strength: 1.31 });
  assert.deepEqual(stepDown({ name: 'cat', strength: 1.05 }), { name: 'cat', strength: 0.95 });
});

test('step: returns a new entry and leaves the input alone', () => {
  const entry = { name: 'cat', strength: 1 };
  const next = stepUp(entry);
  assert.notEqual(next, entry);
  assert.deepEqual(entry, { name: 'cat', strength: 1 });
});

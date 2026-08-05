const { test } = require('node:test');
const assert = require('node:assert/strict');

const { render, renderEntry } = require('../index');
const { split } = require('../../splitter');
const { stepUp } = require('../../strength');

test('renderEntry: neutral strengths render bare', () => {
  assert.equal(renderEntry({ name: 'cat', strength: 1 }), 'cat');
  assert.equal(renderEntry({ name: 'cat', strength: 1.0 }), 'cat');
});

test('renderEntry: boosted strengths render with explicit parens', () => {
  assert.equal(renderEntry({ name: 'cat', strength: 1.1 }), '(cat:1.1)');
  assert.equal(renderEntry({ name: 'cat', strength: 1.2 }), '(cat:1.2)');
  assert.equal(renderEntry({ name: 'cat', strength: 1.05 }), '(cat:1.05)');
});

test('renderEntry: weakened strengths render with explicit brackets', () => {
  assert.equal(renderEntry({ name: 'cat', strength: 0.9 }), '[cat:0.9]');
  assert.equal(renderEntry({ name: 'cat', strength: 0.8 }), '[cat:0.8]');
});

test('renderEntry: never emits float noise', () => {
  assert.equal(renderEntry({ name: 'cat', strength: 1.2100000000000002 }), '(cat:1.21)');
});

test('render: joins entries with commas and preserves order', () => {
  assert.equal(
    render([
      { name: 'cat', strength: 1.2 },
      { name: 'dog', strength: 0.8 },
      { name: 'bird', strength: 1 }
    ]),
    '(cat:1.2), [dog:0.8], bird'
  );
});

test('render: empty list renders empty text', () => {
  assert.equal(render([]), '');
});

test('round trip: split(render(entries)) preserves names and strengths', () => {
  const entries = [
    { name: 'cat', strength: 1.2 },
    { name: 'dog', strength: 0.8 },
    { name: 'bird', strength: 1 },
    { name: 'mouse', strength: 1.31 }
  ];
  assert.deepEqual(split(render(entries)), entries);
});

test('round trip: stepping through the editor survives re-paste', () => {
  const after = split(render([stepUp(stepUp({ name: 'cat', strength: 1 }))]));
  assert.deepEqual(after, [{ name: 'cat', strength: 1.2 }]);
});

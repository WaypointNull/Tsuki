const { test } = require('node:test');
const assert = require('node:assert/strict');

const { split, parseEntry } = require('../index');

test('split: turns a bare comma list into neutral entries', () => {
  assert.deepEqual(split('cat, dog, bird'), [
    { name: 'cat', strength: 1 },
    { name: 'dog', strength: 1 },
    { name: 'bird', strength: 1 }
  ]);
});

test('split: tolerates whitespace and empty slots', () => {
  assert.deepEqual(split('  cat ,  , dog ,'), [
    { name: 'cat', strength: 1 },
    { name: 'dog', strength: 1 }
  ]);
});

test('split: treats newlines as separators', () => {
  assert.deepEqual(split('cat\ndog'), [
    { name: 'cat', strength: 1 },
    { name: 'dog', strength: 1 }
  ]);
  assert.deepEqual(split('cat,\ndog'), [
    { name: 'cat', strength: 1 },
    { name: 'dog', strength: 1 }
  ]);
  assert.deepEqual(split('cat\r\ndog\r\nbird'), [
    { name: 'cat', strength: 1 },
    { name: 'dog', strength: 1 },
    { name: 'bird', strength: 1 }
  ]);
});

test('split: mixes commas and newlines without dupes', () => {
  assert.deepEqual(split('cat, dog\nbird\n, mouse'), [
    { name: 'cat', strength: 1 },
    { name: 'dog', strength: 1 },
    { name: 'bird', strength: 1 },
    { name: 'mouse', strength: 1 }
  ]);
});

test('split: returns an empty list for empty input', () => {
  assert.deepEqual(split(''), []);
  assert.deepEqual(split('   '), []);
  assert.deepEqual(split(undefined), []);
});

test('parseEntry: reads parens, brackets, and braces', () => {
  assert.deepEqual(parseEntry('(tag)'), { name: 'tag', strength: 1.1 });
  assert.deepEqual(parseEntry('[tag]'), { name: 'tag', strength: 0.9 });
  assert.deepEqual(parseEntry('{tag}'), { name: 'tag', strength: 1.05 });
});

test('parseEntry: reads explicit weights', () => {
  assert.deepEqual(parseEntry('(tag:1.2)'), { name: 'tag', strength: 1.2 });
  assert.deepEqual(parseEntry('[tag:0.8]'), { name: 'tag', strength: 0.8 });
  assert.deepEqual(parseEntry('(tag:1.0)'), { name: 'tag', strength: 1 });
});

test('parseEntry: stacks nested wrappers multiplicatively', () => {
  assert.deepEqual(parseEntry('((tag))'), { name: 'tag', strength: 1.21 });
  assert.deepEqual(parseEntry('[[tag]]'), { name: 'tag', strength: 0.81 });
  assert.deepEqual(parseEntry('((tag:1.2))'), { name: 'tag', strength: 1.32 });
});

test('parseEntry: leaves malformed wrappers as literal tags', () => {
  assert.deepEqual(parseEntry('(tag'), { name: '(tag', strength: 1 });
  assert.deepEqual(parseEntry('tag)'), { name: 'tag)', strength: 1 });
  assert.deepEqual(parseEntry('[tag'), { name: '[tag', strength: 1 });
  assert.deepEqual(parseEntry('()'), { name: '()', strength: 1 });
  assert.deepEqual(parseEntry('tag (lol)'), { name: 'tag (lol)', strength: 1 });
});

test('split: round-trips weighted input back into strengths', () => {
  assert.deepEqual(split('(cat:1.2), [dog:0.8], plain, ((bird))'), [
    { name: 'cat', strength: 1.2 },
    { name: 'dog', strength: 0.8 },
    { name: 'plain', strength: 1 },
    { name: 'bird', strength: 1.21 }
  ]);
});

test('parseEntry: a bare name that looks like a weight is kept literal', () => {
  assert.deepEqual(parseEntry('v1.5'), { name: 'v1.5', strength: 1 });
});

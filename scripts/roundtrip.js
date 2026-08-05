const assert = require('node:assert/strict');
const { split } = require('../server/src/modules/splitter');
const { stepUp, stepDown } = require('../server/src/modules/strength');
const { render } = require('../server/src/modules/renderer');

const APPLY = { up: stepUp, down: stepDown };

const CASES = [
  {
    name: 'plain list with a boosted tag',
    paste: 'cat, dog, bird',
    edits: [{ i: 1, op: 'up' }]
  },
  {
    name: 'already-weighted input is preserved',
    paste: '(cat:1.2), [dog:0.8], plain',
    edits: []
  },
  {
    name: 'newline-separated paste is normalized',
    paste: 'masterpiece\nbest quality\nsitting',
    edits: []
  },
  {
    name: 'nested weights survive',
    paste: '((bird)), [cat:0.8]',
    edits: []
  },
  {
    name: 'stepping back to neutral round-trips to a bare tag',
    paste: '[dog:0.9]',
    edits: [{ i: 0, op: 'up' }]
  },
  {
    name: 'malformed wrappers stay literal',
    paste: '(unbalanced, tag) fine',
    edits: []
  },
  {
    name: 'a handful of clicks across the list',
    paste: 'masterpiece, (catgirl:1.1), blue_hair, [side_ponytail:0.8]',
    edits: [
      { i: 1, op: 'up' },
      { i: 3, op: 'down' },
      { i: 2, op: 'up' }
    ]
  }
];

let failed = 0;

for (const c of CASES) {
  try {
    let entries = split(c.paste);
    for (const edit of c.edits) {
      entries[edit.i] = APPLY[edit.op](entries[edit.i]);
    }
    const text = render(entries);
    const reparsed = split(text);
    assert.deepEqual(reparsed, entries);
    console.log(`PASS  ${c.name}`);
    console.log(`      ${JSON.stringify(c.paste)}`);
    console.log(`      -> ${text}`);
  } catch (error) {
    failed++;
    console.error(`FAIL  ${c.name}`);
    console.error(`      ${error.message}`);
  }
}

console.log(failed === 0 ? '\nAll round-trips hold.' : `\n${failed} round-trip(s) broke.`);
process.exit(failed === 0 ? 0 : 1);

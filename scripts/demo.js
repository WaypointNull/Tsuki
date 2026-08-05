const { split, parseEntry } = require('../server/src/modules/splitter');
const { stepUp, stepDown } = require('../server/src/modules/strength');
const { render, renderEntry } = require('../server/src/modules/renderer');

const PASTES = [
  'cat, dog, bird',
  'cat,   dog ,bird',
  'cat, , dog,',
  'masterpiece\nbest quality\nsitting',
  '(cat:1.2), [dog:0.8], plain',
  '((masterpiece)), (best_quality:1.1), {lora_tag}',
  '(unbalanced'
];

function printEntries(entries) {
  if (entries.length === 0) {
    console.log('  (empty)');
    return;
  }
  const width = Math.max(...entries.map((e) => e.name.length));
  for (const entry of entries) {
    console.log(`  ${entry.name.padEnd(width)}  x${entry.strength}`);
  }
}

function section(label, fn) {
  console.log(`\n=== ${label} ===`);
  fn();
}

console.log('Tsuki — command demo (pure modules, no server, no LLM)');

section('split(text) — prompt tag separation', () => {
  for (const paste of PASTES) {
    console.log(`\n  in:   ${JSON.stringify(paste)}`);
    printEntries(split(paste));
  }
});

section('stepUp(entry) / stepDown(entry) — clicking a tag', () => {
  let entry = parseEntry('(cat:1.2)');
  console.log(`\n  start:    ${entry.name} x${entry.strength}  ->  ${renderEntry(entry)}`);
  entry = stepUp(entry);
  console.log(`  stepUp:   ${entry.name} x${entry.strength}  ->  ${renderEntry(entry)}`);
  entry = stepUp(entry);
  console.log(`  stepUp:   ${entry.name} x${entry.strength}  ->  ${renderEntry(entry)}`);
  entry = stepDown(entry);
  console.log(`  stepDown: ${entry.name} x${entry.strength}  ->  ${renderEntry(entry)}`);
  entry = stepDown(entry);
  console.log(`  stepDown: ${entry.name} x${entry.strength}  ->  ${renderEntry(entry)}`);
  entry = stepDown(entry);
  console.log(`  stepDown: ${entry.name} x${entry.strength}  ->  ${renderEntry(entry)}`);
});

section('render(entries) — raw prompt text out', () => {
  const entries = split('(cat:1.2), [dog:0.8], plain, ((bird))');
  console.log(`\n  in:   cat, dog, bird, mouse (weights set via click)`);
  printEntries(entries);
  console.log(`\n  out:  ${render(entries)}`);
});

section('full flow — paste, nudge, copy', () => {
  let entries = split('masterpiece, best quality, catgirl, blue_hair, side_ponytail');
  entries = entries.map((entry, i) => {
    if (i === 2) return stepUp(entry);
    if (i === 3) return stepUp(entry);
    if (i === 4) return stepDown(entry);
    return entry;
  });
  printEntries(entries);
  console.log(`\n  out:  ${render(entries)}`);
});

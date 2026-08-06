const { ensureCases } = require('./generator');
const { CASES_FILE } = require('./datasets');

function pct(count, total) {
  if (total === 0) return 'n/a';
  return ((count / total) * 100).toFixed(1) + '%';
}

function printTable(header, rows) {
  const widths = header.map((_, col) => Math.max(...rows.map((row) => String(row[col]).length), header[col].length));
  const fmt = (row) => row.map((cell, col) => String(cell).padEnd(widths[col])).join('  ');
  console.log(fmt(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const row of rows) console.log(fmt(row));
}

function run(deps) {
  const cases = ensureCases(deps);
  const overall = { total: cases.length, recovered: 0, wrong: 0, unresolved: 0 };
  const byCategory = new Map();
  const wrongSamples = [];
  const unresolvedSamples = [];
  let reachedRetrieval = 0;
  let retrievalTop1 = 0;
  let retrievalTop5 = 0;
  let totalMs = 0;

  for (const c of cases) {
    const start = process.hrtime.bigint();
    const result = deps.retrieval.resolve(c.input);
    totalMs += Number(process.hrtime.bigint() - start) / 1e6;
    let outcome;
    if (result.tag === c.expected) outcome = 'recovered';
    else if (result.status === 'unknown') outcome = 'unresolved';
    else outcome = 'wrong';
    overall[outcome]++;

    if (!byCategory.has(c.category)) byCategory.set(c.category, { total: 0, recovered: 0, wrong: 0, unresolved: 0 });
    const cat = byCategory.get(c.category);
    cat.total++;
    cat[outcome]++;

    if (result.candidates && result.candidates.length) {
      reachedRetrieval++;
      if (result.candidates[0].tag === c.expected) retrievalTop1++;
      if (result.candidates.slice(0, 5).some((candidate) => candidate.tag === c.expected)) retrievalTop5++;
    }

    if (outcome === 'wrong' && wrongSamples.length < 10)
      wrongSamples.push({ input: c.input, expected: c.expected, got: result.tag });
    if (outcome === 'unresolved' && unresolvedSamples.length < 10)
      unresolvedSamples.push({ input: c.input, expected: c.expected });
  }

  console.log('\n=== Danbooru Resolution Benchmark ===');
  console.log('Total cases:', overall.total, '(corpus:', CASES_FILE + ')');
  console.log('Avg resolve time:', (totalMs / overall.total).toFixed(2) + 'ms/case');

  const rows = [];
  for (const [category, cat] of byCategory) {
    rows.push([category, cat.total, cat.recovered, cat.wrong, cat.unresolved, pct(cat.recovered, cat.total)]);
  }
  rows.push([
    'OVERALL',
    overall.total,
    overall.recovered,
    overall.wrong,
    overall.unresolved,
    pct(overall.recovered, overall.total)
  ]);
  printTable(['Category', 'Total', 'Recovered', 'Wrong', 'Unresolved', 'Rate'], rows);

  console.log('\nRetrieval quality (cases reaching retrieval):', reachedRetrieval);
  console.log('  top-1 correct:', retrievalTop1, `(${pct(retrievalTop1, reachedRetrieval)})`);
  console.log('  top-5 correct:', retrievalTop5, `(${pct(retrievalTop5, reachedRetrieval)})`);

  console.log('\nWrong (precision failures - auto-accept danger):');
  if (wrongSamples.length === 0) {
    console.log('  none');
  } else {
    for (const s of wrongSamples) console.log(`  ${s.input} -> ${s.got} (expected ${s.expected})`);
  }

  console.log('\nUnresolved (retrieval-layer targets):');
  if (unresolvedSamples.length === 0) {
    console.log('  none');
  } else {
    for (const s of unresolvedSamples) console.log(`  ${s.input} -> (expected ${s.expected})`);
  }
  console.log('');
}

module.exports = {
  pct,
  printTable,
  run
};

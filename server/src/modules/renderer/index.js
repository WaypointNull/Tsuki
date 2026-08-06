const { round, formatDecimal } = require('../../shared/numbers');
const { BRACE_BOOST } = require('../../config/constants');

function renderEntry({ name, strength }) {
  const value = round(strength, 2);
  if (value === 1) {
    return name;
  }
  if (value > 1) {
    return `(${name}:${formatDecimal(value)})`;
  }
  return `[${name}:${formatDecimal(value)}]`;
}

function renderRun(names, strength) {
  const value = round(strength, 2);
  if (value === 1) {
    return names.join(', ');
  }
  if (value === 1 + BRACE_BOOST) {
    return `{${names.join(', ')}}`;
  }
  const wrapper = value > 1 ? ['(', ')'] : ['[', ']'];
  return `${wrapper[0]}${names.join(', ')}:${formatDecimal(value)}${wrapper[1]}`;
}

function render(entries) {
  const runs = [];
  for (const entry of entries) {
    const last = runs[runs.length - 1];
    if (last && last.strength === entry.strength) {
      last.names.push(entry.name);
    } else {
      runs.push({ strength: entry.strength, names: [entry.name] });
    }
  }
  return runs
    .map((run) =>
      run.names.length === 1
        ? renderEntry({ name: run.names[0], strength: run.strength })
        : renderRun(run.names, run.strength)
    )
    .join(', ');
}

module.exports = { render, renderEntry };

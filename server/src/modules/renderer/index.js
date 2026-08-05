const { round, formatDecimal } = require('../../shared/numbers');

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

function render(entries) {
  return entries.map(renderEntry).join(', ');
}

module.exports = { render, renderEntry };

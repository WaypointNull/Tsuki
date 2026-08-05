function round(value, precision) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatDecimal(value) {
  return String(round(value, 2));
}

module.exports = { round, formatDecimal };

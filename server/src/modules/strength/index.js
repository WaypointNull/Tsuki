const { WEIGHT_STEP } = require('../../config/constants');
const { round } = require('../../shared/numbers');

function step(entry, direction) {
  return { name: entry.name, strength: round(entry.strength + direction * WEIGHT_STEP, 2) };
}

function stepUp(entry) {
  return step(entry, 1);
}

function stepDown(entry) {
  return step(entry, -1);
}

module.exports = { step, stepUp, stepDown };

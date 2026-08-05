const { PAREN_MULTIPLIER, BRACKET_MULTIPLIER, BRACE_BOOST } = require('../../config/constants');
const { round } = require('../../shared/numbers');

const OPENERS = { '(': ')', '[': ']', '{': '}' };
const MULTIPLIER = { '(': PAREN_MULTIPLIER, '[': BRACKET_MULTIPLIER };
const ADDITIVE = { '{': BRACE_BOOST };
const WEIGHT_PATTERN = /^(.*?):(\d*\.?\d+)$/;

function parseEntry(raw) {
  const leading = raw.match(/^(?:\(|\[|\{)+/);
  const trailing = raw.match(/(?:\)|\]|\})*$/);
  const opens = leading ? leading[0] : '';
  const closes = trailing ? trailing[0] : '';
  const count = opens.length;

  let core;
  if (count > 0 && count === closes.length) {
    let balanced = true;
    for (let i = 0; i < count; i++) {
      if (OPENERS[opens[i]] !== closes[count - 1 - i]) {
        balanced = false;
        break;
      }
    }
    if (balanced) {
      core = raw.slice(count, raw.length - closes.length).trim();
    }
  }

  if (core === undefined) {
    return { name: raw, strength: 1 };
  }

  const weightMatch = core.match(WEIGHT_PATTERN);
  let explicitWeight;
  if (weightMatch && weightMatch[1].trim()) {
    explicitWeight = Number(weightMatch[2]);
    core = weightMatch[1].trim();
  }

  if (!core) {
    return { name: raw, strength: 1 };
  }

  const innermost = opens[count - 1];
  let strength;
  if (explicitWeight !== undefined) {
    strength = explicitWeight;
  } else if (ADDITIVE[innermost] !== undefined) {
    strength = 1 + ADDITIVE[innermost];
  } else {
    strength = MULTIPLIER[innermost];
  }
  for (let i = count - 2; i >= 0; i--) {
    const ch = opens[i];
    if (MULTIPLIER[ch] !== undefined) {
      strength *= MULTIPLIER[ch];
    } else {
      strength += ADDITIVE[ch];
    }
  }

  return { name: core, strength: round(strength, 2) };
}

function split(text) {
  if (typeof text !== 'string') {
    return [];
  }
  return text
    .split(/[,\r\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseEntry);
}

module.exports = { split, parseEntry };

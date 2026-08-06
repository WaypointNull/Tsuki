const { PAREN_MULTIPLIER, BRACKET_MULTIPLIER, BRACE_BOOST } = require('../../config/constants');
const { round } = require('../../shared/numbers');

const OPENERS = { '(': ')', '[': ']', '{': '}' };
const MULTIPLIER = { '(': PAREN_MULTIPLIER, '[': BRACKET_MULTIPLIER };
const ADDITIVE = { '{': BRACE_BOOST };
const WEIGHT_PATTERN = /^(.*?):(\d*\.?\d+)$/;

function computeStrength(opens, explicitWeight) {
  const innermost = opens[opens.length - 1];
  let strength;
  if (explicitWeight !== undefined) {
    strength = explicitWeight;
  } else if (ADDITIVE[innermost] !== undefined) {
    strength = 1 + ADDITIVE[innermost];
  } else {
    strength = MULTIPLIER[innermost];
  }
  for (let i = opens.length - 2; i >= 0; i--) {
    const ch = opens[i];
    if (MULTIPLIER[ch] !== undefined) {
      strength *= MULTIPLIER[ch];
    } else {
      strength += ADDITIVE[ch];
    }
  }
  return round(strength, 2);
}

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

  return { name: core, strength: computeStrength(opens, explicitWeight) };
}

function splitTopLevel(text) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') {
      depth += 1;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth = Math.max(0, depth - 1);
    }
    if ((ch === ',' || ch === '\n' || ch === '\r') && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

function tryParseGroup(raw) {
  const leading = raw.match(/^(?:\(|\[|\{)+/);
  const trailing = raw.match(/(?:\)|\]|\})*$/);
  const opens = leading ? leading[0] : '';
  const closes = trailing ? trailing[0] : '';
  const count = opens.length;
  if (count === 0 || count !== closes.length) {
    return null;
  }
  for (let i = 0; i < count; i++) {
    if (OPENERS[opens[i]] !== closes[count - 1 - i]) {
      return null;
    }
  }
  const core = raw.slice(count, raw.length - closes.length).trim();
  if (!core) {
    return null;
  }

  const members = splitTopLevel(core)
    .map((member) => member.trim())
    .filter(Boolean);
  if (members.length < 2) {
    return null;
  }

  const last = members[members.length - 1];
  const lastWeight = last.match(WEIGHT_PATTERN);
  const othersPlain = members.slice(0, -1).every((member) => !member.match(WEIGHT_PATTERN));
  let explicitWeight;
  let baseMembers = members;
  if (lastWeight && lastWeight[1].trim() && othersPlain) {
    explicitWeight = Number(lastWeight[2]);
    baseMembers = [...members.slice(0, -1), lastWeight[1].trim()];
  }
  const strength = computeStrength(opens, explicitWeight);

  return baseMembers.map((member) => {
    const own = member.match(WEIGHT_PATTERN);
    if (own && own[1].trim()) {
      return { name: own[1].trim(), strength: round(Number(own[2]), 2) };
    }
    return { name: member, strength };
  });
}

function split(text) {
  if (typeof text !== 'string') {
    return [];
  }
  return splitTopLevel(text)
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => tryParseGroup(part) || [parseEntry(part)]);
}

module.exports = { split, parseEntry };

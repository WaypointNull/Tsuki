const { JUNK_TOKENS } = require('./constants');

function dedupeKeepOrder(list) {
  const seen = new Set();
  const out = [];
  for (const item of list || []) {
    if (!seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function normalizeTag(tag) {
  return (tag || '')
    .trim()
    .toLowerCase()
    .replace(/^\d+[\s.:-]+/, '')
    .replace(/^[-*\s.:]+/, '')
    .replace(/\s+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function isUsableTag(tag) {
  if (!tag) {
    return false;
  }
  if (!/^[a-z0-9_()'-]+$/.test(tag)) {
    return false;
  }
  // WORKAROUND: real tags like "2girls" are shorter than 3 chars after normalization; keep the numeric-girl exception.
  if (tag.length < 3 && !/^\d+(girl|girls|boy|boys)$/.test(tag)) {
    return false;
  }
  // WORKAROUND: injected boilerplate tokens ("global_positive", "yes", "no", "ai", "n/a") are not real tags.
  if (JUNK_TOKENS.has(tag)) {
    return false;
  }
  return true;
}

function parseCsvRecords(text) {
  const records = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    const cols = parseCsvLine(line);
    if (cols.length < 3 || !cols[0] || !cols[1]) {
      continue;
    }
    records.push({
      tag: cols[0].trim(),
      category: cols[1].trim(),
      posts: cols[2].trim(),
      aliases: cols[3]
        ? cols[3]
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : []
    });
  }
  return records;
}

function parseCsvLine(line) {
  // WORKAROUND: the merged danbooru/e621 list has alias lists with commas inside quotes; a naive split(',') mangles them.
  const cols = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ',') {
      cols.push(field);
      field = '';
      continue;
    }
    field += char;
  }
  cols.push(field);
  return cols;
}

module.exports = {
  normalizeTag,
  isUsableTag,
  parseCsvRecords,
  parseCsvLine,
  dedupeKeepOrder
};

// Usage: node scripts/audit-dictionaries.js [path-to-db-csv]
// Verifies every EXACT_TOKEN / EXACT_TAG in the classifier dictionaries against
// the real danbooru-e621 merged tag list. For each token it lists every database
// name containing that token so false positives can be spotted by review.
// Exit code 0 if every exact tag exists in the DB; 1 otherwise.
const fs = require('fs');
const path = require('path');
const constants = require('../server/src/config/constants');
const { NSFW_EXCLUSIONS, CLOTHES_EXCLUSIONS, POSE_EXCLUSIONS } = require('../server/src/config/exclusions');

const DB_DEFAULT = path.join(__dirname, '..', 'data', 'danbooru-e621.csv');
const DB = process.argv[2] || DB_DEFAULT;

function normalizeName(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function tokenize(text) {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

function readNames(file) {
  if (!fs.existsSync(file)) {
    console.error(`Database not found: ${file}`);
    console.error(`Download from https://github.com/DraconicDragon/dbr-e621-lists-archive`);
    console.error('then run: node scripts/audit-dictionaries.js <path>');
    process.exit(1);
  }
  const names = new Set();
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const [tag, , , aliases] = parseCsvLine(line);
    if (tag) names.add(normalizeName(tag));
    if (aliases) {
      for (const a of aliases.split(',')) {
        const n = normalizeName(a);
        if (n) names.add(n);
      }
    }
  }
  return names;
}

function byToken(names) {
  const map = new Map();
  for (const name of names) {
    for (const token of new Set(tokenize(name))) {
      if (!map.has(token)) map.set(token, []);
      map.get(token).push(name);
    }
  }
  return map;
}

const CATEGORIES = [
  {
    id: 'nsfw',
    exactTokens: constants.NSFW_EXACT_TOKENS,
    exactTags: constants.NSFW_EXACT_TAGS,
    exclusions: NSFW_EXCLUSIONS
  },
  {
    id: 'clothes',
    exactTokens: constants.CLOTHES_EXACT_TOKENS,
    exactTags: constants.CLOTHES_EXACT_TAGS,
    exclusions: CLOTHES_EXCLUSIONS
  },
  { id: 'composition', exactTokens: new Set(), exactTags: constants.COMPOSITION_EXACT_TAGS, exclusions: new Set() },
  {
    id: 'pose',
    exactTokens: constants.POSE_EXACT_TOKENS,
    exactTags: constants.POSE_EXACT_TAGS,
    exclusions: POSE_EXCLUSIONS
  }
];

function main() {
  const names = readNames(DB);
  const index = byToken(names);
  let missingTags = 0;
  let exclusionErrors = 0;

  for (const cat of CATEGORIES) {
    const lines = [];
    for (const token of [...cat.exactTokens].sort()) {
      const hits = (index.get(token) || []).sort();
      lines.push(`TOKEN ${token} (${hits.length})`);
      for (const h of hits) lines.push(`  ${h}`);
      lines.push('');
    }
    const tagLines = [];
    for (const tag of [...cat.exactTags].sort()) {
      if (names.has(tag)) {
        tagLines.push(`TAG   ${tag}  ok`);
      } else {
        tagLines.push(`TAG   ${tag}  MISSING`);
        missingTags += 1;
      }
    }
    const exclLines = [];
    for (const tag of [...cat.exclusions].sort()) {
      if (cat.exactTags.has(tag)) {
        exclLines.push(`EXCL  ${tag}  OVERLAPS EXACT TAG`);
        exclusionErrors += 1;
      } else if (names.has(tag)) {
        exclLines.push(`EXCL  ${tag}  ok`);
      } else {
        exclLines.push(`EXCL  ${tag}  NOT IN DB`);
        exclusionErrors += 1;
      }
    }
    const outDir = path.join(__dirname, '..', '.audit');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${cat.id}.txt`), [...lines, ...tagLines, ...exclLines, ''].join('\n'), 'utf8');
    console.log(`${cat.id}: wrote ${path.join(outDir, `${cat.id}.txt`)} (${cat.exclusions.size} exclusions)`);
  }

  console.log(`Total missing exact tags: ${missingTags}`);
  console.log(`Total exclusion errors: ${exclusionErrors}`);
  process.exit(missingTags > 0 || exclusionErrors > 0 ? 1 : 0);
}

main();

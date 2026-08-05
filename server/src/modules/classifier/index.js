const { step } = require('../strength');
const {
  NSFW_PREFIX_STEMS,
  NSFW_EXACT_TOKENS,
  CLOTHES_PREFIX_STEMS,
  CLOTHES_EXACT_TOKENS,
  COMPOSITION_PREFIX_STEMS,
  COMPOSITION_NAME_STEMS,
  COMPOSITION_EXACT_TAGS,
  POSE_PREFIX_STEMS,
  POSE_EXACT_TAGS
} = require('../../config/constants');

const CATEGORIES = [
  {
    id: 'nsfw',
    label: 'NSFW',
    prefixStems: NSFW_PREFIX_STEMS,
    exactTokens: NSFW_EXACT_TOKENS,
    nameStems: new Set(),
    exactTags: new Set()
  },
  {
    id: 'clothes',
    label: 'Clothes',
    prefixStems: CLOTHES_PREFIX_STEMS,
    exactTokens: CLOTHES_EXACT_TOKENS,
    nameStems: new Set(),
    exactTags: new Set()
  },
  {
    id: 'composition',
    label: 'Composition',
    prefixStems: COMPOSITION_PREFIX_STEMS,
    exactTokens: new Set(),
    nameStems: COMPOSITION_NAME_STEMS,
    exactTags: COMPOSITION_EXACT_TAGS
  },
  {
    id: 'pose',
    label: 'Pose / Expression',
    prefixStems: POSE_PREFIX_STEMS,
    exactTokens: new Set(),
    nameStems: new Set(),
    exactTags: POSE_EXACT_TAGS
  }
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

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

function matches(name, category) {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  if (category.exactTags.has(normalized)) return true;
  for (const stem of category.nameStems) {
    if (normalized.startsWith(stem)) return true;
  }
  const tokens = tokenize(normalized);
  for (const token of tokens) {
    if (category.exactTokens.has(token)) return true;
    for (const stem of category.prefixStems) {
      if (token.startsWith(stem)) return true;
    }
  }
  return false;
}

function isCategory(name, categoryId) {
  const category = BY_ID.get(categoryId);
  return Boolean(category && matches(name, category));
}

function categories() {
  return CATEGORIES.map((c) => ({ id: c.id, label: c.label }));
}

function classify(name) {
  return CATEGORIES.filter((c) => matches(name, c)).map((c) => c.id);
}

function adjust(entries, categoryId, direction) {
  return entries.map((entry) => (isCategory(entry.name, categoryId) ? step(entry, direction) : entry));
}

module.exports = { categories, classify, isCategory, adjust };

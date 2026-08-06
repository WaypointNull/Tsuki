const path = require('path');

const TAG_CATEGORY_COPYRIGHT = 3;

// WORKAROUND: danbooru-e621 merged list has unreliable categories (e.g. "cum_on_floor" -> 0,
// "female" -> 7), so a category-based NSFW guard is not viable. Instead these content stems are
// matched against normalized tag tokens to prune explicit suggestions from retrieval results.
const NSFW_CONTENT_PREFIX_STEMS = new Set([
  'cum',
  'sperm',
  'semen',
  'ejaculat',
  'penis',
  'cock',
  'dick',
  'testicle',
  'scrotum',
  'vulva',
  'vagina',
  'pussy',
  'cunt',
  'clit',
  'dildo',
  'vibrator',
  'futa',
  'masturbat',
  'orgasm',
  'poop',
  'scat',
  'bukkake',
  'creampie',
  'gangbang',
  'blowjob',
  'handjob',
  'rimjob',
  'deepthroat',
  'porn',
  'nsfw',
  'guro',
  'squirting',
  'fuck',
  'pee',
  'fellatio',
  'nude',
  'naked',
  'panties',
  'panty',
  'underwear',
  'lingerie',
  'feces',
  'condom'
]);

const NSFW_CONTENT_EXACT_TOKENS = new Set(['balls', 'sex', 'blood', 'ass', 'butt', 'anal']);

const TAG_LIST_URL =
  'https://raw.githubusercontent.com/DraconicDragon/dbr-e621-lists-archive/refs/heads/main/tag-lists/danbooru_e621_merged/danbooru_e621_merged_2026-04-01_pt20-ia-dd-ed-spc.csv';
const TAG_FILE_PATH = path.join(__dirname, '..', '..', '..', '..', 'data', 'danbooru-tags.txt');

const JUNK_TOKENS = new Set([
  'global_positive',
  'global_negative',
  'positive',
  'negative',
  'quality_and_style',
  'character_and_franchise',
  'appearance_and_outfit',
  'pose_and_camera',
  'environment_and_lighting',
  'yes',
  'no',
  'ai',
  'n/a'
]);

const RETRIEVAL = {
  poolFloor: 0.25,
  poolLimit: 60,
  resultLimit: 20,
  gateFloor: 0.55,
  gateGapRatio: 1.25,
  stripBonus: 0.15,
  // tokenPreserve rewards candidates that keep the input's exact tokens (e.g. "cat_on_surface" must
  // not be out-scored by "cum_on_surface", which only wins on raw trigram overlap).
  weights: { trigram: 0.3, damerau: 0.5, bm25: 0.1, tokenPreserve: 0.1 },
  bm25: { k1: 1.5, b: 0.75 }
};

// Suggestion-ranking priority tier (pysssss-style): tags that CONTAIN the query as a token float
// above fuzzy-only noise, weighted by corpus popularity. Purely additive to getCandidates; the
// auto-replace path (resolve/benchmark) is untouched. set enabled=false to restore the old order.
const PRIORITY_TIER = {
  enabled: true,
  maxPerToken: 64,
  maxContainment: 24,
  base: 0.72,
  popWeight: 0.25,
  maxPostCount: 5000000
};

module.exports = {
  TAG_CATEGORY_COPYRIGHT,
  NSFW_CONTENT_PREFIX_STEMS,
  NSFW_CONTENT_EXACT_TOKENS,
  TAG_LIST_URL,
  TAG_FILE_PATH,
  JUNK_TOKENS,
  RETRIEVAL,
  PRIORITY_TIER
};

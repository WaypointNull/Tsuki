let sdk = null;
let loadError = null;

function isEnabled() {
  return Boolean(process.env.USAGI_HUB_URL);
}

function getSdk() {
  if (sdk || loadError || !isEnabled()) {
    return sdk;
  }
  try {
    sdk = require(process.env.USAGI_SDK_PATH);
  } catch (error) {
    loadError = error;
  }
  return sdk;
}

async function getTagLists() {
  const client = getSdk();
  if (!client) {
    return [];
  }
  const res = await client.history({ plugin: 'akumu', schema: 'tag-list@1' });
  return (res && res.records) || [];
}

async function saveWeightedTags({ entries, finalText, folder, source }) {
  const client = getSdk();
  if (!client) {
    return null;
  }
  const tags = Array.isArray(entries) ? entries.map((entry) => entry && entry.name).filter(Boolean) : [];
  return client.record(
    'weighted-tag-list@1',
    {
      input: { tags, source: source || null },
      output: { entries: entries || [], finalText: finalText || '' }
    },
    { folder, source }
  );
}

module.exports = { isEnabled, getTagLists, saveWeightedTags };

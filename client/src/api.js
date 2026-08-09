async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok || data.error) {
    throw new Error(data.error || `Request failed (${response.status}).`);
  }
  return data;
}

export async function getHealth() {
  const data = await request('/api/health');
  return data;
}

export async function getCategories() {
  const data = await request('/api/categories');
  return data.categories;
}

export async function splitText(text) {
  const data = await request('/api/split', { method: 'POST', body: { text } });
  return data.entries;
}

export async function renderEntries(entries) {
  const data = await request('/api/render', { method: 'POST', body: { entries } });
  return data.text;
}

export async function adjustEntries(entries, category, direction) {
  const data = await request('/api/adjust', {
    method: 'POST',
    body: { entries, category, direction }
  });
  return data.entries;
}

export async function matchTag(tag, limit = 12) {
  const data = await request('/api/tags/match', { method: 'POST', body: { tag, limit } });
  return data;
}

export async function getHistory() {
  const data = await request('/api/history');
  return data.records;
}

export async function saveHistory(payload) {
  return request('/api/history/save', { method: 'POST', body: payload });
}

export async function pasteText() {
  const text = await navigator.clipboard.readText();
  return text;
}

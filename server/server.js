const express = require('express');
const path = require('path');
const { PORT } = require('./src/config/constants');
const { split } = require('./src/modules/splitter');
const { render } = require('./src/modules/renderer');
const { categories, adjust } = require('./src/modules/classifier');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));
  app.use((req, _res, next) => {
    req.body = req.body || {};
    next();
  });
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, modules: ['splitter', 'strength', 'renderer'] });
  });
  app.post('/api/split', (req, res) => {
    res.json({ ok: true, entries: split(req.body.text || '') });
  });
  app.post('/api/render', (req, res) => {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    res.json({ ok: true, text: render(entries) });
  });
  app.get('/api/categories', (_req, res) => {
    res.json({ ok: true, categories: categories() });
  });
  app.post('/api/adjust', (req, res) => {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const categoryId = String(req.body.category || '');
    const direction = Number(req.body.direction) || 0;
    res.json({ ok: true, entries: adjust(entries, categoryId, direction) });
  });
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

  app.use((error, _req, res, _next) => {
    const isParseError = error.type === 'entity.parse.failed';
    const isTooLarge = error.type === 'entity.too.large';
    const status = isParseError ? 400 : isTooLarge ? 413 : error.statusCode || error.status || 500;
    const message = isParseError
      ? 'Invalid JSON body.'
      : isTooLarge
        ? 'Request body too large.'
        : error.message || 'Unexpected server error.';
    if (status >= 500) {
      console.error(error);
    }
    res.status(status).json({ error: message });
  });

  return app;
}

function start(options = {}) {
  const app = createApp();
  const { host } = options;

  return new Promise((resolve, reject) => {
    const server = host ? app.listen(PORT, host, () => resolve(server)) : app.listen(PORT, () => resolve(server));
    server.on('error', reject);
    console.log(`Tsuki running at http://127.0.0.1:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { start, createApp };

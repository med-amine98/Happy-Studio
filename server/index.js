import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const app = express();
const port = Number(process.env.PORT || 3000);
const magicHourBase = 'https://api.magichour.ai/v1';
const allowedDurations = new Set([5, 8, 10]);
const allowedRatios = new Set(['16:9', '9:16', '1:1']);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function apiKey() {
  return process.env.MAGIC_HOUR_API_KEY?.trim();
}

async function magicHourRequest(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const rawBody = await response.text();
    let payload = {};
    try { payload = rawBody ? JSON.parse(rawBody) : {}; }
    catch { payload = { message: rawBody.slice(0, 1000) }; }
    if (!response.ok) {
      const message = payload?.message || payload?.error?.message || payload?.error || `Magic Hour a répondu avec le statut ${response.status}.`;
      const error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
      error.status = response.status;
      error.providerCode = payload?.code || payload?.error?.code;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, provider: 'Magic Hour', configured: Boolean(apiKey()) });
});

app.post('/api/videos', async (req, res) => {
  if (!apiKey()) {
    return res.status(503).json({ error: 'Clé absente : ajoute MAGIC_HOUR_API_KEY dans .env, puis redémarre le serveur.' });
  }
  const { prompt, duration = 5, aspect_ratio = '16:9', generate_audio = true } = req.body ?? {};
  if (typeof prompt !== 'string' || prompt.trim().length < 3) return res.status(400).json({ error: 'Écris un prompt d’au moins 3 caractères.' });
  if (prompt.length > 2000) return res.status(400).json({ error: 'Le prompt ne doit pas dépasser 2 000 caractères.' });
  if (!allowedDurations.has(Number(duration))) return res.status(400).json({ error: 'Durée non prise en charge. Choisis 5, 8 ou 10 secondes.' });
  if (!allowedRatios.has(aspect_ratio)) return res.status(400).json({ error: 'Format non pris en charge. Choisis 16:9, 9:16 ou 1:1.' });

  try {
    const project = await magicHourRequest(`${magicHourBase}/text-to-video`, {
      method: 'POST',
      body: JSON.stringify({
        name: `Grok Studio — ${new Date().toLocaleString('fr-FR')}`,
        end_seconds: Number(duration),
        aspect_ratio,
        resolution: '480p',
        model: 'default',
        audio: Boolean(generate_audio),
        style: { prompt: prompt.trim() },
      }),
    });
    if (!project.id) return res.status(502).json({ error: 'Magic Hour n’a pas retourné d’identifiant de projet.' });
    return res.status(202).json({ request_id: project.id, status: project.status || 'queued' });
  } catch (error) {
    console.error('Magic Hour generation start failed:', error.message);
    const status = error.name === 'AbortError' ? 504 : (error.status === 401 ? 502 : 502);
    return res.status(status).json({ error: error.name === 'AbortError' ? 'Délai dépassé en contactant Magic Hour.' : error.message });
  }
});

app.get('/api/videos/:requestId', async (req, res) => {
  if (!apiKey()) return res.status(503).json({ error: 'Clé Magic Hour non configurée sur le serveur.' });
  const { requestId } = req.params;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(requestId)) return res.status(400).json({ error: 'Identifiant de génération invalide.' });
  try {
    const project = await magicHourRequest(`${magicHourBase}/video-projects/${encodeURIComponent(requestId)}`);
    if (project.status === 'error' || project.status === 'canceled') {
      return res.json({ status: 'failed', error: project.error?.message || `La génération est ${project.status}.` });
    }
    if (project.status === 'complete') {
      const url = project.downloads?.[0]?.url;
      if (!url) return res.json({ status: 'failed', error: 'Le rendu est terminé, mais Magic Hour n’a pas fourni de lien vidéo.' });
      return res.json({ status: 'done', video: { url }, credits_charged: project.credits_charged });
    }
    return res.json({ status: 'pending', provider_status: project.status });
  } catch (error) {
    console.error('Magic Hour generation status failed:', error.message);
    return res.status(error.status && error.status >= 400 && error.status < 500 ? error.status : 502)
      .json({ error: error.name === 'AbortError' ? 'Délai dépassé en contactant Magic Hour.' : error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({ root, configFile: path.join(root, 'vite.config.js'), server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => console.log(`Grok Studio (Magic Hour) disponible sur http://localhost:${port}`));

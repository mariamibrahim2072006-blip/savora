// Single-service production entry (Render etc.): API + built client on one origin.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp, boot } from './index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../../client/dist');
const app = createApp();
app.use(express.static(dist, { maxAge: '1h' }));
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = +(process.env.PORT || 8080);
boot()
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`SAVORA on :${port}`)))
  .catch((e) => { console.error('Boot failed', e); process.exit(1); });

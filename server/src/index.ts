import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { migrate, one } from './db.js';
import { seedIfEmpty } from './seed.js';
import { publicApi } from './routes.js';
import { adminApi } from './admin.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      await one('SELECT 1 AS ok');
      res.json({ ok: true, service: 'savora-api' });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Serve admin-uploaded dish images stored in Postgres
  app.get('/api/images/:productId', async (req, res) => {
    const img = await one<any>('SELECT data, content_type FROM product_images WHERE product_id=$1', [req.params.productId]);
    if (!img) return res.status(404).end();
    res.setHeader('Content-Type', img.content_type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(img.data);
  });

  app.use('/api', publicApi);
  app.use('/api/admin', adminApi);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong. Please try again.' });
  });
  return app;
}

export async function boot() {
  await migrate();
  const seeded = await seedIfEmpty();
  if (seeded) console.log('Database seeded with SAVORA catalog');
}

if (process.env.NETLIFY !== 'true' && process.env.AWS_LAMBDA_FUNCTION_NAME === undefined && process.env.SAVORA_PROD !== '1') {
  const port = +(process.env.PORT || 8080);
  boot().then(() => {
    createApp().listen(port, () => console.log(`SAVORA API on :${port}`));
  }).catch((e) => { console.error('Boot failed', e); process.exit(1); });
}

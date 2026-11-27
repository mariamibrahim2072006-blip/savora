import type { IncomingMessage, ServerResponse } from 'http';
import { createApp, boot } from '../server/src/index.js';

let booted: Promise<unknown> | null = null;
const app = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await (booted ??= boot());
  return app(req as any, res as any);
}

import { createApp, boot } from './index.js';
let booted: Promise<unknown> | null = null;
let app: any = null;
export default async function handler(req: any, res: any) {
  await (booted ??= boot());
  app ??= createApp();
  return app(req, res);
}

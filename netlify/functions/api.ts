import serverless from 'serverless-http';
import { createApp, boot } from '../../server/src/index.js';

let booted: Promise<unknown> | null = null;
const ensureBoot = () => (booted ??= boot());
const handler = serverless(createApp(), { basePath: '/.netlify/functions/api' });

export const handlerFn = async (event: any, context: any) => {
  await ensureBoot();
  return handler(event, context);
};
export { handlerFn as handler };

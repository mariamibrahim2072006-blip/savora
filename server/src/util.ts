import { randomBytes } from 'crypto';

export function orderNumber(): string {
  return 'SV-' + randomBytes(3).toString('hex').toUpperCase();
}

export function bad(res: any, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export function num(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}

export const ORDER_STEPS = ['received', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const;

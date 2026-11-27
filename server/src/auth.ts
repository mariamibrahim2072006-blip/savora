import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { one } from './db.js';

const SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-me';
export type Authed = Request & { user?: { id: string; role: string; email: string; name: string } };

export function signToken(u: { id: string; role: string; email: string; name: string }) {
  return jwt.sign({ sub: u.id, role: u.role, email: u.email, name: u.name }, SECRET(), { expiresIn: '30d' });
}

export async function requireAuth(req: Authed, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, SECRET()) as any;
    const user = await one<any>('SELECT id, role, email, name FROM users WHERE id=$1', [payload.sub]);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export async function optionalAuth(req: Authed, _res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET()) as any;
      const user = await one<any>('SELECT id, role, email, name FROM users WHERE id=$1', [payload.sub]);
      if (user) req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    } catch { /* ignore */ }
  }
  next();
}

export function requireAdmin(req: Authed, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

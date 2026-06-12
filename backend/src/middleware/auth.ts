import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken } from '../lib/auth.js';
import type { UserRole } from '../types/models.js';

function bearer(req: Request): string | null {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Populates req.user from a Bearer token. 401 if missing/invalid. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = bearer(req);
  if (!token) { res.status(401).json({ error: 'Missing authorization token' }); return; }
  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub), role: payload.role, name: payload.name };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Optional auth: attaches req.user if a valid token is present, never blocks. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = bearer(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: Number(payload.sub), role: payload.role, name: payload.name };
    } catch { /* ignore */ }
  }
  next();
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

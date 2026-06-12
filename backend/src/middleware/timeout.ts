import type { RequestHandler } from 'express';

// 504 any request still pending after `ms` so a slow handler can't hold a worker; skips upgrades.
export const requestTimeout = (ms = 30_000): RequestHandler => (req, res, next) => {
  if (req.headers.upgrade) return next();
  const timer = setTimeout(() => {
    if (res.headersSent || res.writableEnded) return;
    console.error(`[timeout] ${req.method} ${req.originalUrl} exceeded ${ms}ms`);
    res.status(504).json({ error: 'Request timed out' });
  }, ms);
  const clear = () => clearTimeout(timer);
  res.on('finish', clear);
  res.on('close', clear);
  next();
};

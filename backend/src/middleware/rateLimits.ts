import rateLimit, { type Options } from 'express-rate-limit';
import type { Request } from 'express';

const userOrIp = (req: Request): string => {
  const uid = (req as Request & { user?: { id: number } }).user?.id;
  if (uid) return `u:${uid}`;
  return `ip:${req.ip ?? 'unknown'}`;
};

const tripCounts = new Map<string, { count: number; window: number }>();
const onLimitReached = (label: string) => (req: Request) => {
  const key = `${label}:${userOrIp(req)}`;
  const now = Date.now();
  const win = 5 * 60_000;
  const cur = tripCounts.get(key);
  if (cur && now - cur.window < win) {
    cur.count++;
    if (cur.count >= 3) {
      console.warn(`[ratelimit] ${label} tripped ${cur.count}x in 5min by ${userOrIp(req)} (${req.method} ${req.originalUrl})`);
    }
  } else {
    tripCounts.set(key, { count: 1, window: now });
  }
};

const limiter = (label: string, opts: Partial<Options> & { windowMs: number; max: number; perUser?: boolean }) =>
  rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: opts.perUser ? userOrIp : undefined,
    handler: (req, res) => {
      onLimitReached(label)(req);
      res.status(429).json({ error: 'Too many requests. Slow down.' });
    },
  });

// Auth endpoints: hostile target for brute force. Very tight.
export const authLimit = limiter('auth', { windowMs: 60_000, max: 5 });

// Search: read-heavy but cheap. Generous per-IP.
export const searchLimit = limiter('search', { windowMs: 60_000, max: 60 });

// Posting messages: protects chat from spam. Per-user.
export const messageLimit = limiter('message', { windowMs: 60_000, max: 30, perUser: true });

// Creating listings: per-user, very tight (legitimate users post a few per week).
export const writeLimit = limiter('write', { windowMs: 60_000, max: 10, perUser: true });

// Default for everything else: per-user when logged in, otherwise per-IP.
export const generalLimit = limiter('general', { windowMs: 60_000, max: 120, perUser: true });

// Same-content chat cooldown per user per order. In-process map; fine for a single instance.
const lastMessage = new Map<string, { content: string; at: number }>();
const DUPE_WINDOW_MS = 10_000;

export function isDuplicateMessage(userId: number, orderId: number, content: string | null | undefined): boolean {
  if (!content) return false;
  const key = `${userId}:${orderId}`;
  const now = Date.now();
  const prev = lastMessage.get(key);
  lastMessage.set(key, { content, at: now });
  if (lastMessage.size > 5000) {
    // crude prune
    for (const [k, v] of lastMessage) {
      if (now - v.at > DUPE_WINDOW_MS * 6) lastMessage.delete(k);
    }
  }
  return Boolean(prev && prev.content === content && now - prev.at < DUPE_WINDOW_MS);
}

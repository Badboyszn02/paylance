// http(s)-only URL validation. z.string().url() allows javascript:/data: which become XSS in <a href>.
import { z } from 'zod';

export const isSafeUrl = (s: string): boolean => {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export const safeUrl = (opts: { max?: number } = {}) =>
  z.string()
    .max(opts.max ?? 500, `URL must be ${opts.max ?? 500} chars or fewer`)
    .refine(isSafeUrl, 'Only http and https URLs are allowed');

// Blocks links/domains/emails slipped into free-text fields (scheme://, www., domain.tld, email).
const URL_PATTERNS: RegExp[] = [
  /(?:^|[\s(<>\[])(?:[a-z][a-z0-9+\-.]*:\/\/)/i,
  /(?:^|[\s(<>\[])www\.[a-z0-9]/i,
  /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,24}(?:\/|\b)/i,
  /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,24}\b/i,
];

export const containsUrl = (s: string): boolean =>
  !!s && URL_PATTERNS.some((re) => re.test(s));

// Use on free-text fields, NOT on fields that are meant to hold a URL.
export const noUrls = (schema: z.ZodString = z.string()) =>
  schema.refine((s) => !containsUrl(s), {
    message: 'Links and web addresses are not allowed in this field',
  });

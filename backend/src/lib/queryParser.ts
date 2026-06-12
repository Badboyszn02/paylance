// Parse a plain-English brief into structured search filters. No external API.
import { CATEGORIES } from '../routes/listings.js';
import type { ParsedFilters } from '../types/models.js';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Design': ['logo', 'graphic', 'illustration', 'design', 'brand', 'ui', 'ux', 'figma'],
  'Writing & Content': ['article', 'copy', 'copywriting', 'blog', 'script', 'writing', 'content', 'ghostwrit'],
  'Digital Marketing': ['seo', 'marketing', 'ads', 'ad ', 'social media', 'campaign', 'growth', 'ppc'],
  'Video Editing': ['video', 'reel', 'youtube edit', 'animation', 'editing', 'motion', 'shorts'],
  'AI Services': ['ai', 'prompt', 'automation', 'workflow', 'gpt', 'llm', 'agent', 'chatbot'],
  'Influencer & Creator Hiring': ['influencer', 'creator', 'instagram', 'tiktok', 'youtuber', 'twitter', 'sponsor'],
};

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter'] as const;

const num = (m: RegExpMatchArray | [null, string] | null): number | undefined =>
  m ? Number(m[1].replace(/[,k]/gi, (c) => (c.toLowerCase() === 'k' ? '000' : ''))) : undefined;

export function parseQuery(text = ''): ParsedFilters & { niche?: string } {
  const q = text.toLowerCase();
  const filters: ParsedFilters & { niche?: string } = { search: text.trim() };

  // category
  for (const cat of CATEGORIES) {
    const kws = CATEGORY_KEYWORDS[cat] || [];
    if (kws.some((k) => q.includes(k))) { filters.category = cat; break; }
  }

  // budget / price: "under $500", "$100-300", "budget 200 usdc"
  const under = q.match(/(?:under|below|less than|max(?:imum)?|up to)\s*\$?\s*([\d,]+)/);
  if (under) filters.maxPrice = num(under);
  const over = q.match(/(?:over|above|at least|min(?:imum)?|from)\s*\$?\s*([\d,]+)/);
  if (over) filters.minPrice = num(over);
  const range = q.match(/\$?\s*([\d,]+)\s*(?:-|to)\s*\$?\s*([\d,]+)/);
  if (range) { filters.minPrice = num([null, range[1]]); filters.maxPrice = num([null, range[2]]); }

  // delivery: "within 3 days", "in 5 days", "fast"
  const days = q.match(/(?:within|in|under|max)\s*([\d]+)\s*days?/);
  if (days) filters.maxDelivery = num(days);
  else if (/\b(fast|urgent|asap|quick)\b/.test(q)) filters.maxDelivery = 3;

  // rating: "top rated", "5 star", "4+ stars"
  const stars = q.match(/([\d.]+)\s*\+?\s*stars?/);
  if (stars) filters.rating = num(stars);
  else if (/\b(top rated|best|highly rated|top)\b/.test(q)) filters.rating = 4;

  // platforms (influencer)
  const platforms = PLATFORMS.filter((p) => q.includes(p));
  if (platforms.length) filters.platforms = [...platforms];

  // follower range: "10k followers", "over 100k followers"
  const followers = q.match(/(?:over|above|at least)?\s*([\d,]+k?)\s*followers/);
  if (followers) filters.minFollowers = num([null, followers[1]]);

  return filters;
}

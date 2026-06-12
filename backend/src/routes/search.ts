import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { asyncHandler, validateBody } from '../middleware/validate.js';
import { parseQuery } from '../lib/queryParser.js';

export const searchRouter = Router();

// POST /api/search: plain-English freelancer matching. Returns top 5 by rating.
const searchSchema = z.object({ q: z.string().min(1).max(500) });

searchRouter.post('/', validateBody(searchSchema), asyncHandler(async (req, res) => {
  const { q } = req.body as z.infer<typeof searchSchema>;
  const filters = parseQuery(q);
  const where: string[] = [`l.status = 'active'`];
  const params: unknown[] = [];
  const add = (clause: string, val: unknown): void => {
    params.push(val);
    where.push(clause.replace('?', `$${params.length}`));
  };

  if (filters.category) add('l.category = ?', filters.category);
  if (filters.minPrice) add('l.price_usdc >= ?', filters.minPrice);
  if (filters.maxPrice) add('l.price_usdc <= ?', filters.maxPrice);
  if (filters.maxDelivery) add('l.delivery_days <= ?', filters.maxDelivery);
  if (filters.rating) add('coalesce(p.average_rating,0) >= ?', filters.rating);
  if (filters.search) add(`l.search_doc @@ plainto_tsquery('english', ?)`, filters.search);

  let { rows } = await query(
    `SELECT l.*, u.name AS freelancer_name, p.avatar_url, p.average_rating, p.review_count, p.location, p.skills
       FROM listings l
       JOIN users u ON u.id = l.freelancer_id
       LEFT JOIN profiles p ON p.user_id = l.freelancer_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.average_rating DESC NULLS LAST, l.created_at DESC
      LIMIT 5`,
    params
  );

  // Relax the text match when nothing matched; the search_doc param is always last.
  if (!rows.length && filters.search) {
    const relaxed = where.filter((w) => !w.includes('search_doc'));
    const relaxedParams = params.slice(0, -1); // drop the trailing search param
    const res2 = await query(
      `SELECT l.*, u.name AS freelancer_name, p.avatar_url, p.average_rating, p.review_count, p.location, p.skills
         FROM listings l JOIN users u ON u.id = l.freelancer_id
         LEFT JOIN profiles p ON p.user_id = l.freelancer_id
        WHERE ${relaxed.join(' AND ')}
        ORDER BY p.average_rating DESC NULLS LAST, l.created_at DESC LIMIT 5`,
      relaxedParams
    );
    rows = res2.rows;
  }

  res.json({ filters, results: rows });
}));


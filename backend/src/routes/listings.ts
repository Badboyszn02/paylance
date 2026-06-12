import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { asyncHandler, validateBody, HttpError } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { cached, invalidate } from '../lib/cache.js';
import { writeLimit } from '../middleware/rateLimits.js';
import { verifyListingTx } from '../lib/arc.js';
import { noUrls } from '../lib/safeUrl.js';

export const listingsRouter = Router();

export const CATEGORIES = [
  'Design', 'Writing & Content', 'Digital Marketing',
  'Video Editing', 'AI Services', 'Influencer & Creator Hiring',
] as const;

type Category = typeof CATEGORIES[number];

// GET /api/listings?category=&minPrice=&maxPrice=&rating=&maxDelivery=&search=&limit=
listingsRouter.get('/', asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, rating, maxDelivery, search, skills, kind } = req.query;
  const where: string[] = [`l.status = 'active'`];
  const params: unknown[] = [];
  const add = (clause: string, val: unknown): void => {
    params.push(val);
    where.push(clause.replace('?', `$${params.length}`));
  };

  if (kind === 'service' || kind === 'job') add('l.kind = ?', kind);
  if (category) add('l.category = ?', category);
  if (minPrice) add('l.price_usdc >= ?', Number(minPrice));
  if (maxPrice) add('l.price_usdc <= ?', Number(maxPrice));
  if (maxDelivery) add('l.delivery_days <= ?', Number(maxDelivery));
  if (rating) add('p.average_rating >= ?', Number(rating));
  if (skills) add('p.skills && ?', String(skills).split(',').map((s) => s.trim()));
  if (search) add(`l.search_doc @@ plainto_tsquery('english', ?)`, search);

  // Hide a listing once taken (accepted through completed); only a cancelled order frees it.
  where.push(`NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.listing_id = l.id
      AND o.status IN ('ACCEPTED','FUNDED','IN_PROGRESS','DELIVERED','REVIEWING','DISPUTED','COMPLETED')
  )`);

  const limit = Math.min(Number(req.query.limit) || 50, 100);

  // Cache key derived from the raw query string so identical filter combos share a row.
  const cacheKey = `listings:${new URLSearchParams(req.query as Record<string, string>).toString()}:l${limit}`;
  const rows = await cached(cacheKey, 30_000, async () => {
    const r = await query(
      `SELECT l.*, u.name AS freelancer_name, u.wallet_address AS freelancer_wallet,
              p.avatar_url, p.average_rating, p.review_count, p.location
         FROM listings l
         JOIN users u ON u.id = l.freelancer_id
         LEFT JOIN profiles p ON p.user_id = l.freelancer_id
        WHERE ${where.join(' AND ')}
        ORDER BY p.average_rating DESC NULLS LAST, l.created_at DESC
        LIMIT ${limit}`,
      params
    );
    return r.rows;
  });

  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  res.json({ listings: rows });
}));

// GET /api/listings/mine: the caller's active listings (deleted/archived hidden) + counts
listingsRouter.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT l.*,
            (SELECT count(*) FROM orders o WHERE o.listing_id = l.id) AS order_count,
            (SELECT count(*) FROM orders o WHERE o.listing_id = l.id
              AND o.status IN ('FUNDED','IN_PROGRESS','DELIVERED','REVIEWING','COMPLETED','DISPUTED')) AS locked_count
       FROM listings l
      WHERE l.freelancer_id = $1
        AND l.status <> 'archived'
      ORDER BY l.created_at DESC`,
    [req.user!.id]
  );
  res.setHeader('Cache-Control', 'no-store');
  res.json({ listings: rows });
}));

listingsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await query<{ freelancer_id: number }>(
    `SELECT l.*, u.name AS freelancer_name, u.wallet_address AS freelancer_wallet,
            p.avatar_url, p.average_rating, p.review_count,
            p.location, p.bio, p.skills, p.portfolio_links, p.completed_orders
       FROM listings l
       JOIN users u ON u.id = l.freelancer_id
       LEFT JOIN profiles p ON p.user_id = l.freelancer_id
      WHERE l.id = $1`, [Number(req.params.id)]
  );
  if (!rows[0]) throw new HttpError(404, 'Listing not found');
  if ((rows[0] as { status?: string }).status === 'archived') throw new HttpError(404, 'Listing not found');

  const reviews = await query(
    `SELECT r.rating, r.comment, r.created_at, u.name AS reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
      WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
    [rows[0].freelancer_id]
  );
  res.json({ listing: rows[0], reviews: reviews.rows });
}));

const listingSchema = z.object({
  title: noUrls(z.string().min(4).max(120)),
  description: noUrls(z.string().min(10).max(5000)),
  price_usdc: z.number().positive(),
  delivery_days: z.number().int().positive(),
  category: z.enum(CATEGORIES as unknown as [Category, ...Category[]]),
  subcategory: noUrls(z.string().max(60)).optional(),
  tags: z.array(noUrls(z.string().min(1).max(40))).max(20).optional(),
  kind: z.enum(['service', 'job']).default('service'),
  tx_hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  listing_hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
});

listingsRouter.post('/', writeLimit, requireAuth,
  validateBody(listingSchema), asyncHandler(async (req, res) => {
    const { title, description, price_usdc, delivery_days, category, subcategory, tags, kind, tx_hash, listing_hash } =
      req.body as z.infer<typeof listingSchema>;

    // Service listings require a freelancer/creator role; job posts are open to any user.
    if (kind === 'service' && !['freelancer', 'creator'].includes(req.user!.role)) {
      throw new HttpError(403, 'Switch to a freelancer or creator profile to offer a service');
    }

    // Reject duplicate hash before doing any on-chain work.
    const { rows: existing } = await query<{ id: number }>(
      `SELECT id FROM listings WHERE listing_hash = $1`, [listing_hash]
    );
    if (existing[0]) throw new HttpError(409, 'This listing has already been registered on-chain');

    // Verify the user actually paid gas to register this listing on Arc.
    const { rows: userRows } = await query<{ wallet_address: string }>(
      `SELECT wallet_address FROM users WHERE id = $1`, [req.user!.id]
    );
    if (!userRows[0]) throw new HttpError(404, 'User not found');

    try {
      await verifyListingTx({
        txHash: tx_hash,
        listingHash: listing_hash,
        posterAddress: userRows[0].wallet_address,
      });
    } catch (err) {
      throw new HttpError(400, `On-chain verification failed: ${(err as Error).message}`);
    }

    const { rows } = await query(
      `INSERT INTO listings (freelancer_id, title, description, price_usdc, delivery_days, category, subcategory, tags, kind, listing_hash, tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user!.id, title, description, price_usdc, delivery_days, category, subcategory || null, tags || [], kind, listing_hash, tx_hash]
    );
    invalidate('listings:');
    res.status(201).json({ listing: rows[0] });
  }));

// DELETE /api/listings/:id, owner only. Refuses if any order on this listing has reached escrow.
listingsRouter.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw new HttpError(400, 'Invalid listing id');

  const { rows } = await query<{ freelancer_id: number; status: string }>(
    `SELECT freelancer_id, status FROM listings WHERE id = $1`, [id]
  );
  if (!rows[0]) throw new HttpError(404, 'Listing not found');
  if (rows[0].freelancer_id !== req.user!.id) throw new HttpError(403, 'Not your listing');

  const locked = await query<{ cnt: string }>(
    `SELECT count(*)::text AS cnt FROM orders
      WHERE listing_id = $1
        AND status IN ('FUNDED','IN_PROGRESS','DELIVERED','REVIEWING','COMPLETED','DISPUTED')`,
    [id]
  );
  if (Number(locked.rows[0].cnt) > 0) {
    throw new HttpError(409, 'This listing has an active or completed hire. It cannot be deleted.');
  }

  await query(`UPDATE listings SET status = 'archived' WHERE id = $1`, [id]);
  invalidate('listings:');
  res.json({ ok: true });
}));

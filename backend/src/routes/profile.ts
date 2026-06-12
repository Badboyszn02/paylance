import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { asyncHandler, validateBody, HttpError } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken } from '../lib/auth.js';
import { safeUrl, noUrls } from '../lib/safeUrl.js';
import type { UserRole } from '../types/models.js';

export const profileRouter = Router();

// GET /api/profile/:id: public profile + listings + reviews.
// Whitelisted columns only so a future private column cannot leak.
profileRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw new HttpError(400, 'Invalid profile id');
  const { rows } = await query(
    `SELECT u.id, u.name, u.role, u.created_at,
            jsonb_build_object(
              'company', p.company,
              'bio', p.bio,
              'location', p.location,
              'avatar_url', p.avatar_url,
              'wallet_address', p.wallet_address,
              'category', p.category,
              'subcategories', p.subcategories,
              'skills', p.skills,
              'portfolio_links', p.portfolio_links,
              'niche', p.niche,
              'social_instagram', p.social_instagram,
              'social_tiktok', p.social_tiktok,
              'social_youtube', p.social_youtube,
              'social_twitter', p.social_twitter,
              'follower_count_instagram', p.follower_count_instagram,
              'follower_count_tiktok', p.follower_count_tiktok,
              'follower_count_youtube', p.follower_count_youtube,
              'follower_count_twitter', p.follower_count_twitter,
              'engagement_rate', p.engagement_rate,
              'rate_per_post_usdc', p.rate_per_post_usdc,
              'past_collaborations', p.past_collaborations,
              'social_verified', p.social_verified,
              'average_rating', p.average_rating,
              'review_count', p.review_count,
              'completed_orders', p.completed_orders
            ) AS profile
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`, [id]
  );
  if (!rows[0]) throw new HttpError(404, 'Profile not found');
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');

  const listings = await query(
    `SELECT id, title, description, price_usdc, delivery_days, category, subcategory, tags, status, created_at
       FROM listings WHERE freelancer_id = $1 AND status = 'active' ORDER BY created_at DESC`, [id]
  );
  const reviews = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
      WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC LIMIT 50`, [id]
  );
  res.json({ ...rows[0], listings: listings.rows, reviews: reviews.rows });
}));

const profileSchema = z.object({
  company: noUrls(z.string().max(120)).optional(),
  bio: noUrls(z.string().max(2000)).optional(),
  location: noUrls(z.string().max(120)).optional(),
  wallet_address: z.string().max(80).optional(),
  category: noUrls(z.string().max(60)).optional(),
  subcategories: z.array(noUrls(z.string().min(1).max(60))).max(20).optional(),
  skills: z.array(noUrls(z.string().min(1).max(40))).max(40).optional(),
  portfolio_links: z.array(safeUrl()).max(20).optional(),
  niche: noUrls(z.string().max(60)).optional(),
  social_instagram: z.string().max(200).optional(),
  social_tiktok: z.string().max(200).optional(),
  social_youtube: z.string().max(200).optional(),
  social_twitter: z.string().max(200).optional(),
  follower_count_instagram: z.number().int().min(0).optional(),
  follower_count_tiktok: z.number().int().min(0).optional(),
  follower_count_youtube: z.number().int().min(0).optional(),
  follower_count_twitter: z.number().int().min(0).optional(),
  engagement_rate: z.number().min(0).max(100).optional(),
  rate_per_post_usdc: z.number().min(0).optional(),
  past_collaborations: z.array(noUrls(z.string().min(1).max(200))).max(20).optional(),
}).strict();

const FIELDS = Object.keys(profileSchema.shape);

// PUT /api/profile: update own profile
profileRouter.put('/', requireAuth, validateBody(profileSchema), asyncHandler(async (req, res) => {
  const updates = Object.entries(req.body as Record<string, unknown>).filter(([k]) => FIELDS.includes(k));
  if (!updates.length) { res.json({ updated: false }); return; }

  const cols = updates.map(([k], i) => `${k} = $${i + 2}`);
  const values = updates.map(([, v]) => v);
  const { rows } = await query(
    `UPDATE profiles SET ${cols.join(', ')}, updated_at = now()
      WHERE user_id = $1 RETURNING *`,
    [req.user!.id, ...values]
  );
  res.json({ updated: true, profile: rows[0] });
}));

// POST /api/profile/role: switch the current user's role; returns a fresh JWT
const roleSchema = z.object({
  role: z.enum(['client', 'freelancer', 'creator']),
});

profileRouter.post('/role', requireAuth, validateBody(roleSchema), asyncHandler(async (req, res) => {
  const { role } = req.body as z.infer<typeof roleSchema>;
  const { rows } = await query<{ id: number; role: UserRole; name: string | null }>(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role, name`,
    [role, req.user!.id]
  );
  if (!rows[0]) throw new HttpError(404, 'User not found');
  const token = signToken(rows[0]);
  res.json({ role: rows[0].role, token });
}));

// POST /api/profile/verify-social: creator social verification flag
profileRouter.post('/verify-social', requireAuth, asyncHandler(async (req, res) => {
  // Stand-in for real OAuth verification: verified once any social link is present.
  const { rows } = await query<{ social_verified: boolean }>(
    `UPDATE profiles
        SET social_verified = (
          coalesce(social_instagram,'') <> '' OR coalesce(social_tiktok,'') <> '' OR
          coalesce(social_youtube,'') <> '' OR coalesce(social_twitter,'') <> ''
        ), updated_at = now()
      WHERE user_id = $1 RETURNING social_verified`,
    [req.user!.id]
  );
  res.json({ verified: rows[0]?.social_verified ?? false });
}));

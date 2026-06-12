import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { asyncHandler, validateBody, HttpError } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { noUrls } from '../lib/safeUrl.js';
import type { OrderStatus } from '../types/models.js';

export const reviewsRouter = Router();

interface OrderRow {
  id: number;
  client_id: number;
  freelancer_id: number;
  status: OrderStatus;
}

// POST /api/reviews: leave a review after order completion
const reviewSchema = z.object({
  order_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: noUrls(z.string().max(2000)).optional(),
});
reviewsRouter.post('/', requireAuth, validateBody(reviewSchema), asyncHandler(async (req, res) => {
  const { order_id, rating, comment } = req.body as z.infer<typeof reviewSchema>;
  const { rows } = await query<OrderRow>('SELECT * FROM orders WHERE id = $1', [order_id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'COMPLETED') throw new HttpError(400, 'You can only review a completed order');
  const isClient = order.client_id === req.user!.id;
  const isFreelancer = order.freelancer_id === req.user!.id;
  if (!isClient && !isFreelancer) throw new HttpError(403, 'Not your order');
  const revieweeId = isClient ? order.freelancer_id : order.client_id;

  const review = await withTransaction(async (c) => {
    const ins = await c.query(
      `INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (order_id, reviewer_id) DO UPDATE SET rating=EXCLUDED.rating, comment=EXCLUDED.comment
       RETURNING *`,
      [order_id, req.user!.id, revieweeId, rating, comment || null]
    );
    // recompute reviewee aggregates
    await c.query(
      `UPDATE profiles p SET
         average_rating = sub.avg, review_count = sub.cnt
       FROM (SELECT round(avg(rating)::numeric, 2) AS avg, count(*) AS cnt
               FROM reviews WHERE reviewee_id = $1) sub
       WHERE p.user_id = $1`, [revieweeId]
    );
    return ins.rows[0];
  });
  res.status(201).json({ review });
}));

// GET /api/reviews/:userId, reviews for a user
reviewsRouter.get('/:userId', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, u.name AS reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
      WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC`,
    [Number(req.params.userId)]
  );
  res.json({ reviews: rows });
}));

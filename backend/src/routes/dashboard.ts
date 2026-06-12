import { Router } from 'express';
import { query } from '../db/pool.js';
import { asyncHandler } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();

// GET /api/dashboard: role-aware aggregates for the dashboard page
dashboardRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user!.id;

  const active = await query(
    `SELECT o.*, c.name AS client_name, f.name AS freelancer_name
       FROM orders o JOIN users c ON c.id=o.client_id JOIN users f ON f.id=o.freelancer_id
      WHERE (o.client_id=$1 OR o.freelancer_id=$1)
        AND o.status NOT IN ('COMPLETED','CANCELLED')
      ORDER BY o.created_at DESC`, [uid]
  );

  const spent = await query<{ total: string }>(
    `SELECT coalesce(sum(amount_usdc + platform_fee_usdc),0) AS total
       FROM orders WHERE client_id=$1 AND status='COMPLETED'`, [uid]
  );
  const earned = await query<{ total: string }>(
    `SELECT coalesce(sum(amount_usdc - platform_fee_usdc),0) AS total
       FROM orders WHERE freelancer_id=$1 AND status='COMPLETED'`, [uid]
  );
  const pendingEscrow = await query<{ total: string; cnt: string }>(
    `SELECT coalesce(sum(amount_usdc),0) AS total, count(*) AS cnt
       FROM orders WHERE freelancer_id=$1 AND status IN ('FUNDED','IN_PROGRESS','DELIVERED','REVIEWING')`, [uid]
  );
  const reviews = await query(
    `SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON u.id=r.reviewer_id
      WHERE r.reviewee_id=$1 ORDER BY r.created_at DESC LIMIT 10`, [uid]
  );
  const counts = await query(
    `SELECT
       count(*) FILTER (WHERE status='COMPLETED') AS completed,
       count(*) AS total FROM orders WHERE client_id=$1 OR freelancer_id=$1`, [uid]
  );

  res.json({
    activeOrders: active.rows,
    totalSpentUsdc: Number(spent.rows[0].total),
    totalEarnedUsdc: Number(earned.rows[0].total),
    pendingEscrowUsdc: Number(pendingEscrow.rows[0].total),
    pendingEscrowCount: Number(pendingEscrow.rows[0].cnt),
    reviews: reviews.rows,
    orderCounts: counts.rows[0],
  });
}));

import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { asyncHandler, validateBody, HttpError } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { STATUS, computeFee, isParty, systemMessage, setStatus } from '../lib/orders.js';
import { safeUrl, noUrls } from '../lib/safeUrl.js';
import { invalidate } from '../lib/cache.js';
import { arc } from '../lib/arc.js';
import { emitToOrder } from '../realtime/hub.js';
import type { OrderStatus } from '../types/models.js';

export const ordersRouter = Router();

interface OrderRow {
  id: number;
  client_id: number;
  freelancer_id: number;
  status: OrderStatus;
  client_satisfied: boolean;
  freelancer_satisfied: boolean;
  client_cancelled: boolean;
  freelancer_cancelled: boolean;
  amount_usdc: string | number;
}

// Roles derive from listing kind: service → caller is client; job → caller is freelancer.
const createSchema = z.object({
  freelancer_id: z.number().int().positive().optional(),
  listing_id: z.number().int().positive().optional(),
  amount_usdc: z.number().positive(),
  is_campaign: z.boolean().optional(),
  message: noUrls(z.string().max(2000)).optional(),
});

ordersRouter.post('/', requireAuth, validateBody(createSchema), asyncHandler(async (req, res) => {
  const { freelancer_id, listing_id, amount_usdc, is_campaign, message } =
    req.body as z.infer<typeof createSchema>;
  const me = req.user!.id;

  let clientId: number;
  let freelancerId: number;

  if (listing_id) {
    const { rows: lrows } = await query<{ freelancer_id: number; kind: string; status: string }>(
      `SELECT freelancer_id, kind, status FROM listings WHERE id = $1`, [listing_id]
    );
    const listing = lrows[0];
    if (!listing) throw new HttpError(404, 'Listing not found');
    if (listing.status === 'archived') throw new HttpError(400, 'This listing is no longer available');
    const owner = listing.freelancer_id;
    if (owner === me) throw new HttpError(400, 'You cannot order your own listing');
    if (listing.kind === 'job') {
      clientId = owner;
      freelancerId = me;
    } else {
      clientId = me;
      freelancerId = owner;
    }
  } else {
    if (!freelancer_id) throw new HttpError(400, 'listing_id or freelancer_id is required');
    if (freelancer_id === me) throw new HttpError(400, 'You cannot hire yourself');
    clientId = me;
    freelancerId = freelancer_id;
  }

  const fee = computeFee(amount_usdc);
  const order = await withTransaction(async (c) => {
    const { rows } = await c.query<OrderRow>(
      `INSERT INTO orders (client_id, freelancer_id, listing_id, amount_usdc, platform_fee_usdc, status, is_campaign)
       VALUES ($1,$2,$3,$4,$5,'OFFER_SENT',$6) RETURNING *`,
      [clientId, freelancerId, listing_id || null, amount_usdc, fee, !!is_campaign]
    );
    return rows[0];
  });

  await systemMessage(order.id, `Order #${order.id} created. Offer sent for ${amount_usdc} USDC.`);
  if (message) {
    await query(
      `INSERT INTO messages (order_id, sender_id, content, message_type) VALUES ($1,$2,$3,'text')`,
      [order.id, me, message]
    );
  }
  res.status(201).json({ order });
}));

// caller's orders (as client or freelancer)
ordersRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT o.*,
            c.name AS client_name, f.name AS freelancer_name,
            l.title AS listing_title
       FROM orders o
       JOIN users c ON c.id = o.client_id
       JOIN users f ON f.id = o.freelancer_id
       LEFT JOIN listings l ON l.id = o.listing_id
      WHERE o.client_id = $1 OR o.freelancer_id = $1
      ORDER BY o.created_at DESC`,
    [req.user!.id]
  );
  res.json({ orders: rows });
}));

// full order detail (party only)
ordersRouter.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query<OrderRow>(
    `SELECT o.*, c.name AS client_name, f.name AS freelancer_name,
            cp.avatar_url AS client_avatar, fp.avatar_url AS freelancer_avatar,
            fp.wallet_address AS freelancer_wallet, l.title AS listing_title
       FROM orders o
       JOIN users c ON c.id = o.client_id
       JOIN users f ON f.id = o.freelancer_id
       LEFT JOIN profiles cp ON cp.user_id = o.client_id
       LEFT JOIN profiles fp ON fp.user_id = o.freelancer_id
       LEFT JOIN listings l ON l.id = o.listing_id
      WHERE o.id = $1`, [id]
  );
  const order = rows[0];
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.client_id !== req.user!.id && order.freelancer_id !== req.user!.id) {
    throw new HttpError(403, 'Not your order');
  }

  const dispute = await query('SELECT * FROM disputes WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);
  res.json({ order, dispute: dispute.rows[0] || null });
}));

// Hirer adjusts the price; resets the order to NEGOTIATING so the freelancer re-accepts.
const adjustPriceSchema = z.object({ amount_usdc: z.number().positive() });
ordersRouter.post('/:id/adjust-price', requireAuth, validateBody(adjustPriceSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) throw new HttpError(400, 'Invalid order id');
    const { amount_usdc } = req.body as z.infer<typeof adjustPriceSchema>;

    const { rows } = await query<OrderRow & { amount_usdc: number | string }>(
      'SELECT * FROM orders WHERE id = $1', [id]
    );
    const order = rows[0];
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.client_id !== req.user!.id) throw new HttpError(403, 'Only the hirer can adjust the price');
    if (!['OFFER_SENT', 'NEGOTIATING', 'ACCEPTED'].includes(order.status)) {
      throw new HttpError(400, 'Price can only be adjusted before the order is funded');
    }

    const newFee = computeFee(amount_usdc);
    const upd = await query<OrderRow>(
      `UPDATE orders
          SET amount_usdc = $1, platform_fee_usdc = $2, status = 'NEGOTIATING'
        WHERE id = $3 RETURNING *`,
      [amount_usdc, newFee, id]
    );
    await systemMessage(id, `Hirer adjusted the price to ${amount_usdc} USDC. Freelancer, please review and accept at the new amount.`);
    emitToOrder(id, 'status', { orderId: id, status: upd.rows[0].status });
    res.json({ order: upd.rows[0] });
  })
);

// freelancer accepts the offer
ordersRouter.post('/:id/accept', requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query<OrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.freelancer_id !== req.user!.id) throw new HttpError(403, 'Only the freelancer can accept');
  if (!['OFFER_SENT', 'NEGOTIATING'].includes(order.status)) {
    throw new HttpError(400, 'Offer is no longer pending');
  }
  await setStatus(id, STATUS.ACCEPTED, 'Offer accepted. Awaiting escrow funding by the client.');
  invalidate('listings:'); // listing is now engaged; hide it from Explore
  res.json({ ok: true });
}));

// freelancer submits delivery
const deliverSchema = z.object({ note: noUrls(z.string().max(2000)).optional(), file_url: safeUrl().optional() });
ordersRouter.post('/:id/deliver', requireAuth, validateBody(deliverSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query<OrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.freelancer_id !== req.user!.id) throw new HttpError(403, 'Only the freelancer can deliver');
  if (!['FUNDED', 'IN_PROGRESS'].includes(order.status)) {
    throw new HttpError(400, 'Order must be funded before delivery');
  }
  const body = req.body as z.infer<typeof deliverSchema>;
  const msg = await query(
    `INSERT INTO messages (order_id, sender_id, content, file_url, message_type)
     VALUES ($1,$2,$3,$4,'delivery') RETURNING *`,
    [id, req.user!.id, body.note || 'Work delivered.', body.file_url || null]
  );
  emitToOrder(id, 'message', msg.rows[0]);
  await setStatus(id, STATUS.DELIVERED, 'Work delivered. Client, please review.');
  res.json({ ok: true });
}));

const FUNDED_STATES: OrderStatus[] = ['FUNDED', 'IN_PROGRESS', 'DELIVERED', 'REVIEWING'];

// Mirror the order to live on-chain escrow state. Called after each wallet action.
interface EscrowOrderRow extends OrderRow {
  escrow_contract_address: string | null;
  client_satisfied: boolean;
  freelancer_satisfied: boolean;
  client_cancelled: boolean;
  freelancer_cancelled: boolean;
}

const syncSchema = z.object({ tx_hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional() });
ordersRouter.post('/:id/sync', requireAuth, validateBody(syncSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw new HttpError(400, 'Invalid order id');
  const { tx_hash } = req.body as z.infer<typeof syncSchema>;

  const { rows } = await query<EscrowOrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.client_id !== req.user!.id && order.freelancer_id !== req.user!.id) {
    throw new HttpError(403, 'Not your order');
  }
  if (!order.escrow_contract_address) {
    res.json({ order, synced: false });
    return;
  }

  const state = await arc.readEscrow(order.escrow_contract_address);
  if (!state) { // simulation mode; no real chain to read
    res.json({ order, synced: false });
    return;
  }

  const txExists = async (type: string): Promise<boolean> => {
    const r = await query<{ n: string }>(
      `SELECT count(*)::text AS n FROM transactions WHERE order_id=$1 AND type=$2`, [id, type]
    );
    return Number(r.rows[0].n) > 0;
  };

  const funded = state.status !== 'Created';

  if (funded && order.status === 'ACCEPTED') {
    if (!(await txExists('escrow'))) {
      await query(
        `INSERT INTO transactions (order_id, arc_tx_hash, amount_usdc, fee_usdc, type)
         VALUES ($1,$2,$3,0,'escrow')`, [id, tx_hash || null, order.amount_usdc]
      );
    }
    await query(`UPDATE orders SET status='IN_PROGRESS' WHERE id=$1`, [id]);
    if (tx_hash) await query(`UPDATE orders SET arc_tx_hash=$2 WHERE id=$1 AND arc_tx_hash IS NULL`, [id, tx_hash]);
    await systemMessage(id, `Escrow funded with ${order.amount_usdc} USDC on Arc. Work can begin.`);
    emitToOrder(id, 'status', { orderId: id, status: 'IN_PROGRESS' });
  }

  await query(
    `UPDATE orders SET client_satisfied=$2, freelancer_satisfied=$3,
        client_cancelled=$4, freelancer_cancelled=$5 WHERE id=$1`,
    [id, state.clientSatisfied, state.freelancerSatisfied, state.clientCancelled, state.freelancerCancelled]
  );

  const fee = computeFee(order.amount_usdc as number);
  const payout = Math.round((Number(order.amount_usdc) - fee) * 100) / 100;

  if (state.status === 'Released' && order.status !== 'COMPLETED') {
    if (!(await txExists('release'))) {
      await query(`INSERT INTO transactions (order_id, arc_tx_hash, amount_usdc, fee_usdc, type)
                   VALUES ($1,$2,$3,$4,'release')`, [id, tx_hash || null, payout, fee]);
      await query(`INSERT INTO transactions (order_id, arc_tx_hash, amount_usdc, fee_usdc, type)
                   VALUES ($1,$2,$3,$3,'fee')`, [id, tx_hash || null, fee]);
      await query(`UPDATE profiles SET completed_orders = completed_orders + 1 WHERE user_id=$1`, [order.freelancer_id]);
    }
    await query(`UPDATE orders SET platform_fee_usdc=$2, completed_at=now() WHERE id=$1`, [id, fee]);
    await setStatus(id, STATUS.COMPLETED,
      `Both parties satisfied. ${payout} USDC released to the freelancer, ${fee} USDC platform fee. Settled on Arc.`);
    invalidate('listings:');
  } else if (state.status === 'Refunded' && order.status !== 'CANCELLED') {
    if (!(await txExists('refund'))) {
      await query(`INSERT INTO transactions (order_id, arc_tx_hash, amount_usdc, fee_usdc, type)
                   VALUES ($1,$2,$3,0,'refund')`, [id, tx_hash || null, order.amount_usdc]);
    }
    await query(`UPDATE orders SET completed_at=now() WHERE id=$1`, [id]);
    await setStatus(id, STATUS.CANCELLED, `Order cancelled. ${order.amount_usdc} USDC refunded to the client on Arc.`);
    invalidate('listings:');
  } else if (state.clientSatisfied !== state.freelancerSatisfied && FUNDED_STATES.includes(order.status as OrderStatus)) {
    await query(`UPDATE orders SET status='REVIEWING' WHERE id=$1 AND status IN ('FUNDED','IN_PROGRESS','DELIVERED')`, [id]);
  }

  const fresh = await query<EscrowOrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  emitToOrder(id, 'status', { orderId: id, status: fresh.rows[0].status });
  res.json({ order: fresh.rows[0], synced: true, onchain: state });
}));

// Pre-funding cancel only; funded orders cancel on-chain via markCancelled() then /sync.
const cancelSchema = z.object({ reason: noUrls(z.string().max(500)).optional() });
ordersRouter.post('/:id/cancel', requireAuth, validateBody(cancelSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query<EscrowOrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, 'Order not found');
  const isClient = order.client_id === req.user!.id;
  const isFreelancer = order.freelancer_id === req.user!.id;
  if (!isClient && !isFreelancer) throw new HttpError(403, 'Not your order');
  if (!['OFFER_SENT', 'NEGOTIATING', 'ACCEPTED'].includes(order.status)) {
    throw new HttpError(400, 'A funded order must be cancelled from your wallet, not here');
  }

  const reason = (req.body as z.infer<typeof cancelSchema>).reason;
  await systemMessage(id, `${isClient ? 'Client' : 'Freelancer'} cancelled the order${reason ? `: ${reason}` : '.'}`);
  await setStatus(id, STATUS.CANCELLED, 'Order cancelled before funding.');
  invalidate('listings:');
  res.json({ ok: true, status: 'CANCELLED' });
}));

// open a dispute for admin mediation (only on funded orders)
const disputeSchema = z.object({ reason: noUrls(z.string().min(5).max(1000)) });
ordersRouter.post('/:id/dispute', requireAuth, validateBody(disputeSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await isParty(id, req.user!.id))) throw new HttpError(403, 'Not your order');
  const { rows: orderRows } = await query<{ status: OrderStatus; escrow_contract_address: string | null }>(
    'SELECT status, escrow_contract_address FROM orders WHERE id = $1', [id]
  );
  const o = orderRows[0];
  if (!o) throw new HttpError(404, 'Order not found');
  if (!FUNDED_STATES.includes(o.status) || !o.escrow_contract_address) {
    throw new HttpError(400, 'Only funded orders can be disputed');
  }

  const { reason } = req.body as z.infer<typeof disputeSchema>;
  const { rows } = await query(
    `INSERT INTO disputes (order_id, raised_by, reason) VALUES ($1,$2,$3) RETURNING *`,
    [id, req.user!.id, reason]
  );
  await setStatus(id, STATUS.DISPUTED, `Dispute opened: ${reason}. A platform admin will review the chat and delivered work.`);
  res.status(201).json({ dispute: rows[0] });
}));

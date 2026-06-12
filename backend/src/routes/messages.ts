import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { asyncHandler, validateBody, HttpError } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { messageLimit, isDuplicateMessage } from '../middleware/rateLimits.js';
import { isParty } from '../lib/orders.js';
import { safeUrl, noUrls } from '../lib/safeUrl.js';
import { emitToOrder } from '../realtime/hub.js';

// mergeParams so :id from the parent orders router is available
export const messagesRouter = Router({ mergeParams: true });

// GET /api/orders/:id/messages
messagesRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) throw new HttpError(400, 'Invalid order id');
  if (!(await isParty(orderId, req.user!.id))) throw new HttpError(403, 'Not your order');
  res.setHeader('Cache-Control', 'no-store');
  const { rows } = await query(
    `SELECT m.*, u.name AS sender_name
       FROM messages m LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.order_id = $1 ORDER BY m.sent_at ASC`, [orderId]
  );
  res.json({ messages: rows });
}));

// POST /api/orders/:id/messages: text or file link. Price changes go through adjust-price, not chat.
const msgSchema = z.object({
  content: noUrls(z.string().max(4000)).optional(),
  file_url: safeUrl().optional(),
  message_type: z.enum(['text', 'delivery']).default('text'),
  meta: z.record(z.any()).optional(),
}).refine((d) => d.content || d.file_url, { message: 'content or file_url required' });

messagesRouter.post('/', messageLimit, requireAuth, validateBody(msgSchema), asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) throw new HttpError(400, 'Invalid order id');
  if (!(await isParty(orderId, req.user!.id))) throw new HttpError(403, 'Not your order');
  const { content, file_url, message_type, meta } = req.body as z.infer<typeof msgSchema>;
  if (isDuplicateMessage(req.user!.id, orderId, content)) {
    throw new HttpError(429, 'Duplicate message. Wait a few seconds before sending the same text again');
  }
  const { rows } = await query(
    `INSERT INTO messages (order_id, sender_id, content, file_url, message_type, meta)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [orderId, req.user!.id, content || null, file_url || null, message_type, meta || {}]
  );
  const msg = { ...rows[0], sender_name: req.user!.name };
  emitToOrder(orderId, 'message', msg);
  res.status(201).json({ message: msg });
}));

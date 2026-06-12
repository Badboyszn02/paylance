// Shared order helpers: status constants, system messages, fee math, access checks.
import { query } from '../db/pool.js';
import { config } from '../config.js';
import { emitToOrder } from '../realtime/hub.js';
import type { OrderStatus } from '../types/models.js';

export const STATUS: Record<OrderStatus, OrderStatus> = {
  OFFER_SENT: 'OFFER_SENT', NEGOTIATING: 'NEGOTIATING', ACCEPTED: 'ACCEPTED',
  FUNDED: 'FUNDED', IN_PROGRESS: 'IN_PROGRESS', DELIVERED: 'DELIVERED',
  REVIEWING: 'REVIEWING', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
};

export const computeFee = (amount: number | string): number =>
  Math.round(Number(amount) * config.platformFee * 100) / 100;

export async function isParty(orderId: number, userId: number): Promise<boolean> {
  const { rows } = await query<{ client_id: number; freelancer_id: number }>(
    'SELECT client_id, freelancer_id FROM orders WHERE id = $1', [orderId]
  );
  if (!rows[0]) return false;
  return rows[0].client_id === userId || rows[0].freelancer_id === userId;
}

/** Insert a system message and broadcast it to the order room. */
export async function systemMessage(
  orderId: number,
  content: string,
  meta: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const { rows } = await query(
    `INSERT INTO messages (order_id, sender_id, content, message_type, meta)
     VALUES ($1, NULL, $2, 'system', $3) RETURNING *`,
    [orderId, content, meta]
  );
  emitToOrder(orderId, 'message', rows[0]);
  return rows[0];
}

export async function setStatus(orderId: number, status: OrderStatus, note?: string): Promise<void> {
  await query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
  emitToOrder(orderId, 'status', { orderId, status });
  if (note) await systemMessage(orderId, note);
}

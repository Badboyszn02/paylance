import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/pool.js';
import { asyncHandler, validateBody, HttpError } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { STATUS, computeFee, isParty, systemMessage, setStatus } from '../lib/orders.js';
import { arc, watchReceipt } from '../lib/arc.js';
import { invalidate } from '../lib/cache.js';
import { config } from '../config.js';
import type { OrderStatus } from '../types/models.js';

export const paymentsRouter = Router();

interface OrderRow {
  id: number;
  client_id: number;
  freelancer_id: number;
  status: OrderStatus;
  amount_usdc: string | number;
  client_satisfied: boolean;
  freelancer_satisfied: boolean;
  client_cancelled: boolean;
  freelancer_cancelled: boolean;
  escrow_contract_address: string | null;
  freelancer_wallet: string | null;
  client_wallet: string | null;
}

async function loadOrder(id: number): Promise<OrderRow | undefined> {
  const { rows } = await query<OrderRow>(
    `SELECT o.*, fu.wallet_address AS freelancer_wallet, cu.wallet_address AS client_wallet
       FROM orders o
       JOIN users fu ON fu.id = o.freelancer_id
       JOIN users cu ON cu.id = o.client_id
      WHERE o.id = $1`, [id]
  );
  return rows[0];
}

// Deploys the per-order escrow so the client can approve + lockFunds from their own wallet.
const deploySchema = z.object({ order_id: z.number().int().positive() });
paymentsRouter.post('/escrow/deploy', requireAuth, validateBody(deploySchema), asyncHandler(async (req, res) => {
  const { order_id } = req.body as z.infer<typeof deploySchema>;
  const order = await loadOrder(order_id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.client_id !== req.user!.id) throw new HttpError(403, 'Only the client funds escrow');
  if (order.status !== 'ACCEPTED') {
    throw new HttpError(400, 'The freelancer must accept the current price before you can fund the escrow');
  }
  if (!order.client_wallet || !order.freelancer_wallet) {
    throw new HttpError(400, 'Both parties must have a connected wallet');
  }

  let escrowAddress = order.escrow_contract_address;
  let simulated = false;
  if (!escrowAddress) {
    const r = await arc.createEscrow({
      orderId: order.id,
      clientAddress: order.client_wallet,
      freelancerAddress: order.freelancer_wallet,
      amountUsdc: order.amount_usdc as number,
    });
    escrowAddress = r.escrowAddress!;
    simulated = r.simulated;
    await query(`UPDATE orders SET escrow_contract_address=$2 WHERE id=$1`, [order.id, escrowAddress]);
  }

  res.json({
    ok: true,
    escrowAddress,
    usdcAddress: config.arc.usdcAddress,
    amountUsdc: Number(order.amount_usdc),
    orderId: order.id,
    simulated,
  });
}));

// Release/refund happen on-chain and mirror via /sync; only resolveDispute is admin-driven (onlyOwner).
const resolveSchema = z.object({
  order_id: z.number().int().positive(),
  freelancer_amount_usdc: z.number().min(0),
  client_amount_usdc: z.number().min(0),
  decision: z.string().max(2000),
});
paymentsRouter.post('/resolve', requireAuth, requireRole('admin'), validateBody(resolveSchema),
  asyncHandler(async (req, res) => {
    const { order_id, freelancer_amount_usdc, client_amount_usdc, decision } =
      req.body as z.infer<typeof resolveSchema>;
    const order = await loadOrder(order_id);
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.status !== 'DISPUTED') throw new HttpError(400, 'Order is not in dispute');
    if (!order.escrow_contract_address) throw new HttpError(400, 'Order has no escrow to settle');
    if (Number(freelancer_amount_usdc) + Number(client_amount_usdc) > Number(order.amount_usdc) + 0.01) {
      throw new HttpError(400, 'Split exceeds escrowed amount');
    }
    const { txHash, simulated } = await arc.resolveDispute({
      escrowAddress: order.escrow_contract_address,
      freelancerAmountUsdc: freelancer_amount_usdc,
      clientAmountUsdc: client_amount_usdc,
    });
    watchReceipt(`resolve:order=${order_id}`, txHash);
    await withTransaction(async (c) => {
      await c.query(`UPDATE orders SET status='COMPLETED', completed_at=now() WHERE id=$1`, [order_id]);
      await c.query(
        `UPDATE disputes SET status='resolved', admin_decision=$2, resolution_amount_usdc=$3, resolved_at=now()
          WHERE order_id=$1 AND status='open'`,
        [order_id, decision, freelancer_amount_usdc]
      );
      await c.query(
        `INSERT INTO transactions (order_id, arc_tx_hash, amount_usdc, fee_usdc, type)
         VALUES ($1,$2,$3,0,'release')`, [order_id, txHash, freelancer_amount_usdc]
      );
      if (Number(client_amount_usdc) > 0) {
        await c.query(
          `INSERT INTO transactions (order_id, arc_tx_hash, amount_usdc, fee_usdc, type)
           VALUES ($1,$2,$3,0,'refund')`, [order_id, txHash, client_amount_usdc]
        );
      }
    });
    await systemMessage(order_id,
      `Admin resolved dispute: ${freelancer_amount_usdc} USDC to freelancer, ${client_amount_usdc} USDC to client. ${decision} Tx: ${txHash}`);
    await setStatus(order_id, STATUS.COMPLETED);
    res.json({ ok: true, txHash, simulated });
  }));

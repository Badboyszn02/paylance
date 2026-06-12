import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { signToken } from '../lib/auth.js';
import { asyncHandler, validateBody, HttpError } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { buildLoginMessage, newNonce, normalizeAddress, verifySignature } from '../lib/siwe.js';
import { noUrls } from '../lib/safeUrl.js';
import type { UserRole } from '../types/models.js';

export const authRouter = Router();

interface UserRow {
  id: number;
  name: string | null;
  wallet_address: string;
  role: UserRole;
  created_at?: Date;
}

const nonceSchema = z.object({
  wallet_address: z.string().min(1),
});

authRouter.post('/nonce', validateBody(nonceSchema), asyncHandler(async (req, res) => {
  const { wallet_address } = req.body as z.infer<typeof nonceSchema>;
  let wallet: `0x${string}`;
  try { wallet = normalizeAddress(wallet_address); } catch { throw new HttpError(400, 'Invalid wallet address'); }

  const { nonce, issuedAt, expiresAt } = newNonce();
  const message = buildLoginMessage(wallet, nonce, issuedAt);

  await query(
    `INSERT INTO auth_nonces (wallet_address, message, expires_at)
     VALUES ($1,$2,$3)
     ON CONFLICT (wallet_address) DO UPDATE SET message = EXCLUDED.message, expires_at = EXCLUDED.expires_at`,
    [wallet.toLowerCase(), message, expiresAt]
  );

  res.json({ message });
}));

const verifySchema = z.object({
  wallet_address: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
  role: z.enum(['client', 'freelancer', 'creator']).optional(),
  name: noUrls(z.string().min(1).max(80)).optional(),
});

authRouter.post('/verify', validateBody(verifySchema), asyncHandler(async (req, res) => {
  const { wallet_address, signature, role, name } = req.body as z.infer<typeof verifySchema>;
  let wallet: `0x${string}`;
  try { wallet = normalizeAddress(wallet_address); } catch { throw new HttpError(400, 'Invalid wallet address'); }
  const lower = wallet.toLowerCase();

  const { rows: nonceRows } = await query<{ message: string; expires_at: Date }>(
    'SELECT message, expires_at FROM auth_nonces WHERE wallet_address = $1',
    [lower]
  );
  const stored = nonceRows[0];
  if (!stored) throw new HttpError(400, 'No pending nonce. Request /nonce first');
  if (new Date(stored.expires_at).getTime() < Date.now()) {
    await query('DELETE FROM auth_nonces WHERE wallet_address = $1', [lower]);
    throw new HttpError(400, 'Nonce expired. Request a new one');
  }

  const ok = await verifySignature(wallet, stored.message, signature as `0x${string}`);
  if (!ok) throw new HttpError(401, 'Invalid signature');

  await query('DELETE FROM auth_nonces WHERE wallet_address = $1', [lower]);

  const { rows } = await query<UserRow>(
    'SELECT id, name, wallet_address, role, created_at FROM users WHERE lower(wallet_address) = $1',
    [lower]
  );
  let user = rows[0];
  if (!user) {
    const ins = await query<UserRow>(
      `INSERT INTO users (name, wallet_address, role) VALUES ($1,$2,$3)
       RETURNING id, name, wallet_address, role, created_at`,
      [name || null, wallet, role || 'client']
    );
    user = ins.rows[0];
    await query(
      `INSERT INTO profiles (user_id, wallet_address) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, wallet]
    );
  }

  const token = signToken({ id: user.id, role: user.role, name: user.name });
  res.json({ token, user });
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.wallet_address, u.role, u.created_at,
            row_to_json(p) AS profile
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [req.user!.id]
  );
  if (!rows[0]) throw new HttpError(404, 'User not found');
  res.json({ user: rows[0] });
}));

const roleSchema = z.object({ role: z.enum(['client', 'freelancer', 'creator']) });
authRouter.put('/role', requireAuth, validateBody(roleSchema), asyncHandler(async (req, res) => {
  const { role } = req.body as z.infer<typeof roleSchema>;
  await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.user!.id]);
  res.json({ ok: true, role });
}));

const nameSchema = z.object({ name: noUrls(z.string().min(1).max(80)) });
authRouter.put('/name', requireAuth, validateBody(nameSchema), asyncHandler(async (req, res) => {
  const { name } = req.body as z.infer<typeof nameSchema>;
  await query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user!.id]);
  res.json({ ok: true, name });
}));

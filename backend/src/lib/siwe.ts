import { randomBytes } from 'node:crypto';
import { verifyMessage, isAddress, getAddress } from 'viem';

const NONCE_TTL_MS = 5 * 60 * 1000;

export function normalizeAddress(addr: string): `0x${string}` {
  if (!isAddress(addr)) throw new Error('invalid address');
  return getAddress(addr) as `0x${string}`;
}

export function buildLoginMessage(wallet: `0x${string}`, nonce: string, issuedAt: string): string {
  return [
    'Sign in to PayLance.',
    '',
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Issued: ${issuedAt}`,
  ].join('\n');
}

export function newNonce(): { nonce: string; issuedAt: string; expiresAt: Date } {
  return {
    nonce: randomBytes(16).toString('hex'),
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + NONCE_TTL_MS),
  };
}

export async function verifySignature(
  wallet: `0x${string}`,
  message: string,
  signature: `0x${string}`
): Promise<boolean> {
  try {
    return await verifyMessage({ address: wallet, message, signature });
  } catch {
    return false;
  }
}

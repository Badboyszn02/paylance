import type { OrderStatus } from './types';

export const usdc = (n: number | string | null | undefined): string =>
  `${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`;

export const shortAddr = (a?: string | null): string =>
  a && a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '';

export const shortHash = (h?: string | null): string =>
  h && h.length > 12 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h || '';

// Defense in depth: user-supplied hrefs must be http/https; guards data that slips past backend zod.
export const safeHref = (url?: string | null): string => {
  if (!url) return '#';
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : '#';
  } catch {
    return '#';
  }
};

export const explorerTx = (h: string): string =>
  `${process.env.NEXT_PUBLIC_ARC_EXPLORER || 'https://testnet.arcscan.app'}/tx/${h}`;

export const initials = (name?: string | null): string => {
  const s = (name ?? '').trim();
  if (/^0x[0-9a-fA-F]+$/.test(s)) return s.slice(2, 4).toUpperCase();
  return s.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
};

export const timeAgo = (iso?: string | null): string => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export type StatusTone = 'ok' | 'danger' | 'warn' | 'purple';

// Order status -> label + dot color (color only, no icons)
export const STATUS_META: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  OFFER_SENT:  { label: 'Offer sent', tone: 'warn' },
  NEGOTIATING: { label: 'Negotiating', tone: 'warn' },
  ACCEPTED:    { label: 'Accepted', tone: 'purple' },
  FUNDED:      { label: 'Funded', tone: 'purple' },
  IN_PROGRESS: { label: 'In progress', tone: 'purple' },
  DELIVERED:   { label: 'Delivered', tone: 'purple' },
  REVIEWING:   { label: 'Reviewing', tone: 'warn' },
  COMPLETED:   { label: 'Completed', tone: 'ok' },
  CANCELLED:   { label: 'Cancelled', tone: 'danger' },
  DISPUTED:    { label: 'Disputed', tone: 'danger' },
};

export const ORDER_STEPS: OrderStatus[] = [
  'OFFER_SENT', 'NEGOTIATING', 'ACCEPTED', 'FUNDED',
  'IN_PROGRESS', 'DELIVERED', 'REVIEWING', 'COMPLETED',
];

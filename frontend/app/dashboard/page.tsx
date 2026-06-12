'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';
import { StatusBadge, Stars, Skeleton } from '@/components/ui';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import { useToast } from '@/components/Toast';
import { usdc, timeAgo } from '@/lib/format';
import { friendly } from '@/lib/errors';
import { getUsdcBalance } from '@/lib/usdc';
import type { Order, Review, Listing } from '@/lib/types';

interface DashboardData {
  activeOrders: Order[];
  totalSpentUsdc: number;
  totalEarnedUsdc: number;
  pendingEscrowUsdc: number;
  pendingEscrowCount: number;
  reviews: Review[];
  orderCounts: { completed?: number; total?: number };
}

interface MyListing extends Listing {
  order_count: string | number;
  locked_count: string | number;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute mb-3">{label}</div>
      <div className="text-xl md:text-2xl font-medium text-purple-light tabular-nums">{value}</div>
    </div>
  );
}

const SIDEBAR = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/orders', label: 'Orders' },
  { href: '/settings', label: 'Settings' },
];

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col gap-1 h-fit lg:sticky lg:top-32">
      <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
        Account
      </div>
      {SIDEBAR.map((s) => {
        const active = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`relative pl-4 py-2 text-sm transition-colors ${active ? 'text-white' : 'text-txt-dim hover:text-white'}`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-accent" />
            )}
            {s.label}
          </Link>
        );
      })}
    </aside>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { address } = useWallet();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<DashboardData | false | null>(null);
  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [walletUsdc, setWalletUsdc] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/'); return; }
    api<DashboardData>('/api/dashboard').then(setData).catch(() => setData(false));
  }, [user, loading, router]);

  // Read the connected wallet's USDC balance straight from Arc (read-only, no popup).
  useEffect(() => {
    if (!address) { setWalletUsdc(null); return; }
    let cancelled = false;
    getUsdcBalance(address).then((b) => { if (!cancelled) setWalletUsdc(b); }).catch(() => { if (!cancelled) setWalletUsdc(null); });
    return () => { cancelled = true; };
  }, [address]);

  const role = user?.role;
  const isClient = role === 'client';

  useEffect(() => {
    if (loading || !user || isClient) return;
    api<{ listings: MyListing[] }>('/api/listings/mine').then((r) => setListings(r.listings)).catch(() => setListings([]));
  }, [user, loading, isClient]);

  const deleteListing = async (l: MyListing) => {
    if (Number(l.locked_count) > 0) {
      toast.error('This listing has an active or completed hire and cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    setDeletingId(l.id);
    try {
      await api(`/api/listings/${l.id}`, { method: 'DELETE' });
      setListings((prev) => (prev ? prev.filter((x) => x.id !== l.id) : prev));
      toast.success('Listing deleted');
    } catch (err) {
      toast.error(friendly(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHero
        quiet
        eyebrow="Dashboard"
        title={
          <>
            Your activity on <span className="font-display italic text-purple-light">PayLance</span>.
          </>
        }
        sub={`Snapshot of your ${isClient ? 'spending' : 'earnings'}, orders in flight, and pending escrow.`}
      />

      <section className="max-w-container mx-auto px-5 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-16">
        <Sidebar />

        <div>
          <Reveal>
            <div className="mb-12 flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute mb-3">USDC in your wallet</div>
                <div className="text-2xl md:text-3xl font-medium text-purple-light tabular-nums">
                  {address ? (walletUsdc === null ? '…' : usdc(walletUsdc)) : 'Connect wallet'}
                </div>
              </div>
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-purple-light hover:text-white transition-colors"
              >
                Get testnet USDC →
              </a>
            </div>
          </Reveal>

          {!data ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                <Reveal><Stat label="Total earned" value={usdc(data.totalEarnedUsdc)} /></Reveal>
                <Reveal delay={80}><Stat label="Total spent" value={usdc(data.totalSpentUsdc)} /></Reveal>
                <Reveal delay={160}><Stat label="Active orders" value={data.activeOrders.length} /></Reveal>
                <Reveal delay={240}><Stat label="Completed" value={data.orderCounts?.completed || 0} /></Reveal>
                <Reveal delay={320}><Stat label="Pending escrow" value={usdc(data.pendingEscrowUsdc)} /></Reveal>
                <Reveal delay={400}><Stat label="Total orders" value={data.orderCounts?.total || 0} /></Reveal>
              </div>

              <div className="mt-16">
                <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-6">
                  Active orders
                </div>
                {data.activeOrders.length === 0 ? (
                  <p className="text-txt-dim text-sm">No active orders.</p>
                ) : (
                  <div className="flex flex-col">
                    {data.activeOrders.map((o, i) => (
                      <Reveal key={o.id} delay={i * 60}>
                        <Link
                          href={`/orders/${o.id}`}
                          className="group flex items-center justify-between gap-4 py-4 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-display italic group-hover:text-purple-light transition-colors truncate">
                              {o.listing_title || `Order ${o.id}`}
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.18em] font-mono text-txt-mute mt-1.5">
                              {timeAgo(o.created_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-5 shrink-0">
                            <span className="text-sm text-purple-light tabular-nums font-mono hidden sm:block">
                              {usdc(o.amount_usdc)}
                            </span>
                            <StatusBadge status={o.status} />
                          </div>
                        </Link>
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>

              {!isClient && (
                <div className="mt-16">
                  <div className="flex items-baseline justify-between mb-6">
                    <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light">
                      Your listings
                    </div>
                    <Link href="/listing/new" className="text-xs text-txt-dim hover:text-white transition-colors">
                      + New listing
                    </Link>
                  </div>
                  {listings === null ? (
                    <Skeleton className="h-20" />
                  ) : listings.length === 0 ? (
                    <p className="text-txt-dim text-sm">
                      You have not posted any listings yet. <Link href="/listing/new" className="underline hover:text-white">Post one.</Link>
                    </p>
                  ) : (
                    <div className="flex flex-col">
                      {listings.map((l, i) => {
                        const locked = Number(l.locked_count) > 0;
                        const isArchived = l.status === 'archived';
                        return (
                          <Reveal key={l.id} delay={i * 60}>
                            <div className="group flex items-center justify-between gap-4 py-4">
                              <div className="min-w-0 flex-1">
                                <Link href={`/listing/${l.id}`} className="font-display italic group-hover:text-purple-light transition-colors truncate block">
                                  {l.title}
                                </Link>
                                <div className="text-[11px] uppercase tracking-[0.18em] font-mono text-txt-mute mt-1.5">
                                  {timeAgo(l.created_at)} · {Number(l.order_count) || 0} orders
                                  {locked && ' · in escrow'}
                                  {isArchived && ' · archived'}
                                </div>
                              </div>
                              <div className="flex items-center gap-5 shrink-0">
                                <span className="text-sm text-purple-light tabular-nums font-mono hidden sm:block">
                                  {usdc(l.price_usdc)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteListing(l)}
                                  disabled={locked || deletingId === l.id || isArchived}
                                  title={locked ? 'Has an active or completed hire' : isArchived ? 'Already archived' : 'Delete listing'}
                                  className="text-xs text-txt-dim hover:text-danger disabled:opacity-30 disabled:hover:text-txt-dim disabled:cursor-not-allowed transition-colors"
                                >
                                  {deletingId === l.id ? 'Deleting…' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </Reveal>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!isClient && (
                <div className="mt-16">
                  <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-6">
                    Recent reviews
                  </div>
                  {data.reviews.length === 0 ? (
                    <p className="text-txt-dim text-sm">No reviews yet.</p>
                  ) : (
                    <div className="flex flex-col gap-7">
                      {data.reviews.map((r, i) => (
                        <Reveal key={r.id} delay={i * 60}>
                          <div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-medium">{r.reviewer_name}</span>
                              <Stars value={r.rating} />
                            </div>
                            <p className="text-sm text-txt-dim mt-2 leading-relaxed">{r.comment}</p>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

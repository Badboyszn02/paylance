'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { StatusBadge, Skeleton } from '@/components/ui';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import { usdc, timeAgo } from '@/lib/format';
import type { Order } from '@/lib/types';

function EmptyMark() {
  return (
    <svg viewBox="0 0 80 80" width="56" height="56" stroke="rgba(103,232,249,0.5)" strokeWidth="1.2" fill="none" aria-hidden>
      <rect x="12" y="14" width="56" height="52" />
      <line x1="22" y1="28" x2="48" y2="28" strokeOpacity="0.45" />
      <line x1="22" y1="40" x2="58" y2="40" strokeOpacity="0.45" />
      <line x1="22" y1="52" x2="44" y2="52" strokeOpacity="0.45" />
    </svg>
  );
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/'); return; }
    api<{ orders: Order[] }>('/api/orders').then((d) => setOrders(d.orders || [])).catch(() => setOrders([]));
  }, [user, loading, router]);

  return (
    <div>
      <PageHero
        quiet
        eyebrow="Orders"
        title={
          <>
            Every order you&rsquo;re <span className="font-display italic text-purple-light">part of</span>.
          </>
        }
        sub="As client or freelancer. Open one to chat, deliver work, fund the escrow contract, or release payment on Arc."
      />

      <section className="max-w-container mx-auto px-5 pb-16 sm:pb-24">
        {orders === null ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : orders.length === 0 ? (
          <Reveal>
            <div className="py-10">
              <EmptyMark />
              <div className="font-display italic text-xl mt-6">No orders yet.</div>
              <p className="text-sm text-txt-dim mt-2 max-w-md leading-relaxed">
                Once you hire someone (or get hired), the order shows up here with its chat, status, and escrow state.
              </p>
              <Link href="/explore" className="inline-flex items-center gap-2 mt-6 text-sm text-purple-light hover:text-white transition-colors group">
                Browse listings
                <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="flex flex-col">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute mb-4">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </div>
            {orders.map((o, i) => {
              const counterpart = user && o.client_id === user.id ? o.freelancer_name : o.client_name;
              const role = user && o.client_id === user.id ? 'You hired' : 'Hired by';
              return (
                <Reveal key={o.id} delay={Math.min(i * 50, 300)}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="group flex items-center justify-between gap-4 py-5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono tabular-nums text-[11px] tracking-[0.18em] text-txt-mute shrink-0">
                          #{o.id}
                        </span>
                        <span className="font-display italic text-lg truncate group-hover:text-purple-light transition-colors">
                          {o.listing_title || `Order ${o.id}`}
                        </span>
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.18em] font-mono text-txt-mute mt-2 truncate">
                        {role} {counterpart} Â· {timeAgo(o.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-sm text-purple-light tabular-nums font-mono hidden sm:block">
                        {usdc(o.amount_usdc)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

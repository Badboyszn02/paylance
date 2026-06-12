'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Avatar, Button, Stars, Pill, Skeleton } from '@/components/ui';
import { usdc, timeAgo, shortAddr, safeHref } from '@/lib/format';
import { friendly } from '@/lib/errors';
import type { Listing, Order, Review } from '@/lib/types';

interface ListingData {
  listing: Listing;
  reviews: Review[];
}

export default function ListingPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<ListingData | false | null>(null);
  const [hiring, setHiring] = useState(false);

  useEffect(() => {
    api<ListingData>(`/api/listings/${id}`, { auth: false }).then(setData).catch(() => setData(false));
  }, [id]);

  const hire = async () => {
    if (!user) { router.push('/'); return; }
    if (!data) return;
    const isJob = data.listing.kind === 'job';
    setHiring(true);
    try {
      const { order } = await api<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: {
          listing_id: data.listing.id,
          amount_usdc: Number(data.listing.price_usdc),
          message: isJob
            ? `Hi, I'd like to take on "${data.listing.title}".`
            : `Hi, I'd like to order "${data.listing.title}".`,
        },
      });
      toast.success('Order created. Opening chat.');
      router.push(`/orders/${order.id}`);
    } catch (err) {
      toast.error(friendly(err));
    } finally {
      setHiring(false);
    }
  };

  if (data === null) return <div className="max-w-container mx-auto px-5 py-10"><Skeleton className="h-96" /></div>;
  if (data === false) return <div className="max-w-container mx-auto px-5 py-20 text-txt-dim">Listing not found.</div>;

  const l = data.listing;
  return (
    <div className="max-w-container mx-auto px-5 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      {/* Left: details */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <Pill>{l.category}{l.subcategory ? ` · ${l.subcategory}` : ''}</Pill>
          {l.kind === 'job' ? (
            <span className="inline-block text-[11px] uppercase tracking-[0.18em] font-mono px-2.5 py-1 rounded-full bg-purple-accent/20 text-purple-light">Looking to hire</span>
          ) : (
            <span className="inline-block text-[11px] uppercase tracking-[0.18em] font-mono px-2.5 py-1 rounded-full bg-white/[0.06] text-txt-dim">Offering a service</span>
          )}
        </div>
        <h1 className="text-3xl mt-4">{l.title}</h1>

        <div className="flex items-center gap-3 mt-5">
          <Avatar name={l.freelancer_name || l.freelancer_wallet} src={l.avatar_url} size={48} />
          <div>
            <Link href={`/profile/${l.freelancer_id}`} className="font-medium hover:text-purple-light">{l.freelancer_name || shortAddr(l.freelancer_wallet) || 'Unnamed'}</Link>
            <div className="text-sm text-txt-dim">{l.location || 'Remote'} · {l.completed_orders || 0} orders completed</div>
          </div>
          <div className="ml-auto"><Stars value={l.average_rating} count={l.review_count} /></div>
        </div>

        <div className="bg-card rounded-lg p-6 mt-8">
          <h2 className="text-lg mb-3">About this service</h2>
          <p className="text-txt-dim leading-relaxed whitespace-pre-wrap">{l.description}</p>
          {l.skills && l.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {l.skills.map((s) => <Pill key={s}>{s}</Pill>)}
            </div>
          )}
        </div>

        {l.portfolio_links && l.portfolio_links.length > 0 && (
          <div className="bg-card rounded-lg p-6 mt-4">
            <h2 className="text-lg mb-3">Portfolio</h2>
            <div className="flex flex-col gap-2">
              {l.portfolio_links.map((p, i) => (
                <a key={i} href={safeHref(p)} target="_blank" rel="noreferrer" className="text-purple-light hover:underline text-sm break-all">{p}</a>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-card rounded-lg p-6 mt-4">
          <h2 className="text-lg mb-4">Reviews</h2>
          {!data.reviews?.length ? (
            <p className="text-txt-dim text-sm">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.reviews.map((r, i) => (
                <div key={i} className="border-t border-line pt-4 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{r.reviewer_name}</span>
                    <Stars value={r.rating} />
                  </div>
                  <p className="text-sm text-txt-dim mt-1">{r.comment}</p>
                  <div className="text-xs text-txt-mute mt-1">{timeAgo(r.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: sticky order card */}
      <aside>
        <div className="bg-card rounded-lg p-6 lg:sticky lg:top-20">
          <div className="text-sm text-txt-dim">{l.kind === 'job' ? 'Budget' : 'Price'}</div>
          <div className="text-3xl font-medium text-purple-light mt-1">{usdc(l.price_usdc)}</div>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between"><span className="text-txt-dim">{l.kind === 'job' ? 'Deadline' : 'Delivery'}</span><span>{l.delivery_days} days</span></div>
            <div className="flex justify-between"><span className="text-txt-dim">Platform fee</span><span>2% on release</span></div>
            <div className="flex justify-between"><span className="text-txt-dim">Settled in</span><span>USDC on Arc</span></div>
          </div>
          {user?.id === l.freelancer_id ? (
            <p className="text-sm text-txt-dim mt-6">This is your own post. Manage it from your dashboard.</p>
          ) : (
            <>
              <Button className="w-full mt-6" onClick={hire} disabled={hiring}>
                {hiring ? 'Creating order…' : l.kind === 'job' ? 'Apply (open chat & escrow)' : 'Hire (open chat & escrow)'}
              </Button>
              <p className="text-xs text-txt-mute mt-3 leading-relaxed">
                {l.kind === 'job'
                  ? 'Creates a private order chat with the hirer. They fund escrow after you agree on terms.'
                  : 'Creates a private order chat. You fund escrow after agreeing on terms.'}
              </p>
            </>
          )}
          {l.tx_hash && (
            <a
              href={`${process.env.NEXT_PUBLIC_ARC_EXPLORER || 'https://testnet.arcscan.app'}/tx/${l.tx_hash}`}
              target="_blank"
              rel="noreferrer"
              className="block mt-5 pt-5 border-t border-line text-xs text-txt-dim hover:text-purple-light transition-colors"
            >
              Verified on Arc · {l.tx_hash.slice(0, 10)}…{l.tx_hash.slice(-6)}
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { Avatar, Stars } from './ui';
import { usdc, shortAddr } from '@/lib/format';
import type { Listing } from '@/lib/types';

export default function FreelancerCard({ listing }: { listing: Listing }) {
  const l = listing;
  const display = l.freelancer_name || shortAddr(l.freelancer_wallet) || 'Unnamed';
  const isJob = l.kind === 'job';

  return (
    <article className="group relative flex flex-col gap-4 sm:gap-5 h-full rounded-xl border border-line bg-white/[0.015] p-4 sm:p-5 transition-colors hover:border-white/15 hover:bg-white/[0.03]">
      <div className="flex items-start gap-3 min-w-0">
        <Avatar name={l.freelancer_name || l.freelancer_wallet} src={l.avatar_url} size={44} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${l.freelancer_id}`}
            className="font-medium hover:text-purple-light block truncate text-[0.95rem] sm:text-base min-h-[24px]"
          >
            {display}
          </Link>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-txt-mute font-mono truncate mt-0.5">
            {l.category}{l.location ? ` · ${l.location}` : ''}
          </div>
        </div>
      </div>

      <Link href={`/listing/${l.id}`} className="block flex-1 min-w-0">
        {isJob && (
          <span className="inline-block text-[10px] uppercase tracking-[0.14em] font-mono px-2 py-1 rounded-md bg-purple-accent/15 text-purple-light mb-2">
            Looking to hire
          </span>
        )}
        <div className="font-display italic text-lg sm:text-xl leading-snug line-clamp-2 group-hover:text-purple-light transition-colors">
          {l.title}
        </div>
        <p className="text-sm sm:text-base text-txt-dim mt-2 line-clamp-2 leading-relaxed">
          {l.description}
        </p>
      </Link>

      <Stars value={l.average_rating} count={l.review_count} />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-1 mt-auto">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-txt-mute font-mono">
            {isJob ? 'Budget' : 'From'}
          </div>
          <div className="font-mono tabular-nums text-purple-light text-lg mt-0.5">
            {usdc(l.price_usdc)}
          </div>
          <div className="text-[11px] text-txt-mute font-mono mt-0.5">
            delivery in {l.delivery_days}d
          </div>
        </div>
        <Link
          href={`/listing/${l.id}`}
          className="inline-flex items-center justify-center gap-1.5 text-sm min-h-[44px] px-4 rounded-md border border-line text-purple-light hover:text-white hover:border-white/20 active:scale-[0.98] transition-all w-full sm:w-auto"
        >
          {isJob ? 'Apply' : 'Hire'}
          <span className="inline-block group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}

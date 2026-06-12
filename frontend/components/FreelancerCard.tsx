'use client';
import Link from 'next/link';
import { Avatar, Stars } from './ui';
import { usdc, shortAddr } from '@/lib/format';
import type { Listing } from '@/lib/types';

export default function FreelancerCard({ listing }: { listing: Listing }) {
  const l = listing;
  const display = l.freelancer_name || shortAddr(l.freelancer_wallet) || 'Unnamed';
  return (
    <div className="group relative flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <Avatar name={l.freelancer_name || l.freelancer_wallet} src={l.avatar_url} size={44} />
        <div className="min-w-0">
          <Link
            href={`/profile/${l.freelancer_id}`}
            className="font-medium hover:text-purple-light block truncate"
          >
            {display}
          </Link>
          <div className="text-[11px] uppercase tracking-[0.18em] text-txt-mute font-mono truncate">
            {l.category}{l.location ? ` · ${l.location}` : ''}
          </div>
        </div>
      </div>

      <Link href={`/listing/${l.id}`} className="block">
        {l.kind === 'job' && (
          <span className="inline-block text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-0.5 rounded-full bg-purple-accent/20 text-purple-light mb-2">
            Looking to hire
          </span>
        )}
        <div className="font-display italic text-xl leading-snug line-clamp-2 group-hover:text-purple-light transition-colors">
          {l.title}
        </div>
        <p className="text-base text-txt-dim mt-2 line-clamp-2 leading-relaxed">{l.description}</p>
      </Link>

      <Stars value={l.average_rating} count={l.review_count} />

      <div className="flex items-end justify-between pt-1">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-txt-mute font-mono">From</div>
          <div className="font-mono tabular-nums text-purple-light text-lg mt-0.5">
            {usdc(l.price_usdc)}
          </div>
          <div className="text-[11px] text-txt-mute font-mono mt-0.5">
            delivery in {l.delivery_days}d
          </div>
        </div>
        <Link
          href={`/listing/${l.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-purple-light hover:text-white"
        >
          Hire
          <span className="inline-block translate-x-0 group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

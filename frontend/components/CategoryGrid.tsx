'use client';
import Link from 'next/link';

interface CategoryDef {
  name: string;
  desc: string;
  img: string;
  alt: string;
  short: string;
}

export const CATEGORIES: readonly CategoryDef[] = [
  {
    name: 'Design',
    short: 'Design',
    desc: 'Logos, graphics, brand',
    img: '/images/design.jpg',
    alt: 'Designer working on a tablet',
  },
  {
    name: 'Writing & Content',
    short: 'Writing',
    desc: 'Articles, copy, scripts',
    img: '/images/writing.jpg',
    alt: 'Person typing on a laptop',
  },
  {
    name: 'Digital Marketing',
    short: 'Marketing',
    desc: 'SEO, social, ads',
    img: '/images/marketing.jpg',
    alt: 'Analytics chart on a screen',
  },
  {
    name: 'Video Editing',
    short: 'Video',
    desc: 'Reels, YouTube, motion',
    img: '/images/video.jpg',
    alt: 'Video editing timeline',
  },
  {
    name: 'AI Services',
    short: 'AI',
    desc: 'Prompts, automation',
    img: '/images/ai.jpg',
    alt: 'Code on a dark display',
  },
  {
    name: 'Influencer & Creator Hiring',
    short: 'Creators',
    desc: 'IG, TikTok, YouTube, X',
    img: '/images/influencer.jpg',
    alt: 'Creator filming with a phone',
  },
] as const;

export default function CategoryGrid({ counts = {} }: { counts?: Record<string, number> }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3"
      role="list"
    >
      {CATEGORIES.map((c) => {
        const n = counts[c.name] || 0;
        return (
          <Link
            key={c.name}
            href={`/explore?category=${encodeURIComponent(c.name)}`}
            role="listitem"
            className="group relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a1218]
              active:scale-[0.98] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-accent"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.img}
              alt={c.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              style={{ filter: 'grayscale(0.45) contrast(1.08) brightness(0.62)' }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 30%, rgba(10,10,15,0.55) 62%, rgba(10,10,15,0.94) 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background:
                  'radial-gradient(80% 60% at 50% 100%, rgba(34,211,238,0.18), transparent 70%)',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
              <div className="text-sm sm:text-[15px] font-semibold text-white tracking-tight leading-tight">
                {c.short}
              </div>
              <div className="mt-0.5 text-[11px] text-txt-dim leading-snug line-clamp-1">
                {c.desc}
              </div>
              <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.12em] text-txt-mute group-hover:text-purple-light transition-colors">
                {n > 0 ? `${n} live` : 'Browse'}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

'use client';
import Link from 'next/link';
import Photo from './Photo';

interface CategoryDef {
  name: string;
  desc: string;
  img: string;
  alt: string;
}

export const CATEGORIES: readonly CategoryDef[] = [
  {
    name: 'Design',
    desc: 'Logos, graphics, illustrations',
    img: '/images/design.jpg',
    alt: 'Graphic designer using a tablet and laptop',
  },
  {
    name: 'Writing & Content',
    desc: 'Articles, copy, scripts',
    img: '/images/writing.jpg',
    alt: 'Close-up of a person typing on a laptop',
  },
  {
    name: 'Digital Marketing',
    desc: 'SEO, social media, ads',
    img: '/images/marketing.jpg',
    alt: 'A purple chart on a computer screen',
  },
  {
    name: 'Video Editing',
    desc: 'Reels, YouTube, animations',
    img: '/images/video.jpg',
    alt: 'Adobe Premiere editing timeline',
  },
  {
    name: 'AI Services',
    desc: 'Prompts, automation, workflows',
    img: '/images/ai.jpg',
    alt: 'Programming code on screen in a dark room',
  },
  {
    name: 'Influencer & Creator Hiring',
    desc: 'Instagram, TikTok, YouTube, X',
    img: '/images/influencer.jpg',
    alt: 'Creator vlogging with a phone and ring light',
  },
] as const;

export default function CategoryGrid({ counts = {} }: { counts?: Record<string, number> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
      {CATEGORIES.map((c, i) => (
        <Link
          key={c.name}
          href={`/explore?category=${encodeURIComponent(c.name)}`}
          className="group block"
        >
          <Photo src={c.img} alt={c.alt} aspect="aspect-[4/5]" />
          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono tabular-nums text-[11px] tracking-[0.18em] text-txt-mute">
                0{i + 1}
              </span>
              <span className="font-medium text-lg group-hover:text-purple-light transition-colors">
                {c.name}
              </span>
            </div>
            <div className="text-sm text-txt-dim mt-2 leading-relaxed">{c.desc}</div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-txt-mute">
              <span>{counts[c.name] || 0} active</span>
              <span className="inline-block opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-light">
                ›
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

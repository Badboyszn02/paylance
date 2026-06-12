'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import Reveal from './Reveal';

interface Item {
  n: string;
  eyebrow: string;
  title: ReactNode;
  desc: string;
  href: string;
  src: string;
  alt: string;
}

const ITEMS: Item[] = [
  {
    n: '01',
    eyebrow: 'Design',
    title: 'Brand identity, logos, illustration',
    desc: 'Logos, brand systems, illustrations and motion, delivered by tier. Starting from 40 USDC.',
    href: '/explore?category=Design',
    src: '/images/guide-design.jpg',
    alt: 'Designer at work',
  },
  {
    n: '02',
    eyebrow: 'Video',
    title: 'Reels, edits, animations',
    desc: 'Short-form edits for Reels and TikTok, long-form YouTube cuts, motion and titles.',
    href: '/explore?category=Video%20Editing',
    src: '/images/guide-video.jpg',
    alt: 'Video editor at a monitor',
  },
  {
    n: '03',
    eyebrow: 'Creators',
    title: 'Sponsored posts from creators',
    desc: 'Creators set a per-post rate in their listing. You hire, agree on the brief in chat, lock the funds on Arc.',
    href: '/explore?category=Influencer%20%26%20Creator%20Hiring',
    src: '/images/guide-creators.jpg',
    alt: 'Creator with phone and ring light',
  },
];

function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        style={{ filter: 'grayscale(1) contrast(1.1) brightness(0.85)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(165deg, #1a1530 0%, #2e2566 45%, #534AB7 100%)',
          mixBlendMode: 'multiply',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(60% 70% at 50% 40%, rgba(103,232,249,0.22), transparent 65%)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(10,10,15,0.55) 85%), linear-gradient(180deg, transparent 50%, rgba(10,10,15,0.88))',
        }}
      />
    </div>
  );
}

export default function GuideStrip() {
  return (
    <section className="max-w-container mx-auto px-5 py-16 sm:py-24">
      <Reveal>
        <div className="mb-10">
          <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
            A look at the work
          </div>
          <h2 className="text-2xl font-medium max-w-2xl leading-snug">
            Three kinds of work freelancers and creators ship on PayLance every week.
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
        {ITEMS.map((it, i) => (
          <Reveal key={it.n} delay={i * 120}>
            <Link href={it.href} className="group block">
              <Photo src={it.src} alt={it.alt} />
              <div className="mt-5">
                <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light">
                  {it.n} Â· {it.eyebrow}
                </div>
                <div className="font-display italic text-xl mt-3 leading-tight group-hover:text-purple-light transition-colors">
                  {it.title}
                </div>
                <p className="text-sm text-txt-dim mt-2 leading-relaxed">{it.desc}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

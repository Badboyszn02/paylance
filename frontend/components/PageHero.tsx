'use client';
import type { ReactNode } from 'react';
import HeroBackdrop from './HeroBackdrop';

interface Props {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  quiet?: boolean;
}

export default function PageHero({ eyebrow, title, sub, children, quiet = false }: Props) {
  const padding = quiet
    ? 'pt-10 sm:pt-12 pb-6 sm:pb-8'
    : 'pt-16 sm:pt-20 pb-10 sm:pb-14';
  return (
    <section className="relative">
      {!quiet && <HeroBackdrop />}
      <div className={`relative max-w-container mx-auto px-5 ${padding}`}>
        {eyebrow && (
          <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl max-w-2xl leading-snug">
          {title}
        </h1>
        {sub && (
          <p className="text-txt-dim mt-5 max-w-2xl text-base sm:text-lg leading-relaxed">
            {sub}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

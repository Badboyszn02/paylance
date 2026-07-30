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
    ? 'pt-8 sm:pt-12 pb-5 sm:pb-8'
    : 'pt-10 sm:pt-16 md:pt-20 pb-8 sm:pb-12 md:pb-14';
  return (
    <section className="relative">
      {!quiet && <HeroBackdrop />}
      <div className={`relative max-w-container mx-auto px-4 sm:px-5 ${padding}`}>
        {eyebrow && (
          <div className="font-mono uppercase tracking-[0.18em] text-[10px] sm:text-[11px] text-purple-light mb-3 sm:mb-5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[1.65rem] sm:text-3xl md:text-4xl max-w-2xl leading-[1.2] sm:leading-snug tracking-tight">
          {title}
        </h1>
        {sub && (
          <p className="text-txt-dim mt-3 sm:mt-5 max-w-2xl text-[0.95rem] sm:text-lg leading-relaxed">
            {sub}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

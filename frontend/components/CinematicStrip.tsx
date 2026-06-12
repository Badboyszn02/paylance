'use client';
import type { ReactNode } from 'react';

interface Props {
  src: string;
  alt: string;
  eyebrow?: string;
  caption?: ReactNode;
}

export default function CinematicStrip({ src, alt, eyebrow, caption }: Props) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[560px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'grayscale(1) contrast(1.1) brightness(0.85)' }}
        />
        {/* Purple duotone via multiply over the grayscale image */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(165deg, #1a1530 0%, #2e2566 45%, #534AB7 100%)',
            mixBlendMode: 'multiply',
          }}
        />
        {/* Light bloom for highlights */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(60% 70% at 50% 40%, rgba(103,232,249,0.22), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* Vignette + bottom fade for caption legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(10,10,15,0.55) 80%), linear-gradient(180deg, transparent 40%, rgba(10,10,15,0.92))',
          }}
        />
        {(eyebrow || caption) && (
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-container mx-auto w-full px-5 pb-10 sm:pb-14">
              {eyebrow && (
                <div className="font-mono uppercase tracking-[0.2em] text-[11px] text-purple-light mb-4">
                  {eyebrow}
                </div>
              )}
              {caption && (
                <div className="font-display italic text-2xl sm:text-3xl md:text-4xl max-w-2xl leading-snug">
                  {caption}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

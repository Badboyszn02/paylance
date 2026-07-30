'use client';

interface Props {
  src: string;
  alt: string;
  aspect?: string;
  priority?: boolean;
  className?: string;
}

export default function Photo({ src, alt, aspect = 'aspect-[4/3]', priority = false, className = '' }: Props) {
  return (
    <div className={`relative ${aspect} overflow-hidden rounded-lg bg-[#0a1218] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'grayscale(1) contrast(1.08) brightness(0.72)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(165deg, rgba(10,18,24,0.88) 0%, rgba(8,50,62,0.55) 48%, rgba(8,145,178,0.42) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(60% 70% at 50% 40%, rgba(103,232,249,0.16), transparent 65%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(10,10,15,0.55) 85%), linear-gradient(180deg, transparent 50%, rgba(10,10,15,0.88))',
        }}
      />
    </div>
  );
}

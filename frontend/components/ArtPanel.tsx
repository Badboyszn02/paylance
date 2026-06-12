'use client';

interface Props {
  height?: 'sm' | 'md' | 'lg';
}

const H: Record<NonNullable<Props['height']>, string> = {
  sm: 'h-32 sm:h-40',
  md: 'h-48 sm:h-64',
  lg: 'h-64 sm:h-80',
};

export default function ArtPanel({ height = 'md' }: Props) {
  return (
    <div className={`relative w-full overflow-hidden ${H[height]}`} aria-hidden>
      <div
        className="absolute -top-32 -left-24 w-[60vw] h-[60vw] rounded-full blur-3xl opacity-50 mesh-a"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(127,119,221,0.45), transparent 60%)' }}
      />
      <div
        className="absolute -bottom-32 -right-24 w-[60vw] h-[60vw] rounded-full blur-3xl opacity-45 mesh-b"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(8,145,178,0.55), transparent 60%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 80%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,15,0.6) 0%, transparent 30%, transparent 70%, rgba(10,10,15,0.6) 100%)',
        }}
      />
    </div>
  );
}

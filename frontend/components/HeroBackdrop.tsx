'use client';

export default function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute -top-48 -left-32 w-[62vw] h-[62vw] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(127,119,221,0.42), transparent 62%)' }}
      />
      <div
        className="absolute -bottom-56 -right-32 w-[64vw] h-[64vw] rounded-full blur-3xl opacity-45"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(8,145,178,0.45), transparent 60%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
        }}
      />
    </div>
  );
}

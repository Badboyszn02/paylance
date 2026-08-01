'use client';

/** Soft cyan atmosphere for non-home pages. No grids. */
export default function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[min(80vw,640px)] h-[min(50vw,360px)] rounded-full blur-[100px] opacity-35"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(34,211,238,0.28), transparent 70%)',
        }}
      />
    </div>
  );
}

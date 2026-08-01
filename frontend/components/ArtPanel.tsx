'use client';

interface Props {
  height?: 'sm' | 'md' | 'lg';
}

const H: Record<NonNullable<Props['height']>, string> = {
  sm: 'h-28 sm:h-36',
  md: 'h-40 sm:h-52',
  lg: 'h-52 sm:h-64',
};

/** Breath section — soft cyan glows only, no grid. */
export default function ArtPanel({ height = 'md' }: Props) {
  return (
    <div className={`relative w-full overflow-hidden ${H[height]}`} aria-hidden>
      <div
        className="absolute -top-24 left-1/4 w-[50vw] h-[50vw] max-w-md rounded-full blur-[90px] opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(34,211,238,0.28), transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-28 right-1/5 w-[45vw] h-[45vw] max-w-sm rounded-full blur-[90px] opacity-35"
        style={{
          background:
            'radial-gradient(circle, rgba(8,145,178,0.35), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,15,0.85) 0%, transparent 40%, transparent 60%, rgba(10,10,15,0.9) 100%)',
        }}
      />
    </div>
  );
}

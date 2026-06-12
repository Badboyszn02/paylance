'use client';

const FACTS = [
  'USDC settlement',
  'On-chain escrow',
  '2% flat fee',
  'Release on satisfaction',
  'Disputes resolved by Support Care',
  'Wallet sign in',
  'Arc network',
  'Verifiable on chain',
  'Six categories',
  'No subscription',
];

export default function FactStrip() {
  const stream = [...FACTS, ...FACTS];
  return (
    <div className="relative overflow-hidden py-5 fade-edges" aria-hidden>
      <div className="flex gap-12 marquee whitespace-nowrap">
        {stream.map((f, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 font-mono uppercase tracking-[0.18em] text-[11px] text-txt-dim shrink-0"
          >
            <span className="w-1 h-1 rounded-full bg-purple-light shrink-0" />
            <span>{f}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

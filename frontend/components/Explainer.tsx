'use client';
import Reveal from './Reveal';

interface Item {
  n: string;
  t: string;
  d: string;
}

export default function Explainer({ items }: { items: Item[] }) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div
        className="absolute left-[27px] top-12 bottom-12 w-px pointer-events-none"
        aria-hidden
      >
        <span
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(to bottom, rgba(103,232,249,0.38) 0 4px, transparent 4px 9px)',
          }}
        />
        <span
          className="flow-dot"
          style={{ ['--flow-end' as string]: 'calc(100% + 10px)' }}
        />
        <span
          className="flow-dot"
          style={{ ['--flow-end' as string]: 'calc(100% + 10px)', animationDelay: '1.3s' }}
        />
        <span
          className="flow-dot"
          style={{ ['--flow-end' as string]: 'calc(100% + 10px)', animationDelay: '2.6s' }}
        />
      </div>

      <div className="flex flex-col gap-16">
        {items.map((s, i) => (
          <Reveal key={i} delay={i * 120}>
            <div className="flex items-start gap-6">
              <div className="relative shrink-0 w-14 h-14">
                <span
                  className="absolute inset-0 rounded-full node-glow"
                  style={{
                    animationDelay: `${i * 0.9}s`,
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(103,232,249,0.32) 0%, rgba(8,145,178,0.04) 70%, transparent 100%)',
                  }}
                />
                <span
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: 'rgba(103,232,249,0.45)' }}
                />
                <span
                  className="absolute -inset-1.5 rounded-full border"
                  style={{
                    borderColor: 'rgba(103,232,249,0.18)',
                    borderStyle: 'dashed',
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-mono tabular-nums text-purple-light text-[13px] tracking-[0.1em]">
                  {s.n}
                </span>
              </div>

              <div className="pt-2 flex-1 min-w-0">
                <div className="font-display italic text-xl leading-tight">{s.t}</div>
                <p className="text-base text-txt-dim mt-3 leading-relaxed">{s.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

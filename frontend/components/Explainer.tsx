'use client';
import Reveal from './Reveal';

interface Item {
  n: string;
  t: string;
  d: string;
}

/** Numbered prose, separated by hairline rules — the same treatment the home
    page uses for its flow section. No glowing nodes, no animated connector. */
export default function Explainer({ items }: { items: Item[] }) {
  return (
    <div className="max-w-2xl">
      {items.map((s, i) => (
        <Reveal key={s.n} delay={i * 70}>
          <div className={`py-7 sm:py-8 ${i > 0 ? 'border-t border-white/[0.08]' : 'pt-0'}`}>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] tracking-[0.16em] text-purple-light tabular-nums">
                {s.n}
              </span>
              <span
                className="flex-1 h-px bg-gradient-to-r from-purple-accent/30 to-transparent"
                aria-hidden
              />
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-semibold tracking-tight text-white">
              {s.t}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-txt-dim leading-relaxed">
              {s.d}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

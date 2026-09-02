'use client';

/** Compact product mock — funded escrow. Sized to sit in a hero without overflow. */
export default function EscrowPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative w-full" aria-hidden>
      <div
        className="absolute -inset-6 blur-3xl opacity-35 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(34,211,238,0.2), transparent 70%)',
        }}
      />

      <div className="relative rounded-2xl border border-white/[0.1] bg-[#0e0e14] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-ok shrink-0" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-txt-mute truncate">
              Escrow · #2841
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-md bg-ok/15 text-ok shrink-0">
            Funded
          </span>
        </div>

        <div className={`px-4 ${compact ? 'py-3.5' : 'py-4'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-medium text-white truncate">
                Brand site redesign
              </div>
              <div className="text-[11px] text-txt-mute mt-0.5 font-mono">
                Design · 14 days
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-semibold tabular-nums tracking-tight text-purple-light">
                2,400
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-txt-mute">
                USDC
              </div>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 min-w-0">
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-txt-mute">
                Client
              </div>
              <div className="mt-0.5 text-xs text-white font-mono tabular-nums truncate">
                0xA1c4…9f2E
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 min-w-0">
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-txt-mute">
                Freelancer
              </div>
              <div className="mt-0.5 text-xs text-white font-mono tabular-nums truncate">
                0x7B2d…c801
              </div>
            </div>
          </div>

          {/* Simple progress bar, not 4 labeled dots that clip on mobile */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-txt-mute mb-1.5">
              <span className="text-purple-light">Funded</span>
              <span>Awaiting delivery</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-accent"
                style={{ width: '50%' }}
              />
            </div>
          </div>

          {!compact && (
            <div className="mt-4 flex gap-2">
              <div className="flex-1 rounded-lg bg-white text-bg text-center text-xs font-medium py-2.5">
                Mark satisfied
              </div>
              <div className="flex-1 rounded-lg border border-white/10 text-txt-dim text-center text-xs font-medium py-2.5">
                Open chat
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

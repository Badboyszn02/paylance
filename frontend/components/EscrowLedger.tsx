'use client';

/** Settlement view of one escrow: what the client locks, what the fee takes,
    what the freelancer receives.
    Replaces the old node-and-edge diagram — the question people actually bring
    to /hire is "where does my money go and what does the 2% cost me", which
    figures answer and abstract circles do not. */

const AMOUNT = 2400;
const FEE_RATE = 0.02;

const usd = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Row({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'muted' | 'strong';
}) {
  const valueTone =
    tone === 'strong'
      ? 'text-purple-light font-semibold'
      : tone === 'muted'
        ? 'text-txt-dim'
        : 'text-white';
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={`text-[13px] ${tone === 'strong' ? 'text-white' : 'text-txt-dim'}`}>
        {label}
      </dt>
      <dd className={`text-[13px] font-mono tabular-nums shrink-0 ${valueTone}`}>{value}</dd>
    </div>
  );
}

export default function EscrowLedger() {
  const fee = AMOUNT * FEE_RATE;
  const net = AMOUNT - fee;

  return (
    <figure className="relative w-full m-0">
      <div
        aria-hidden
        className="absolute -inset-6 blur-3xl opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 70%, rgba(34,211,238,0.18), transparent 70%)',
        }}
      />

      <div className="relative rounded-2xl border border-white/[0.1] bg-[#0e0e14] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-ok shrink-0" aria-hidden />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-txt-mute truncate">
              Escrow · #2841
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-md bg-ok/15 text-ok shrink-0">
            Funded
          </span>
        </div>

        <div className="px-4 py-4">
          {/* What the job is */}
          <div className="text-[15px] font-medium text-white">Brand site redesign</div>
          <div className="text-[11px] text-txt-mute mt-0.5 font-mono">Design · 14 days</div>

          {/* The money */}
          <dl className="mt-4 border-t border-white/[0.06] pt-1">
            <Row label="You lock" value={usd(AMOUNT)} />
            <Row label="Held on Arc" value="in contract" tone="muted" />
            <Row label={`Platform fee (${FEE_RATE * 100}%)`} value={`−${usd(fee)}`} />
            <div className="border-t border-white/[0.08] mt-1 pt-1">
              <Row label="Freelancer receives" value={usd(net)} tone="strong" />
            </div>
          </dl>

          {/* Where it is in the lifecycle */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-txt-mute mb-1.5">
              <span className="text-purple-light">Funded</span>
              <span>Awaiting delivery</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-purple-accent" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-[11px] text-txt-mute leading-relaxed">
        Example settlement. Funds stay in the contract until both sides release.
      </figcaption>
    </figure>
  );
}

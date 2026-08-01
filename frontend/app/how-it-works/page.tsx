import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import EscrowLedger from '@/components/EscrowLedger';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How PayLance escrow works: agree on scope, lock USDC on Arc, release when both sides are satisfied. Flat 2% fee, deducted on chain.',
};

const FLOW = [
  {
    n: '01',
    t: 'Post or hire',
    d: 'List a service, or describe a job and let the matcher rank freelancers by fit, rating and price. Scope and price are agreed before anyone starts work.',
  },
  {
    n: '02',
    t: 'Lock USDC',
    d: 'Both sides hit Agree in the order chat. The client funds a per-order escrow contract on Arc. The freelancer can verify the money is real before opening a file.',
  },
  {
    n: '03',
    t: 'Release together',
    d: 'Both sides mark the order satisfied and funds pay out on chain, minus the flat 2% fee. Neither side can move the money alone.',
  },
];

const LIFECYCLE = [
  { s: 'Offer sent', d: 'The hirer opens an order at the price they want to pay.' },
  { s: 'Negotiating', d: 'Scope and timeline get settled in chat. Only the hirer can change the price, and each change resets the freelancer’s acceptance.' },
  { s: 'Accepted', d: 'The freelancer agrees at the current price. The order is ready to fund.' },
  { s: 'Funded', d: 'The hirer locks the agreed USDC in an escrow contract on Arc.' },
  { s: 'In progress', d: 'Work happens. The funds sit in the contract, visible to both sides.' },
  { s: 'Delivered', d: 'The freelancer submits the delivery in chat.' },
  { s: 'Reviewing', d: 'The client checks the work against the agreed scope.' },
  { s: 'Completed', d: 'Both mark it satisfied. Funds release to the freelancer, minus the fee.' },
];

const GUARANTEES = [
  {
    t: 'Money is visible',
    d: 'Funds sit in a contract both parties can inspect on Arcscan, not in a private platform balance.',
  },
  {
    t: 'Release is mutual',
    d: 'There is no one-sided payout and no admin button that quietly moves funds. Work is done when both sides say it is.',
  },
  {
    t: 'Fee is flat',
    d: 'Two percent on release, deducted on chain. No subscription, no listing fee, no withdrawal fee.',
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        eyebrow="How it works"
        title="Escrow, in plain terms."
        sub="PayLance holds the client's USDC in an on-chain contract until both sides agree the work is done. This page covers the flow, the order states, the fee, and what happens when something goes wrong."
      />

      {/* The three steps */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-16 sm:pb-20 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {FLOW.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div
                className={`relative py-7 md:py-0 md:px-6 lg:px-8
                  ${i > 0 ? 'border-t md:border-t-0 md:border-l border-white/[0.08]' : ''}
                  ${i === 0 ? 'md:pl-0' : ''}
                  ${i === FLOW.length - 1 ? 'md:pr-0' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tracking-[0.16em] text-purple-light tabular-nums">
                    {s.n}
                  </span>
                  {i < FLOW.length - 1 && (
                    <span
                      className="hidden md:block flex-1 h-px bg-gradient-to-r from-purple-accent/40 to-transparent"
                      aria-hidden
                    />
                  )}
                </div>
                <h2 className="mt-4 text-lg sm:text-xl font-semibold tracking-tight">{s.t}</h2>
                <p className="mt-2 text-sm sm:text-base text-txt-dim leading-relaxed">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What the money does */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">
          <div className="min-w-0">
            <Reveal>
              <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
                The money
              </p>
              <h2 className="text-[1.65rem] sm:text-3xl font-semibold tracking-tight leading-snug max-w-md">
                Where every dollar sits, at every moment.
              </h2>
              <p className="mt-4 text-txt-dim text-sm sm:text-base leading-relaxed max-w-xl">
                The client funds one escrow contract per order. Until release, the balance belongs
                to neither side — the freelancer cannot withdraw it and the client cannot claw it
                back. Gas on Arc is paid in USDC, so there is no second token to acquire.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {GUARANTEES.map((p, i) => (
                <Reveal key={p.t} delay={i * 60}>
                  <div className="sm:border-l sm:border-white/[0.08] sm:pl-5 first:sm:border-l-0 first:sm:pl-0">
                    <h3 className="text-base font-semibold tracking-tight text-white">{p.t}</h3>
                    <p className="mt-2 text-sm text-txt-dim leading-relaxed">{p.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="lg:sticky lg:top-24">
            <EscrowLedger />
          </Reveal>
        </div>
      </section>

      {/* Order lifecycle */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-start">
          <Reveal className="lg:sticky lg:top-24">
            <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
              Order states
            </p>
            <h2 className="text-[1.65rem] sm:text-3xl font-semibold tracking-tight leading-snug max-w-sm">
              Eight states, start to payout.
            </h2>
            <p className="mt-4 text-sm text-txt-dim leading-relaxed max-w-sm">
              Every order moves through the same sequence. You can see which state an order is in
              from your dashboard at any time.
            </p>
          </Reveal>

          <ol className="min-w-0">
            {LIFECYCLE.map((l, i) => (
              <Reveal key={l.s} delay={Math.min(i * 40, 240)}>
                <li
                  className={`flex gap-4 sm:gap-5 py-4 ${
                    i > 0 ? 'border-t border-white/[0.06]' : 'pt-0'
                  }`}
                >
                  <span className="font-mono text-[11px] text-purple-light tabular-nums shrink-0 w-6 pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-medium text-white">{l.s}</div>
                    <p className="text-sm text-txt-dim mt-1 leading-relaxed">{l.d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Edge cases */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
        <Reveal>
          <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
            When it goes wrong
          </p>
          <h2 className="text-[1.65rem] sm:text-3xl font-semibold tracking-tight leading-snug max-w-lg">
            Cancellations and disputes.
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-3xl">
          <Reveal>
            <h3 className="text-base font-semibold tracking-tight text-white">Cancelling</h3>
            <p className="mt-2 text-sm text-txt-dim leading-relaxed">
              Both parties have to agree to cancel. If the order was already funded, the escrow
              refunds the client in full — the platform fee only applies on a successful release.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h3 className="text-base font-semibold tracking-tight text-white">Disputes</h3>
            <p className="mt-2 text-sm text-txt-dim leading-relaxed">
              If you cannot agree, Support Care can resolve the order and split the escrowed amount
              between both sides. The same flat 2% applies, deducted on chain at resolution.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug">
                  Try it with test USDC.
                </h2>
                <p className="mt-3 text-txt-dim text-sm sm:text-base leading-relaxed">
                  PayLance runs on Arc testnet. Connect a wallet, grab test funds from Circle, and
                  run a real escrow end to end.{' '}
                  <Link href="/docs" className="text-purple-light hover:text-white transition-colors">
                    Full docs
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button href="/explore" className="w-full sm:w-auto px-7">
                  Browse listings
                </Button>
                <Button variant="ghost" href="/hire" className="w-full sm:w-auto px-7">
                  Post a job
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

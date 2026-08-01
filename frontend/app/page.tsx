'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { usdc } from '@/lib/format';
import { Button } from '@/components/ui';
import CategoryGrid from '@/components/CategoryGrid';
import FreelancerCard from '@/components/FreelancerCard';
import CountUp from '@/components/CountUp';
import Reveal from '@/components/Reveal';
import EscrowPreview from '@/components/EscrowPreview';
import type { Listing } from '@/lib/types';

interface Stats {
  freelancers: number | string;
  orders: number | string;
  usdc_paid: number | string;
  listings: number | string;
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="min-w-0 text-left">
      <div className="text-base sm:text-lg font-semibold text-white tabular-nums tracking-tight">
        {value}
      </div>
      <div className="text-[11px] text-txt-mute mt-0.5">{label}</div>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
      <div className="max-w-xl">
        {eyebrow && (
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-purple-light mb-3">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[1.65rem] sm:text-3xl font-semibold tracking-tight leading-snug">
          {title}
        </h2>
        {sub && (
          <p className="text-txt-dim mt-2 text-sm sm:text-base leading-relaxed max-w-md">
            {sub}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

const FLOW = [
  {
    n: '01',
    t: 'Post or hire',
    d: 'List a service or open a job. Scope and price are clear before anyone starts.',
  },
  {
    n: '02',
    t: 'Lock USDC',
    d: 'Agree in chat. The client funds escrow on Arc. The freelancer sees the money is real.',
  },
  {
    n: '03',
    t: 'Release together',
    d: 'Both mark satisfied. Funds pay out on-chain. Flat 2% fee. No surprises.',
  },
];

const PILLARS = [
  {
    t: 'Money is visible',
    d: 'Funds sit in a contract both parties can verify, not a private balance sheet.',
  },
  {
    t: 'Release is mutual',
    d: 'No one-sided payout. Work is done when both sides say it is.',
  },
  {
    t: 'Fee is flat',
    d: 'Two percent on release. No subscription. No tier gymnastics.',
  },
];

function FeaturedEmpty() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 sm:px-8 sm:py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div className="max-w-md">
        <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Be the first listing on Arc.
        </p>
        <p className="text-txt-dim mt-2 text-sm sm:text-base leading-relaxed">
          Offer a service or post a job. Escrow settles in USDC when both sides agree.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <Button href="/listing/new" className="w-full sm:w-auto">Post a listing</Button>
        <Button variant="ghost" href="/hire" className="w-full sm:w-auto">Post a job</Button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    api<{ listings: Listing[] }>('/api/listings?limit=6', { auth: false })
      .then((d) => {
        setFeatured(d.listings || []);
        const c: Record<string, number> = {};
        (d.listings || []).forEach((l) => {
          c[l.category] = (c[l.category] || 0) + 1;
        });
        setCounts(c);
      })
      .catch(() => {});
    api<Stats>('/api/stats', { auth: false }).then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ──
          Desktop: left copy + right product card, fits one screen.
          Mobile: stack copy → CTAs → compact card (no forced 100vh center). */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute top-0 right-0 w-[55vw] max-w-xl h-[70%] rounded-full blur-[100px] opacity-25"
            style={{
              background:
                'radial-gradient(circle at 70% 30%, rgba(34,211,238,0.35), transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-[40vw] max-w-md h-[50%] rounded-full blur-[90px] opacity-20"
            style={{
              background:
                'radial-gradient(circle at 30% 80%, rgba(8,145,178,0.3), transparent 70%)',
            }}
          />
        </div>

        <div
          className="relative max-w-container mx-auto px-5 sm:px-6 lg:px-8
            pt-10 pb-12 sm:pt-12 sm:pb-14
            lg:pt-14 lg:pb-16
            lg:min-h-[calc(100dvh-3.75rem)] lg:flex lg:flex-col lg:justify-center"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center">
            {/* Copy */}
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-purple-light">
                USDC escrow on Arc
              </p>
              <h1 className="mt-4 text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem] xl:text-[3rem] font-semibold tracking-tight leading-[1.08] max-w-[14ch]">
                Funds unlock only when both of you agree.
              </h1>
              <p className="mt-4 sm:mt-5 text-txt-dim text-sm sm:text-base leading-relaxed max-w-md">
                Hire freelancers and creators. Pay in USDC. Escrow holds every dollar until the work is done.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button href="/explore" className="w-full sm:w-auto px-6">
                  Browse listings
                </Button>
                <Button variant="ghost" href="/hire" className="w-full sm:w-auto px-6">
                  Post a job
                </Button>
              </div>
              <p className="mt-6 text-xs text-txt-mute leading-relaxed max-w-sm">
                Wallet sign-in · 2% flat fee · On-chain on Arc
              </p>
            </div>

            {/* Product */}
            <div className="min-w-0 w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
              <EscrowPreview compact />
              {/* Stats under the card — only if we have signal; hide empty zeros on cold start */}
              {(Number(stats?.freelancers) > 0 ||
                Number(stats?.orders) > 0 ||
                Number(stats?.usdc_paid) > 0) && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Stat
                    value={<CountUp end={Number(stats?.freelancers) || 0} />}
                    label="Talent"
                  />
                  <Stat
                    value={<CountUp end={Number(stats?.orders) || 0} />}
                    label="Orders"
                  />
                  <Stat
                    value={
                      <CountUp
                        end={Number(stats?.usdc_paid) || 0}
                        format={(n) => usdc(n)}
                      />
                    }
                    label="Paid out"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── image tiles, no 01/02 numbering ── */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 border-t border-white/[0.06]">
        <Reveal>
          <SectionHead
            title="What you can hire"
            sub="Six categories. Same escrow rules on every deal."
            action={
              <Link
                href="/explore"
                className="text-sm text-purple-light hover:text-white transition-colors min-h-[44px] inline-flex items-center shrink-0"
              >
                All listings →
              </Link>
            }
          />
        </Reveal>
        <Reveal delay={50}>
          <CategoryGrid counts={counts} />
        </Reveal>
      </section>

      {/* ── How it works ── timeline tied to the product metaphor ── */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-white/[0.06] bg-white/[0.015]"
      >
        <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
          <Reveal>
            <SectionHead
              eyebrow="Flow"
              title="Three steps. One contract."
              sub="From brief to payout without guessing where the money is."
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0">
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
                  <h3 className="mt-4 text-lg sm:text-xl font-semibold tracking-tight">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-txt-dim leading-relaxed max-w-xs">
                    {s.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why it holds ── three pillars, not equal feature cards ── */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
        <Reveal>
          <SectionHead
            title="Built for trust, not for hope."
            sub="Escrow is the product. Everything else is discovery around it."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} delay={i * 60}>
              <div className="sm:border-l sm:border-white/[0.08] sm:pl-6 first:sm:border-l-0 first:sm:pl-0">
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                  {p.t}
                </h3>
                <p className="mt-2 text-sm text-txt-dim leading-relaxed max-w-xs">
                  {p.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Featured ── */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
        <Reveal>
          <SectionHead
            title="Featured listings"
            sub="Services and jobs live on the network right now."
            action={
              featured.length > 0 ? (
                <Link
                  href="/explore"
                  className="text-sm text-purple-light hover:text-white transition-colors min-h-[44px] inline-flex items-center shrink-0"
                >
                  View all →
                </Link>
              ) : undefined
            }
          />
        </Reveal>
        {featured.length === 0 ? (
          <Reveal delay={40}>
            <FeaturedEmpty />
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {featured.map((l, i) => (
              <Reveal key={l.id} delay={i * 45}>
                <FreelancerCard listing={l} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── Testnet ── product-panel language like the escrow card ── */}
      <section id="testnet" className="scroll-mt-20 max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="rounded-2xl border border-white/[0.1] overflow-hidden bg-[#0c0c12]">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="px-5 py-8 sm:px-8 sm:py-10 lg:py-12 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
              <Reveal>
                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-purple-light">
                  Arc testnet
                </p>
                <h2 className="mt-3 text-xl sm:text-2xl lg:text-[1.75rem] font-semibold tracking-tight leading-snug max-w-sm">
                  Run a real escrow with test USDC.
                </h2>
                <p className="mt-3 text-txt-dim text-sm sm:text-base leading-relaxed max-w-md">
                  Connect a wallet, grab test funds from Circle, post or hire. Gas on Arc is paid in USDC.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Button href="/explore" className="w-full sm:w-auto">
                    Browse listings
                  </Button>
                  <a
                    href="https://faucet.circle.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-sm font-medium rounded-md whitespace-nowrap
                      border border-line text-white hover:bg-white/5 active:scale-[0.98] transition-all w-full sm:w-auto"
                  >
                    Open faucet
                  </a>
                </div>
              </Reveal>
            </div>

            <ol className="px-5 py-8 sm:px-8 sm:py-10 lg:py-12 flex flex-col justify-center gap-0">
              {[
                {
                  t: 'Connect a wallet',
                  d: 'MetaMask, Rabby, or any EVM wallet.',
                },
                {
                  t: 'Switch to Arc',
                  d: 'PayLance prompts if the network is missing.',
                },
                {
                  t: 'Fund test USDC',
                  d: (
                    <>
                      Request from{' '}
                      <a
                        href="https://faucet.circle.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-light underline underline-offset-4 hover:text-white"
                      >
                        faucet.circle.com
                      </a>
                    </>
                  ),
                },
                {
                  t: 'Post or hire',
                  d: (
                    <>
                      Track txs on{' '}
                      <a
                        href="https://testnet.arcscan.app"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-light underline underline-offset-4 hover:text-white"
                      >
                        arcscan
                      </a>
                    </>
                  ),
                },
              ].map((s, i) => (
                <Reveal key={s.t} delay={i * 40}>
                  <li
                    className={`flex gap-4 py-3.5 ${
                      i > 0 ? 'border-t border-white/[0.06]' : ''
                    }`}
                  >
                    <span className="font-mono text-[11px] text-purple-light tabular-nums shrink-0 w-6 pt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{s.t}</div>
                      <p className="text-sm text-txt-dim mt-0.5 leading-relaxed">{s.d}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Close ── single clear end, no third repeat of the same pitch ── */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug">
                  Hire with certainty.
                </h2>
                <p className="mt-3 text-txt-dim text-sm sm:text-base leading-relaxed">
                  Connect a wallet. Browse talent. Lock USDC only when you are ready.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button href="/explore" className="w-full sm:w-auto px-7">
                  Browse listings
                </Button>
                <Button variant="ghost" href="/listing/new" className="w-full sm:w-auto px-7">
                  Post a listing
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

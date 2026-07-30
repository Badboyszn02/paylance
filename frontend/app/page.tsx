'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { usdc } from '@/lib/format';
import { Button, Pill, SectionTitle } from '@/components/ui';
import CategoryGrid from '@/components/CategoryGrid';
import FreelancerCard from '@/components/FreelancerCard';
import HeroBackdrop from '@/components/HeroBackdrop';
import FactStrip from '@/components/FactStrip';
import ArtPanel from '@/components/ArtPanel';
import CountUp from '@/components/CountUp';
import Reveal from '@/components/Reveal';
import Photo from '@/components/Photo';
import MarketplaceDiagram from '@/components/MarketplaceDiagram';
import EscrowDiagram from '@/components/EscrowDiagram';
import PlatformDiagram from '@/components/PlatformDiagram';
import TestnetDiagram from '@/components/TestnetDiagram';
import type { Listing } from '@/lib/types';

interface Stats {
  freelancers: number | string;
  orders: number | string;
  usdc_paid: number | string;
  listings: number | string;
}

function Stat({ value, label, sub }: { value: ReactNode; label: string; sub?: string }) {
  return (
    <div className="relative min-w-0">
      <div className="text-2xl sm:text-3xl md:text-4xl font-medium text-purple-light tabular-nums">{value}</div>
      <div className="text-sm text-txt-dim mt-1.5 sm:mt-2">{label}</div>
      {sub && (
        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-txt-mute font-mono mt-1.5 sm:mt-2">
          {sub}
        </div>
      )}
    </div>
  );
}

const STEPS = [
  {
    n: '01',
    t: 'Describe what you need',
    d: 'Browse six categories (Design, Writing, Marketing, Video, AI, Influencer) or search in plain English. PayLance surfaces freelancers and creators who fit the brief.',
    img: '/images/step-brief.jpg',
    alt: 'Close-up of hands writing in a notebook',
  },
  {
    n: '02',
    t: 'Agree and fund escrow',
    d: 'Set the price in chat. Once both sides agree, USDC locks into an escrow contract on Arc so the freelancer can see the funds are real before starting.',
    img: '/images/step-escrow.jpg',
    alt: 'Close-up of a handshake',
  },
  {
    n: '03',
    t: 'Release on satisfaction',
    d: 'When both mark the order done, funds release on-chain. Flat 2% platform fee. Disputes go to Support Care with a transparent split.',
    img: '/images/step-release.jpg',
    alt: 'Digital wallet app on a smartphone',
  },
];

const MOBILE_FLOW = [
  { t: 'Post', d: 'Job or service listing' },
  { t: 'Agree', d: 'Scope and price' },
  { t: 'Fund', d: 'USDC locks on Arc' },
  { t: 'Release', d: 'Both sides satisfied' },
];

function FeaturedEmpty() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-white/[0.02] px-5 py-10 sm:px-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.25), transparent 70%)' }}
      />
      <div className="relative max-w-lg">
        <div className="font-display italic text-xl sm:text-2xl text-white leading-snug">
          No listings yet. Be the first.
        </div>
        <p className="text-txt-dim mt-3 text-sm sm:text-base leading-relaxed">
          Post a service or a job. Escrow settles in USDC on Arc either way.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          <Button href="/listing/new" className="w-full sm:w-auto">Post a listing</Button>
          <Button variant="ghost" href="/hire" className="w-full sm:w-auto">Post a job</Button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    api<{ listings: Listing[] }>('/api/listings?limit=6', { auth: false }).then((d) => {
      setFeatured(d.listings || []);
      const c: Record<string, number> = {};
      (d.listings || []).forEach((l) => { c[l.category] = (c[l.category] || 0) + 1; });
      setCounts(c);
    }).catch(() => {});
    api<Stats>('/api/stats', { auth: false }).then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <div className="hidden sm:block sticky top-14 sm:top-16 z-30 bg-bg">
        <FactStrip />
      </div>

      {/* Hero */}
      <section className="relative">
        <HeroBackdrop />

        {/* Mobile-first hero: message + CTAs first, then compact flow */}
        <div className="relative max-w-container mx-auto px-4 sm:px-5 pt-10 sm:pt-16 md:pt-20 pb-10 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-10 lg:gap-16 xl:gap-20 items-start lg:items-center">
            <div>
              <Pill>Built on Arc</Pill>
              <h1 className="text-[1.65rem] leading-[1.2] sm:text-3xl md:text-4xl mt-5 sm:mt-7 max-w-xl sm:leading-snug tracking-tight">
                Hire a freelancer. Funds lock until{' '}
                <span className="font-display italic text-purple-light pb-0.5">you both agree</span>{' '}
                the work is done.
              </h1>
              <p className="text-txt-dim mt-4 sm:mt-6 max-w-xl text-[0.95rem] sm:text-lg leading-relaxed">
                Post a job, fund the escrow, get the work, release the payment. All in USDC on Arc.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-7 sm:mt-9">
                <Button href="/explore" className="w-full sm:w-auto">Browse listings</Button>
                <Button variant="ghost" href="/hire" className="w-full sm:w-auto">Post a job</Button>
              </div>

              {/* Mobile-only compact flow (avoids tall SVG diagrams above the fold) */}
              <div className="mt-8 lg:hidden">
                <div className="font-mono uppercase tracking-[0.16em] text-[10px] text-purple-light mb-3">
                  How a job becomes a payment
                </div>
                <ol className="grid grid-cols-2 gap-2.5">
                  {MOBILE_FLOW.map((s, i) => (
                    <li
                      key={s.t}
                      className="rounded-lg border border-line bg-white/[0.02] px-3 py-3"
                    >
                      <div className="font-mono text-[10px] tabular-nums text-txt-mute mb-1">
                        0{i + 1}
                      </div>
                      <div className="text-sm font-medium text-white">{s.t}</div>
                      <div className="text-xs text-txt-dim mt-0.5 leading-snug">{s.d}</div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Desktop escrow deep-dive */}
              <div className="mt-12 max-w-sm hidden lg:block">
                <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-purple-light mb-4">
                  How a job becomes a payment
                </div>
                <div className="max-w-[240px]">
                  <EscrowDiagram compact />
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  <div>
                    <div className="font-medium text-white text-sm">Lock USDC</div>
                    <p className="text-sm text-txt-dim mt-1 leading-relaxed">
                      The client locks the agreed USDC into the escrow contract. It leaves their wallet but is not the freelancer&apos;s yet.
                    </p>
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">Release</div>
                    <p className="text-sm text-txt-dim mt-1 leading-relaxed">
                      When both confirm the work is done, the escrow pays the freelancer minus the 2% fee. Disputes go to Support Care.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop platform diagram column */}
            <div className="hidden lg:block">
              <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-purple-light mb-5">
                How the platform works
              </div>
              <PlatformDiagram />
              <div className="mt-6 flex flex-col gap-4">
                <div>
                  <div className="font-medium text-white text-sm">01 · Post</div>
                  <p className="text-sm text-txt-dim mt-1 leading-relaxed">
                    A hirer posts a job at a set price, or a freelancer lists a service. It is recorded on Arc and shows in Listings.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-white text-sm">02 · Agree</div>
                  <p className="text-sm text-txt-dim mt-1 leading-relaxed">
                    Both sides chat to confirm scope. The hirer can adjust the price, then both hit Agree to lock the deal.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-white text-sm">03 · Fund</div>
                  <p className="text-sm text-txt-dim mt-1 leading-relaxed">
                    The hirer&apos;s wallet locks the USDC into an escrow contract on Arc. The freelancer sees the funds are real before starting.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-white text-sm">04 · Release</div>
                  <p className="text-sm text-txt-dim mt-1 leading-relaxed">
                    When both mark the work done, the contract pays the freelancer and takes the flat 2% fee, automatically on-chain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats: 3-col from sm, tight on mobile */}
        <div className="relative max-w-container mx-auto px-4 sm:px-5 pt-6 pb-12 sm:pt-10 sm:pb-16 md:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-7 sm:gap-6 border-t border-line pt-8 sm:pt-10">
            <Reveal>
              <Stat
                value={<CountUp end={Number(stats?.freelancers) || 0} />}
                label="Freelancers and creators"
                sub="across six categories"
              />
            </Reveal>
            <Reveal delay={100}>
              <Stat
                value={<CountUp end={Number(stats?.orders) || 0} />}
                label="Orders created"
                sub="settled on chain"
              />
            </Reveal>
            <Reveal delay={200}>
              <Stat
                value={<CountUp end={Number(stats?.usdc_paid) || 0} format={(n) => usdc(n)} />}
                label="Paid out on Arc"
                sub="2% flat platform fee"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-container mx-auto px-4 sm:px-5 py-12 sm:py-16 md:py-24">
        <Reveal>
          <SectionTitle sub="Six categories cover every kind of work you can hire for on PayLance.">
            What you can hire
          </SectionTitle>
        </Reveal>
        <Reveal delay={100}>
          <CategoryGrid counts={counts} />
        </Reveal>
      </section>

      {/* Featured */}
      <section className="max-w-container mx-auto px-4 sm:px-5 py-12 sm:py-16 md:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
            <SectionTitle sub="A live look at the top-rated listings across the platform.">
              Featured listings
            </SectionTitle>
            {featured.length > 0 && (
              <Link
                href="/explore"
                className="group inline-flex items-center gap-1.5 text-sm text-purple-light hover:text-white transition-colors mb-8 sm:mb-10 min-h-[44px]"
              >
                View all
                <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}
          </div>
        </Reveal>
        {featured.length === 0 ? (
          <Reveal delay={80}>
            <FeaturedEmpty />
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-8">
            {featured.map((l, i) => (
              <Reveal key={l.id} delay={i * 80}>
                <FreelancerCard listing={l} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <ArtPanel height="sm" />

      {/* How it works */}
      <section id="how-it-works" className="max-w-container mx-auto px-4 sm:px-5 py-12 sm:py-16 md:py-24">
        <Reveal>
          <SectionTitle sub="Three steps from posting to release. Every payment is on-chain and verifiable.">
            How it works
          </SectionTitle>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mt-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="relative">
                <Photo src={s.img} alt={s.alt} />
                <div className="mt-5 sm:mt-6">
                  <div className="font-mono tabular-nums text-purple-light text-xs tracking-[0.18em]">
                    {s.n}
                  </div>
                  <div className="font-display italic text-xl sm:text-2xl mt-2 sm:mt-3 leading-tight">{s.t}</div>
                  <p className="text-[0.95rem] sm:text-base text-txt-dim mt-2.5 sm:mt-3 leading-relaxed">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Testnet guide */}
      <section id="testnet" className="max-w-container mx-auto px-4 sm:px-5 py-12 sm:py-16 md:py-24">
        <Reveal>
          <div className="mb-8 sm:mb-12">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
              Testnet guide
            </div>
            <h2 className="text-xl sm:text-2xl font-medium max-w-2xl leading-snug tracking-tight">
              Try PayLance on the <span className="font-display italic text-purple-light pb-0.5">Arc testnet</span>.
            </h2>
            <p className="text-txt-dim mt-3 sm:mt-4 max-w-2xl text-[0.95rem] sm:text-base leading-relaxed">
              Post a listing, hire a freelancer, and settle a real escrow with testnet USDC. Gas on Arc is paid in USDC, so you only need a wallet and a small faucet balance.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16 xl:gap-20 items-start">
          <Reveal>
            <div className="hidden lg:block lg:sticky lg:top-28">
              <TestnetDiagram />
              <div className="mt-5 font-mono uppercase tracking-[0.18em] text-[10px] text-txt-mute text-center">
                Five steps · top to bottom
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col">
            {[
              {
                n: '01',
                t: 'Install a wallet',
                d: (
                  <>
                    Use MetaMask, Rabby, or any wallet that supports custom EVM chains. Create or import an account, then come back to PayLance.
                  </>
                ),
              },
              {
                n: '02',
                t: 'Add Arc and switch to it',
                d: (
                  <>
                    Tap <span className="text-white">Connect wallet</span> in the menu. If your wallet does not have Arc yet, PayLance will prompt to add it. Approve, then keep Arc selected.
                  </>
                ),
              },
              {
                n: '03',
                t: 'Get testnet USDC from the faucet',
                d: (
                  <>
                    Open the Circle faucet at{' '}
                    <a
                      href="https://faucet.circle.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-light underline underline-offset-4 hover:text-white break-all"
                    >
                      faucet.circle.com
                    </a>
                    , paste your address, pick Arc, and request USDC.
                  </>
                ),
              },
              {
                n: '04',
                t: 'Post a listing or hire someone',
                d: (
                  <>
                    Posting a listing signs one small registration tx. Hiring deploys an escrow and locks USDC. Both prompts come from your wallet; both pay gas in USDC.
                  </>
                ),
              },
              {
                n: '05',
                t: 'Settle on release',
                d: (
                  <>
                    When both sides mark the order satisfied, the contract releases USDC and deducts the 2% fee on-chain. Follow txs on{' '}
                    <a
                      href="https://testnet.arcscan.app"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-light underline underline-offset-4 hover:text-white break-all"
                    >
                      testnet.arcscan.app
                    </a>
                    .
                  </>
                ),
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 70}>
                <div className="py-5 sm:py-6 border-b border-line last:border-b-0">
                  <div className="flex items-start sm:items-baseline gap-3 sm:gap-5">
                    <div className="font-mono tabular-nums text-purple-light text-xs tracking-[0.18em] shrink-0 w-7 pt-0.5 sm:pt-0">
                      {s.n}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display italic text-lg sm:text-xl leading-tight">{s.t}</div>
                      <p className="text-[0.95rem] sm:text-base text-txt-dim mt-2 sm:mt-3 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={400}>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-8 sm:gap-y-3 text-sm">
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center sm:justify-start gap-1.5 min-h-[44px] text-purple-light hover:text-white transition-colors"
                >
                  Open the faucet
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </a>
                <a
                  href="https://testnet.arcscan.app"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center sm:justify-start gap-1.5 min-h-[44px] text-purple-light hover:text-white transition-colors"
                >
                  View on arcscan
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </a>
                <Link
                  href="/docs"
                  className="group inline-flex items-center justify-center sm:justify-start gap-1.5 min-h-[44px] text-purple-light hover:text-white transition-colors"
                >
                  Read the docs
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="max-w-container mx-auto px-4 sm:px-5 py-12 sm:py-16 md:py-24">
        <Reveal>
          <div className="mb-8 sm:mb-10">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
              The platform
            </div>
            <h2 className="text-xl sm:text-2xl font-medium max-w-2xl leading-snug tracking-tight">
              Two sides, <span className="font-display italic text-purple-light pb-0.5">one escrow</span>.
            </h2>
            <p className="text-txt-dim mt-3 sm:mt-4 max-w-2xl text-[0.95rem] sm:text-base leading-relaxed">
              Freelancers and creators post listings. Clients browse and hire. Both meet at the escrow contract on Arc until both sides agree the work is done.
            </p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[280px]">
              <MarketplaceDiagram />
            </div>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center sm:justify-center gap-3">
            <Button href="/explore" className="w-full sm:w-auto">Browse listings</Button>
            <Button variant="ghost" href="/listing/new" className="w-full sm:w-auto">Post a listing</Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

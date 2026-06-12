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
    <div className="relative">
      <div className="text-3xl md:text-4xl font-medium text-purple-light tabular-nums">{value}</div>
      <div className="text-sm text-txt-dim mt-2">{label}</div>
      {sub && (
        <div className="text-[11px] uppercase tracking-[0.18em] text-txt-mute font-mono mt-2">
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
    d: 'Browse six categories (Design, Writing, Marketing, Video, AI, Influencer) or search in plain English. PayLance parses what you need into filters and surfaces the best-fit talent.',
    img: '/images/step-brief.jpg',
    alt: 'Close-up of hands writing in a notebook',
  },
  {
    n: '02',
    t: 'Agree and fund escrow',
    d: 'The hirer sets the price up front and can adjust it during chat. Once both sides hit Agree, the full payment in USDC locks into an on-chain escrow contract on the Arc network. The freelancer can see funds are real before starting.',
    img: '/images/step-escrow.jpg',
    alt: 'Close-up of a handshake',
  },
  {
    n: '03',
    t: 'Release on satisfaction',
    d: 'When both sides mark the order satisfied, funds release to the freelancer instantly. A flat 2% platform fee is deducted on-chain. Disputes are reviewed by Support Care and settled with a transparent split.',
    img: '/images/step-release.jpg',
    alt: 'Digital wallet app on a smartphone',
  },
];

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
      <div className="hidden sm:block sticky top-16 z-30 bg-bg">
        <FactStrip />
      </div>

      {/* Hero */}
      <section className="relative">
        <HeroBackdrop />
        <div className="relative max-w-container mx-auto px-5 pt-20 sm:pt-28 pb-14 sm:pb-20 grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-14 lg:gap-20 items-center">
          <div>
            <Pill>Built on Arc</Pill>
            <h1 className="text-2xl sm:text-3xl md:text-4xl mt-7 max-w-xl leading-snug">
              Hire a freelancer. Funds lock until{' '}
              <span className="font-display italic text-purple-light">you both agree</span>{' '}
              the work is done.
            </h1>
            <p className="text-txt-dim mt-6 max-w-xl text-base sm:text-lg leading-relaxed">
              Post a job, fund the escrow, get the work, release the payment. All in USDC on Arc.
            </p>
            <div className="flex flex-wrap gap-3 mt-9">
              <Button href="/explore">Browse listings</Button>
              <Button variant="ghost" href="/hire">Post a job</Button>
            </div>

            <div className="mt-12 max-w-sm">
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
                    The client locks the agreed USDC into the escrow contract. It leaves their wallet but is not the freelancer’s yet.
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

          <div>
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
                  The hirer’s wallet locks the USDC into an escrow contract on Arc. The freelancer sees the funds are real before starting.
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

        {/* Stats */}
        <div className="relative max-w-container mx-auto px-5 pt-10 pb-14 sm:pt-12 sm:pb-20 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
          <Reveal>
            <Stat
              value={<CountUp end={Number(stats?.freelancers) || 0} />}
              label="Freelancers and creators"
              sub="across six categories"
            />
          </Reveal>
          <Reveal delay={120}>
            <Stat
              value={<CountUp end={Number(stats?.orders) || 0} />}
              label="Orders created"
              sub="settled on chain"
            />
          </Reveal>
          <Reveal delay={240}>
            <Stat
              value={<CountUp end={Number(stats?.usdc_paid) || 0} format={(n) => usdc(n)} />}
              label="Paid out on Arc"
              sub="2% flat platform fee"
            />
          </Reveal>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-container mx-auto px-5 py-16 sm:py-24">
        <Reveal>
          <SectionTitle sub="Six categories cover every kind of work you can hire for on PayLance.">
            What you can hire
          </SectionTitle>
        </Reveal>
        <Reveal delay={120}>
          <CategoryGrid counts={counts} />
        </Reveal>
      </section>

      {/* Featured */}
      <section className="max-w-container mx-auto px-5 py-16 sm:py-24">
        <Reveal>
          <SectionTitle sub="A live look at the top-rated listings across the platform.">
            Featured listings
          </SectionTitle>
        </Reveal>
        {featured.length === 0 ? (
          <Reveal delay={100}>
            <p className="text-txt-dim">No listings yet.</p>
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

      <ArtPanel height="md" />

      {/* How it works */}
      <section id="how-it-works" className="max-w-container mx-auto px-5 py-16 sm:py-24">
        <Reveal>
          <SectionTitle sub="Three steps from posting to release. Every payment is on-chain and verifiable.">
            How it works
          </SectionTitle>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-10 mt-2">
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="relative">
                <Photo src={s.img} alt={s.alt} />
                <div className="mt-6">
                  <div className="font-mono tabular-nums text-purple-light text-xs tracking-[0.18em]">
                    {s.n}
                  </div>
                  <div className="font-display italic text-2xl mt-3 leading-tight">{s.t}</div>
                  <p className="text-base text-txt-dim mt-3 leading-relaxed">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Testnet guide, below How it works so a new visitor knows what to do next */}
      <section id="testnet" className="max-w-container mx-auto px-5 py-16 sm:py-24">
        <Reveal>
          <div className="mb-12">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
              Testnet guide
            </div>
            <h2 className="text-2xl font-medium max-w-2xl leading-snug">
              Try PayLance on the <span className="font-display italic text-purple-light">Arc testnet</span>.
            </h2>
            <p className="text-txt-dim mt-4 max-w-2xl leading-relaxed">
              PayLance is live on Arc testnet. You can post a listing, hire a freelancer, and settle a real escrow with testnet USDC. Gas on Arc is paid in USDC, so the only thing you need is a wallet and a small balance from the faucet.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 lg:gap-20 items-start">
          <Reveal>
            <div className="lg:sticky lg:top-32">
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
                    Click <span className="text-white">Connect wallet</span> in the top right. If your wallet does not have Arc yet, PayLance will prompt to add it. Approve, then make sure Arc is the selected network.
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
                      className="text-purple-light underline underline-offset-4 hover:text-white"
                    >
                      faucet.circle.com
                    </a>
                    , paste your address, pick Arc, and request USDC. A small amount is enough for several listings and one or two escrows.
                  </>
                ),
              },
              {
                n: '04',
                t: 'Post a listing or hire someone',
                d: (
                  <>
                    Posting a listing signs one small registration tx on the listing registry. Hiring a freelancer deploys an escrow contract and locks the agreed amount in USDC. Both prompts come from your wallet, both pay gas in USDC.
                  </>
                ),
              },
              {
                n: '05',
                t: 'Settle on release',
                d: (
                  <>
                    When both sides mark the order satisfied, the contract releases the USDC to the freelancer and deducts the 2% platform fee on-chain. You can follow every tx on{' '}
                    <a
                      href="https://testnet.arcscan.app"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-light underline underline-offset-4 hover:text-white"
                    >
                      testnet.arcscan.app
                    </a>
                    . Disputes route to Support Care.
                  </>
                ),
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="py-6 border-b border-line last:border-b-0">
                  <div className="flex items-baseline gap-5">
                    <div className="font-mono tabular-nums text-purple-light text-xs tracking-[0.18em] shrink-0 w-8">
                      {s.n}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display italic text-xl leading-tight">{s.t}</div>
                      <p className="text-base text-txt-dim mt-3 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={500}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 text-purple-light hover:text-white transition-colors"
                >
                  Open the faucet
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </a>
                <a
                  href="https://testnet.arcscan.app"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 text-purple-light hover:text-white transition-colors"
                >
                  View on arcscan
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </a>
                <Link
                  href="/docs"
                  className="group inline-flex items-center gap-1.5 text-purple-light hover:text-white transition-colors"
                >
                  Read the docs
                  <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The platform: marketplace diagram */}
      <section className="max-w-container mx-auto px-5 py-16 sm:py-24">
        <Reveal>
          <div className="mb-10">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
              The platform
            </div>
            <h2 className="text-2xl font-medium max-w-2xl leading-snug">
              Two sides, <span className="font-display italic text-purple-light">one escrow</span>.
            </h2>
            <p className="text-txt-dim mt-4 max-w-2xl leading-relaxed">
              Freelancers and creators post listings. Clients browse and hire. Both meet at the escrow contract on Arc, and funds stay locked there until both sides agree the work is done.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <MarketplaceDiagram />
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
            <Link href="/explore" className="group inline-flex items-center gap-1.5 text-purple-light hover:text-white transition-colors">
              Browse listings
              <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/listing/new" className="group inline-flex items-center gap-1.5 text-purple-light hover:text-white transition-colors">
              Post a listing
              <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

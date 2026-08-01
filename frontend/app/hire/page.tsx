'use client';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { friendly } from '@/lib/errors';
import { Button, Textarea, Field, Skeleton } from '@/components/ui';
import FreelancerCard from '@/components/FreelancerCard';
import PageHero from '@/components/PageHero';
import Explainer from '@/components/Explainer';
import EscrowLedger from '@/components/EscrowLedger';
import ArtPanel from '@/components/ArtPanel';
import Reveal from '@/components/Reveal';
import type { Listing } from '@/lib/types';

const HIRE_EXPLAINER = [
  {
    n: '01',
    t: 'How matching works',
    d: 'Type your job description in plain language. PayLance parses it for category, budget, delivery and platform constraints, then ranks freelancers or creators by fit, rating and price. You see matches before you commit to anything.',
  },
  {
    n: '02',
    t: 'How escrow protects both sides',
    d: 'You set the price up front and can adjust it during chat. Once both sides hit Agree, you lock the full payment into an on-chain escrow contract on Arc. The freelancer can see the funds are real before starting. You can see the work before releasing.',
  },
  {
    n: '03',
    t: 'Where the 2% goes',
    d: 'A flat platform fee, deducted on-chain at release time. It covers hosting, dispute mediation, the matching engine, and the smart-contract upkeep. No subscriptions, no listing fees, no hidden cuts.',
  },
];

/** Concrete briefs beat an empty box — one tap fills the field and shows the
    level of detail the matcher actually rewards. */
const BRIEF_EXAMPLES = [
  'Logo and brand identity under 400 USDC, delivered within 4 days.',
  'Two 60-second explainer videos for a wallet app, 1200 USDC budget.',
  'Technical writer for protocol docs, ~10 pages, paid on delivery.',
];

const MIN_BRIEF = 12;

function FormLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="font-mono tabular-nums text-[11px] tracking-[0.18em] text-purple-light">{n}</span>
      <span className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute">{children}</span>
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 rounded-xl border border-line bg-white/[0.015] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <div className="flex items-end justify-between pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export default function HirePage() {
  const toast = useToast();
  const resultsRef = useRef<HTMLElement>(null);

  const [brief, setBrief] = useState('');
  const [freelancers, setFreelancers] = useState<Listing[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const matchFreelancers = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = brief.trim();
    // Previously this returned silently, so an empty submit looked like a
    // dead button. Say what is wrong instead.
    if (q.length < MIN_BRIEF) {
      setBriefError(
        q.length === 0
          ? 'Describe the job before searching.'
          : 'Add a little more detail — deliverable, budget, or deadline.',
      );
      return;
    }
    setBriefError(null);
    setBusy(true);
    try {
      const { results } = await api<{ results: Listing[] }>(
        '/api/search', { method: 'POST', auth: false, body: { q } }
      );
      setFreelancers(results || []);
      // Matches render below the fold; take the user there.
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } catch (err) { toast.error(friendly(err)); }
    setBusy(false);
  };

  const showResults = busy || freelancers !== null;

  return (
    <div>
      <PageHero
        eyebrow="Hire"
        title="Post a job, get matched in seconds."
        sub="Describe what you need in plain language. PayLance ranks freelancers and creators by fit, rating and price. Settled in USDC, with funds held in escrow until you release."
      />

      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-16 sm:pb-20 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-16 items-start">
          {/* Form column */}
          <div className="min-w-0">
            <form onSubmit={matchFreelancers} className="max-w-2xl" noValidate>
              <FormLabel n="01">The job</FormLabel>
              <Field label="Describe the job">
                <Textarea
                  rows={5}
                  value={brief}
                  onChange={(e) => {
                    setBrief(e.target.value);
                    if (briefError) setBriefError(null);
                  }}
                  invalid={!!briefError}
                  aria-describedby={briefError ? 'brief-error' : 'brief-hint'}
                  placeholder="e.g. I need a top rated logo and brand identity under 400 USDC, delivered within 4 days."
                />
              </Field>

              {briefError ? (
                <p id="brief-error" role="alert" className="text-xs text-danger mt-2 leading-relaxed">
                  {briefError}
                </p>
              ) : (
                <p id="brief-hint" className="text-xs text-txt-mute mt-2 leading-relaxed">
                  Be specific about deliverables, deadline, and budget. The more constraints you give, the tighter the match list comes back.
                </p>
              )}

              <div className="mt-5">
                <span className="font-mono uppercase tracking-[0.16em] text-[10px] text-txt-mute block mb-2.5">
                  Try one
                </span>
                <div className="flex flex-wrap gap-2">
                  {BRIEF_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => { setBrief(ex); setBriefError(null); }}
                      className="text-left text-xs text-txt-dim border border-line rounded-full px-3.5 py-2 leading-snug
                        hover:text-white hover:border-white/20 transition-colors max-w-full"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="mt-7" disabled={busy}>
                {busy ? 'Matching…' : 'Find matches'}
              </Button>
            </form>
          </div>

          {/* Diagram column */}
          <Reveal className="lg:sticky lg:top-24">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-6">
              How a job becomes a payment
            </div>
            <EscrowLedger />
          </Reveal>
        </div>
      </section>

      {/* Matched results */}
      {showResults && (
        <section
          ref={resultsRef}
          className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-white/[0.06] scroll-mt-20"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
                Matches
              </p>
              <h2 className="text-[1.65rem] sm:text-3xl font-semibold tracking-tight leading-snug">
                {busy
                  ? 'Ranking your matches…'
                  : freelancers && freelancers.length > 0
                    ? `${freelancers.length} ${freelancers.length === 1 ? 'freelancer' : 'freelancers'} fit this brief.`
                    : 'Nothing fits this brief yet.'}
              </h2>
            </div>
          </div>

          {busy ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 3 }).map((_, i) => <MatchSkeleton key={i} />)}
            </div>
          ) : freelancers && freelancers.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 sm:px-10 sm:py-12">
              <div className="max-w-md">
                <p className="text-txt-dim text-sm sm:text-base leading-relaxed">
                  No one matched on category, budget and delivery together. Widen the
                  budget, stretch the deadline, or browse the full marketplace and
                  approach someone directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                  <Button href="/explore" className="w-full sm:w-auto">Browse all listings</Button>
                  <Button variant="ghost" href="/listing/new" className="w-full sm:w-auto">
                    Post a listing
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {(freelancers ?? []).map((l, i) => (
                <Reveal key={l.id} delay={Math.min(i * 45, 240)}>
                  <FreelancerCard listing={l} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}

      <ArtPanel height="sm" />

      {/* Explainer */}
      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-start">
          <Reveal className="lg:sticky lg:top-24">
            <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
              What you should know
            </p>
            <h2 className="text-[1.65rem] sm:text-3xl font-semibold tracking-tight leading-snug max-w-sm">
              Three things worth understanding before you fund.
            </h2>
          </Reveal>
          <Explainer items={HIRE_EXPLAINER} />
        </div>
      </section>
    </div>
  );
}

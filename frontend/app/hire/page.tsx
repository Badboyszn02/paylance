'use client';
import { useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { friendly } from '@/lib/errors';
import { Button, Textarea, Field } from '@/components/ui';
import FreelancerCard from '@/components/FreelancerCard';
import PageHero from '@/components/PageHero';
import Explainer from '@/components/Explainer';
import EscrowDiagram from '@/components/EscrowDiagram';
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

function FormLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="font-mono tabular-nums text-[11px] tracking-[0.18em] text-purple-light">{n}</span>
      <span className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute">{children}</span>
    </div>
  );
}

export default function HirePage() {
  const toast = useToast();

  const [brief, setBrief] = useState('');
  const [freelancers, setFreelancers] = useState<Listing[] | null>(null);
  const [busy, setBusy] = useState(false);

  const matchFreelancers = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!brief.trim()) return;
    setBusy(true);
    try {
      const { results } = await api<{ results: Listing[] }>(
        '/api/search', { method: 'POST', auth: false, body: { q: brief } }
      );
      setFreelancers(results || []);
    } catch (err) { toast.error(friendly(err)); }
    setBusy(false);
  };

  return (
    <div>
      <PageHero
        eyebrow="Hire"
        title={
          <>
            Post a job, get <span className="font-display italic text-purple-light">matched</span> in seconds.
          </>
        }
        sub="Describe what you need in plain language. PayLance ranks freelancers and creators by fit, rating and price. Settled in USDC, with funds held in escrow until you release."
      />

      <section className="max-w-container mx-auto px-5 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-16 items-start">
          {/* Form column */}
          <div>
            <form onSubmit={matchFreelancers} className="max-w-2xl">
              <FormLabel n="01">The job</FormLabel>
              <Field label="Describe the job">
                <Textarea
                  rows={5}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="e.g. I need a top rated logo and brand identity under 400 USDC, delivered within 4 days."
                />
              </Field>
              <p className="text-xs text-txt-mute mt-2 leading-relaxed">
                Be specific about deliverables, deadline, and budget. The more constraints you give, the tighter the match list comes back.
              </p>
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
            <EscrowDiagram />
          </Reveal>
        </div>
      </section>

      {/* Matched results */}
      {freelancers && (
        <section className="max-w-container mx-auto px-5 pb-16">
          <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute mb-6">
            Matches · {freelancers.length}
          </div>
          {freelancers.length === 0 ? (
            <p className="text-txt-dim">No matches found. Try a wider budget or a shorter description.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-8">
              {freelancers.map((l, i) => (
                <Reveal key={l.id} delay={i * 60}>
                  <FreelancerCard listing={l} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}

      <ArtPanel height="sm" />

      {/* Explainer */}
      <section className="max-w-container mx-auto px-5 py-16 sm:py-24">
        <Reveal>
          <div className="mb-10">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-3">
              What you should know
            </div>
            <h2 className="text-2xl font-medium">Three things worth understanding before you fund.</h2>
          </div>
        </Reveal>
        <Explainer items={HIRE_EXPLAINER} />
      </section>
    </div>
  );
}

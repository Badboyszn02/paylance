'use client';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Button, Input, Textarea, Select, Field, Skeleton } from '@/components/ui';
import PageHero from '@/components/PageHero';
import { CATEGORIES } from '@/components/CategoryGrid';
import { useWallet } from '@/lib/wallet';
import { registerListingOnChain } from '@/lib/listingChain';
import { friendly } from '@/lib/errors';

type Role = 'freelancer' | 'creator';
type Kind = 'service' | 'job';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
      {children}
    </div>
  );
}

function RolePick({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left transition-colors group ${active ? 'text-white' : 'text-txt-dim hover:text-white'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full border transition-colors ${active ? 'border-purple-accent bg-purple-accent' : 'border-line group-hover:border-white/30'}`} />
        <span className="font-medium">{label}</span>
      </div>
      <p className={`text-sm mt-2 ml-6 ${active ? 'text-txt-dim' : 'text-txt-mute'} leading-relaxed`}>{sub}</p>
    </button>
  );
}

export default function NewListingPage() {
  const { user, loading, refresh } = useAuth();
  const { address, chainOk, switchToArc } = useWallet();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'signing' | 'confirming' | 'saving'>('idle');

  const [kind, setKind] = useState<Kind>('service');
  const [role, setRole] = useState<Role>('freelancer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/');
  }, [user, loading, router]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    if (!address) { toast.error('Connect your wallet first'); return; }
    if (!chainOk) {
      try { await switchToArc(); } catch { toast.error('Switch your wallet to Arc to continue'); return; }
    }
    setBusy(true);
    setPhase('signing');
    try {
      // Only a service listing switches the poster's role; a job post keeps the hirer as-is.
      if (kind === 'service' && user.role === 'client') {
        const { token } = await api<{ role: Role; token: string }>('/api/profile/role', {
          method: 'POST',
          body: { role },
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('paylance_token', token);
        }
        await refresh();
      }

      const priceNum = Number(price);
      const days = Number(deliveryDays);

      // 1. Sign and confirm on-chain; this is the gas fee that supports Arc.
      setPhase('signing');
      const { txHash, listingHash } = await registerListingOnChain({
        title,
        description,
        price_usdc: priceNum,
        delivery_days: days,
        category,
        poster: address as `0x${string}`,
      });
      setPhase('confirming');

      // 2. Persist to the backend, which re-verifies the tx.
      setPhase('saving');
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const { listing } = await api<{ listing: { id: number } }>('/api/listings', {
        method: 'POST',
        body: {
          title,
          description,
          category,
          subcategory: subcategory || undefined,
          price_usdc: priceNum,
          delivery_days: days,
          tags: tagList.length ? tagList : undefined,
          kind,
          tx_hash: txHash,
          listing_hash: listingHash,
        },
      });
      toast.success(kind === 'job' ? 'Job posted on Arc' : 'Listing posted on Arc');
      router.push(`/listing/${listing.id}`);
    } catch (err) {
      toast.error(friendly(err));
      setBusy(false);
      setPhase('idle');
    }
  };

  const isJob = kind === 'job';
  const buttonLabel =
    phase === 'signing' ? 'Sign in wallet…' :
    phase === 'confirming' ? 'Confirming on Arc…' :
    phase === 'saving' ? 'Saving…' :
    busy ? 'Posting…' : (isJob ? 'Post job' : 'Post listing');

  return (
    <div>
      <PageHero
        quiet
        eyebrow="Post on PayLance"
        title={
          <>
            Offer a service or <span className="font-display italic text-purple-light">hire</span> someone.
          </>
        }
        sub="Pick whether you are offering work or looking to hire. Set the price in USDC and a delivery window. It appears on Browse the moment you post it."
      />

      {loading || !user ? (
        <section className="max-w-2xl mx-auto px-5 pb-16">
          <Skeleton className="h-96" />
        </section>
      ) : (
        <section className="max-w-2xl mx-auto px-5 pb-16 sm:pb-24">
          <form onSubmit={submit} className="flex flex-col gap-14">
            <div>
              <SectionLabel>What are you posting?</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                <RolePick
                  active={kind === 'service'}
                  onClick={() => setKind('service')}
                  label="Offering a service"
                  sub="You do the work. A client hires you and funds escrow at your price. You deliver, they release."
                />
                <RolePick
                  active={kind === 'job'}
                  onClick={() => setKind('job')}
                  label="Looking to hire"
                  sub="You need work done. Freelancers apply, you fund escrow at your budget, they deliver, you release."
                />
              </div>
            </div>

            {kind === 'service' && user.role === 'client' && (
              <div>
                <SectionLabel>Posting as</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                  <RolePick
                    active={role === 'freelancer'}
                    onClick={() => setRole('freelancer')}
                    label="Freelancer"
                    sub="Designers, writers, marketers, video editors, AI services. Charge by the deliverable."
                  />
                  <RolePick
                    active={role === 'creator'}
                    onClick={() => setRole('creator')}
                    label="Creator"
                    sub="Influencers running sponsored posts. Charge a per-post rate based on audience and platform."
                  />
                </div>
                <p className="text-xs text-txt-mute mt-5 leading-relaxed">
                  Your account role will switch when you post. You can change it back from Settings any time.
                </p>
              </div>
            )}

            <div>
              <SectionLabel>Basics</SectionLabel>
              <div className="flex flex-col gap-4">
                <Field label="Title" hint={isJob ? 'Short and concrete. e.g. Need a logo for my coffee brand' : 'Short and concrete. e.g. Brand identity for early-stage startups'}>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder={isJob ? 'Need a logo for my coffee brand' : 'Brand identity for early-stage startups'}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Category">
                    <Select required value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Select…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Subcategory" hint="Optional">
                    <Input
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="e.g. Logo design"
                      maxLength={60}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>{isJob ? 'The job' : 'Your service'}</SectionLabel>
              <div className="flex flex-col gap-4">
                <Field label="Description" hint={isJob ? 'What you need done, what to deliver, and any details the freelancer should know' : 'What is included, what is not, what details you need from the client'}>
                  <Textarea
                    required
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={5000}
                    placeholder={isJob
                      ? 'I need three logo concepts for a new coffee brand, two rounds of revisions, final files in vector. I will share the brand name and three adjectives once we start.'
                      : 'Three logo concepts, two rounds of revisions, final files in vector and raster. To get started I need a one-line mission and three brand adjectives.'}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={isJob ? 'Your budget (USDC)' : 'Starting price (USDC)'}>
                    <Input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="200"
                    />
                  </Field>
                  <Field label={isJob ? 'Deadline (days)' : 'Delivery (days)'}>
                    <Input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      placeholder="5"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Tags</SectionLabel>
              <Field label="Comma separated" hint="Helps the search and matching engine surface your listing">
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="logo, branding, identity"
                />
              </Field>
            </div>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={busy} className="self-start">
                {buttonLabel}
              </Button>
              <p className="text-xs text-txt-mute leading-relaxed">
                Posting a listing is recorded on Arc. Your wallet will pop up to sign a small gas tx in USDC.
              </p>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

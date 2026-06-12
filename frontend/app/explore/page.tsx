'use client';
import { Suspense, useEffect, useState, useCallback, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Input, Select, Skeleton } from '@/components/ui';
import FreelancerCard from '@/components/FreelancerCard';
import { CATEGORIES } from '@/components/CategoryGrid';
import PageHero from '@/components/PageHero';
import Explainer from '@/components/Explainer';
import Reveal from '@/components/Reveal';
import type { Listing } from '@/lib/types';

interface Filters {
  kind: '' | 'service' | 'job';
  category: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  maxDelivery: string;
  sort: 'rating' | 'price' | 'delivery';
}

const BROWSE_EXPLAINER = [
  {
    n: '01',
    t: 'How browsing works',
    d: 'Every listing is posted by a verified freelancer or creator. Click any listing to see the full description, the freelancer\'s profile, their past reviews, and the starting price for the work.',
  },
  {
    n: '02',
    t: 'What "starting at" means',
    d: 'The price on a listing is the freelancer\'s asking price. When you hire, the order opens at that price. As the hirer you can adjust it up or down during chat before both sides hit Agree.',
  },
  {
    n: '03',
    t: 'After you click Hire',
    d: 'A private chat opens with the freelancer. You clarify scope and deadline. You can adjust the price during chat. Once both sides hit Agree, you lock the funds into an on-chain escrow contract on Arc, and they start work.',
  },
];

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute block mb-3">
      {children}
    </span>
  );
}

function ExploreInner() {
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    kind: '',
    category: params.get('category') || '',
    minPrice: '', maxPrice: '', rating: '', maxDelivery: '', sort: 'rating',
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'sort') qs.set(k, v); });
    try {
      const { listings } = await api<{ listings: Listing[] }>(`/api/listings?${qs.toString()}`, { auth: false });
      let rows: Listing[] = listings || [];
      if (filters.sort === 'price') rows = [...rows].sort((a, b) => Number(a.price_usdc) - Number(b.price_usdc));
      if (filters.sort === 'delivery') rows = [...rows].sort((a, b) => a.delivery_days - b.delivery_days);
      setListings(rows);
    } catch (err) {
      setListings([]);
      setLoadError((err as Error).message || 'Could not load listings');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof Filters) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value } as Filters));

  return (
    <div>
      <PageHero
        eyebrow="Browse"
        title={
          <>
            Find a freelancer, <span className="font-display italic text-purple-light">vetted</span> and ready.
          </>
        }
        sub="Every active listing on PayLance, filtered by category, price, delivery time and rating. The freelancer's wallet, portfolio and review history are visible before you ever start a chat."
      />

      <section className="max-w-container mx-auto px-5 py-10 sm:py-14">
        <Reveal>
          <Explainer items={BROWSE_EXPLAINER} />
        </Reveal>
      </section>

      <section className="max-w-container mx-auto px-5 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 lg:gap-12">
          {/* Filter sidebar */}
          <aside className="h-fit flex flex-col gap-6 lg:sticky lg:top-20">
            <div>
              <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
                Filters
              </div>
            </div>

            <label className="block">
              <FilterLabel>Category</FilterLabel>
              <Select value={filters.category} onChange={set('category')}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </Select>
            </label>

            <div>
              <FilterLabel>Price (USDC)</FilterLabel>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min="0" placeholder="Min" value={filters.minPrice} onChange={set('minPrice')} aria-label="Min USDC" />
                <Input type="number" min="0" placeholder="Max" value={filters.maxPrice} onChange={set('maxPrice')} aria-label="Max USDC" />
              </div>
            </div>

            <label className="block">
              <FilterLabel>Min rating</FilterLabel>
              <Select value={filters.rating} onChange={set('rating')}>
                <option value="">Any</option>
                <option value="4.5">4.5+</option>
                <option value="4">4.0+</option>
                <option value="3">3.0+</option>
              </Select>
            </label>

            <label className="block">
              <FilterLabel>Max delivery</FilterLabel>
              <Select value={filters.maxDelivery} onChange={set('maxDelivery')}>
                <option value="">Any time</option>
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
              </Select>
            </label>

            <label className="block">
              <FilterLabel>Sort by</FilterLabel>
              <Select value={filters.sort} onChange={set('sort')}>
                <option value="rating">Top rated</option>
                <option value="price">Lowest price</option>
                <option value="delivery">Fastest delivery</option>
              </Select>
            </label>
          </aside>

          {/* Results */}
          <div>
            <div className="flex items-center gap-5 mb-6 text-sm">
              {([['', 'All'], ['service', 'Services'], ['job', 'Jobs']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, kind: val }))}
                  className={`relative pb-2 transition-colors ${filters.kind === val ? 'text-white' : 'text-txt-dim hover:text-white'}`}
                >
                  {label}
                  {filters.kind === val && <span className="absolute left-0 right-0 -bottom-px h-px bg-purple-accent" />}
                </button>
              ))}
            </div>
            <div className="flex items-baseline justify-between mb-8">
              <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-txt-mute">
                {loading ? 'Loading' : `${listings.length} ${filters.kind === 'job' ? 'job' : 'listing'}${listings.length === 1 ? '' : 's'}`}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
              </div>
            ) : loadError ? (
              <div>
                <p className="text-txt-dim">Could not load listings. {loadError}</p>
                <Button onClick={load} className="mt-5">Try again</Button>
              </div>
            ) : listings.length === 0 ? (
              <p className="text-txt-dim">No listings match these filters. Try widening one of them.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
                {listings.map((l, i) => (
                  <Reveal key={l.id} delay={Math.min(i * 60, 360)}>
                    <FreelancerCard listing={l} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ExplorePage() {
  return <Suspense fallback={null}><ExploreInner /></Suspense>;
}

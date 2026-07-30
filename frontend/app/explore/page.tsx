'use client';
import { Suspense, useEffect, useState, useCallback, useMemo, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Input, Select, Skeleton } from '@/components/ui';
import FreelancerCard from '@/components/FreelancerCard';
import { CATEGORIES } from '@/components/CategoryGrid';
import PageHero from '@/components/PageHero';
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

const DEFAULT_FILTERS: Filters = {
  kind: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  rating: '',
  maxDelivery: '',
  sort: 'rating',
};

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono uppercase tracking-[0.16em] text-[10px] sm:text-[11px] text-txt-mute block mb-2">
      {children}
    </span>
  );
}

function ListingSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-white/[0.015] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-end justify-between pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

function ExploreEmpty({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-white/[0.02] px-5 py-10 sm:px-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.22), transparent 70%)' }}
      />
      <div className="relative max-w-md">
        <div className="font-display italic text-xl sm:text-2xl text-white leading-snug">
          {hasFilters ? 'Nothing matches these filters.' : 'The marketplace is open. Be first.'}
        </div>
        <p className="text-txt-dim mt-3 text-sm sm:text-base leading-relaxed">
          {hasFilters
            ? 'Widen price, rating, or category, or clear filters and browse everything.'
            : 'Post a service or a job. Listings show up here as soon as they go live on Arc.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          {hasFilters ? (
            <Button onClick={onClear} className="w-full sm:w-auto">Clear filters</Button>
          ) : (
            <Button href="/listing/new" className="w-full sm:w-auto">Post a listing</Button>
          )}
          <Button variant="ghost" href="/hire" className="w-full sm:w-auto">Post a job</Button>
        </div>
      </div>
    </div>
  );
}

function FilterFields({
  filters,
  set,
}: {
  filters: Filters;
  set: (k: keyof Filters) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <label className="block">
        <FilterLabel>Category</FilterLabel>
        <Select value={filters.category} onChange={set('category')}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </Select>
      </label>

      <div>
        <FilterLabel>Price (USDC)</FilterLabel>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Min"
            value={filters.minPrice}
            onChange={set('minPrice')}
            aria-label="Min USDC"
          />
          <Input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={set('maxPrice')}
            aria-label="Max USDC"
          />
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
    </div>
  );
}

function ExploreInner() {
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    category: params.get('category') || '',
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  // Keep category in sync when navigating from home category links
  useEffect(() => {
    const cat = params.get('category') || '';
    setFilters((f) => (f.category === cat ? f : { ...f, category: cat }));
  }, [params]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== 'sort') qs.set(k, v);
    });
    try {
      const { listings } = await api<{ listings: Listing[] }>(
        `/api/listings?${qs.toString()}`,
        { auth: false },
      );
      let rows: Listing[] = listings || [];
      if (filters.sort === 'price') {
        rows = [...rows].sort((a, b) => Number(a.price_usdc) - Number(b.price_usdc));
      }
      if (filters.sort === 'delivery') {
        rows = [...rows].sort((a, b) => a.delivery_days - b.delivery_days);
      }
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

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.category) n++;
    if (filters.minPrice) n++;
    if (filters.maxPrice) n++;
    if (filters.rating) n++;
    if (filters.maxDelivery) n++;
    if (filters.sort !== 'rating') n++;
    return n;
  }, [filters]);

  const hasHardFilters = Boolean(
    filters.category || filters.minPrice || filters.maxPrice || filters.rating
    || filters.maxDelivery || filters.kind,
  );

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setFiltersOpen(false);
  };

  const kindTabs = (['', 'service', 'job'] as const).map((val) => ({
    val,
    label: val === '' ? 'All' : val === 'service' ? 'Services' : 'Jobs',
  }));

  return (
    <div>
      <PageHero
        eyebrow="Browse"
        title={
          <>
            Find a freelancer,{' '}
            <span className="font-display italic text-purple-light pb-0.5">vetted</span>
            {' '}and ready.
          </>
        }
        sub="Filter by category, price, delivery, and rating. Wallet, portfolio, and reviews are visible before you chat."
      >
        <div className="mt-6 sm:mt-8">
          <button
            type="button"
            onClick={() => setHowOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-purple-light hover:text-white min-h-[44px] transition-colors"
            aria-expanded={howOpen}
          >
            {howOpen ? 'Hide how browsing works' : 'How browsing works'}
            <span className={`text-xs transition-transform ${howOpen ? 'rotate-180' : ''}`}>↓</span>
          </button>
          {howOpen && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 fadein">
              {[
                {
                  t: 'Browse listings',
                  d: 'Open any listing for the full brief, profile, reviews, and starting price.',
                },
                {
                  t: 'Starting price',
                  d: 'Orders open at the listed price. You can adjust it in chat before both sides Agree.',
                },
                {
                  t: 'After Hire',
                  d: 'A private chat opens. Agree on scope, fund escrow in USDC on Arc, then work starts.',
                },
              ].map((item) => (
                <div
                  key={item.t}
                  className="rounded-lg border border-line bg-white/[0.02] px-4 py-4"
                >
                  <div className="font-medium text-sm text-white">{item.t}</div>
                  <p className="text-sm text-txt-dim mt-2 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageHero>

      <section className="max-w-container mx-auto px-4 sm:px-5 pb-16 sm:pb-24">
        {/* Kind tabs + mobile filter toggle */}
        <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 scrollbar-none">
            {kindTabs.map(({ val, label }) => (
              <button
                key={val || 'all'}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, kind: val }))}
                className={`shrink-0 min-h-[40px] px-4 rounded-full text-sm transition-colors border
                  ${filters.kind === val
                    ? 'bg-white text-bg border-white'
                    : 'bg-transparent text-txt-dim border-line hover:text-white hover:border-white/20'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, category: '' }))}
              className={`shrink-0 min-h-[36px] px-3 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors
                ${!filters.category
                  ? 'border-purple-accent/50 text-purple-light bg-purple/15'
                  : 'border-line text-txt-mute hover:text-white'
                }`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setFilters((f) => ({
                  ...f,
                  category: f.category === c.name ? '' : c.name,
                }))}
                className={`shrink-0 min-h-[36px] px-3 rounded-md text-xs border transition-colors whitespace-nowrap
                  ${filters.category === c.name
                    ? 'border-purple-accent/50 text-purple-light bg-purple/15'
                    : 'border-line text-txt-dim hover:text-white'
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono uppercase tracking-[0.16em] text-[10px] sm:text-[11px] text-txt-mute">
              {loading
                ? 'Loading…'
                : `${listings.length} ${filters.kind === 'job' ? 'job' : 'listing'}${listings.length === 1 ? '' : 's'}`}
            </div>

            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-txt-dim hover:text-white min-h-[40px] px-2 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="lg:hidden inline-flex items-center gap-2 min-h-[40px] px-3.5 rounded-md border border-line text-sm text-white hover:bg-white/[0.04] transition-colors"
                aria-expanded={filtersOpen}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-purple-accent/25 text-purple-light text-[11px] font-mono tabular-nums">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile filter panel */}
          {filtersOpen && (
            <div className="lg:hidden rounded-xl border border-line bg-bg p-4 sm:p-5 fadein">
              <FilterFields filters={filters} set={set} />
              <div className="mt-5 flex gap-3">
                <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                  Show results
                </Button>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" onClick={clearFilters} className="flex-1">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr] gap-8 lg:gap-12">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:flex h-fit flex-col gap-1 lg:sticky lg:top-24">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-4">
              Filters
            </div>
            <FilterFields filters={filters} set={set} />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 text-left text-sm text-txt-dim hover:text-white min-h-[44px] transition-colors"
              >
                Clear all filters
              </button>
            )}
          </aside>

          {/* Results */}
          <div className="min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingSkeleton key={i} />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-xl border border-line bg-white/[0.02] px-5 py-10 sm:px-8">
                <div className="font-medium text-white">Could not load listings</div>
                <p className="text-sm text-txt-dim mt-2 leading-relaxed max-w-md">
                  {loadError}
                </p>
                <Button onClick={load} className="mt-6">Try again</Button>
              </div>
            ) : listings.length === 0 ? (
              <ExploreEmpty hasFilters={hasHardFilters} onClear={clearFilters} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-x-6 sm:gap-y-8">
                {listings.map((l, i) => (
                  <Reveal key={l.id} delay={Math.min(i * 50, 300)}>
                    <FreelancerCard listing={l} />
                  </Reveal>
                ))}
              </div>
            )}

            {!loading && !loadError && listings.length > 0 && (
              <div className="mt-12 sm:mt-16 rounded-xl border border-line bg-white/[0.015] px-5 py-6 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="font-medium text-white">Offer your own work?</div>
                  <p className="text-sm text-txt-dim mt-1">List a service or post a job in minutes.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Button href="/listing/new" className="w-full sm:w-auto">Post a listing</Button>
                  <Button variant="ghost" href="/hire" className="w-full sm:w-auto">Post a job</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiet help footer link */}
        <p className="mt-10 text-center text-sm text-txt-mute">
          New to escrow?{' '}
          <Link href="/#how-it-works" className="text-purple-light hover:text-white transition-colors">
            See how payments work
          </Link>
        </p>
      </section>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-container mx-auto px-4 sm:px-5 py-16">
          <Skeleton className="h-10 w-2/3 max-w-md mb-4" />
          <Skeleton className="h-5 w-full max-w-lg mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListingSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ExploreInner />
    </Suspense>
  );
}

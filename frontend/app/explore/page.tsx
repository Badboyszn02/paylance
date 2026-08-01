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

/** Everything that narrows the result set. `sort` is ordering, not filtering,
    so it is deliberately excluded — it drives neither the count badge nor the
    empty-state copy. */
const FILTER_KEYS = [
  'kind', 'category', 'minPrice', 'maxPrice', 'rating', 'maxDelivery',
] as const satisfies readonly (keyof Filters)[];

const BROWSE_STEPS = [
  {
    n: '01',
    t: 'Open a listing',
    d: 'Full brief, profile, reviews, and starting price before you commit to anything.',
  },
  {
    n: '02',
    t: 'Agree on scope',
    d: 'Hire opens a private chat. The listed price is a starting point, not a final bill.',
  },
  {
    n: '03',
    t: 'Fund escrow',
    d: 'Lock USDC on Arc once both sides agree. Work starts when the money is verifiably there.',
  },
];

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono uppercase tracking-[0.16em] text-[10px] sm:text-[11px] text-txt-mute block mb-2">
      {children}
    </span>
  );
}

function ListingSkeleton() {
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
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-end justify-between pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

/** Shared grid so the skeletons and the real cards occupy identical geometry —
    no row-gap jump when the request resolves. */
function ResultsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-x-6 sm:gap-y-8">
      {children}
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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 sm:px-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.22), transparent 70%)' }}
      />
      <div className="relative max-w-md">
        <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
          {hasFilters ? 'Nothing matches these filters.' : 'The marketplace is open. Be first.'}
        </p>
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

function ExploreError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 sm:px-10 sm:py-12">
      <div className="max-w-md">
        <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-danger">
          Request failed
        </p>
        <p className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
          Could not load listings.
        </p>
        <p className="text-sm text-txt-dim mt-3 leading-relaxed">{message}</p>
        <Button onClick={onRetry} className="mt-7">Try again</Button>
      </div>
    </div>
  );
}

/** Price / rating / delivery / sort. Category is owned by the chip row above the
    results — duplicating it as a <Select> here let two controls drive one value. */
function FilterFields({
  filters,
  set,
}: {
  filters: Filters;
  set: (k: keyof Filters) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
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

  // One source of truth: the badge, the Clear affordance and the empty-state
  // copy all read the same number, so they can never disagree.
  const activeFilterCount = useMemo(
    () => FILTER_KEYS.filter((k) => filters[k]).length,
    [filters],
  );
  const hasFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setFiltersOpen(false);
  };

  const kindTabs = (['', 'service', 'job'] as const).map((val) => ({
    val,
    label: val === '' ? 'All' : val === 'service' ? 'Services' : 'Jobs',
  }));

  const noun = filters.kind === 'job' ? 'job' : filters.kind === 'service' ? 'service' : 'listing';
  const resultLabel = loading
    ? 'Loading…'
    : `${listings.length} ${noun}${listings.length === 1 ? '' : 's'}`;

  return (
    <div>
      <PageHero
        eyebrow="Browse"
        title="Find a freelancer, vetted and ready."
        sub="Filter by category, price, delivery, and rating. Wallet, portfolio, and reviews are visible before you chat."
      >
        <div className="mt-6 sm:mt-8">
          <button
            type="button"
            onClick={() => setHowOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-purple-light hover:text-white min-h-[44px] transition-colors"
            aria-expanded={howOpen}
            aria-controls="how-browsing-works"
          >
            {howOpen ? 'Hide how browsing works' : 'How browsing works'}
            <span aria-hidden className={`text-xs transition-transform ${howOpen ? 'rotate-180' : ''}`}>↓</span>
          </button>
          {howOpen && (
            <div
              id="how-browsing-works"
              className="mt-5 grid grid-cols-1 md:grid-cols-3 fadein"
            >
              {BROWSE_STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className={`relative py-5 md:py-0 md:px-6
                    ${i > 0 ? 'border-t md:border-t-0 md:border-l border-white/[0.08]' : ''}
                    ${i === 0 ? 'md:pl-0' : ''}
                    ${i === BROWSE_STEPS.length - 1 ? 'md:pr-0' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] tracking-[0.16em] text-purple-light tabular-nums">
                      {s.n}
                    </span>
                    {i < BROWSE_STEPS.length - 1 && (
                      <span
                        className="hidden md:block flex-1 h-px bg-gradient-to-r from-purple-accent/40 to-transparent"
                        aria-hidden
                      />
                    )}
                  </div>
                  <h2 className="mt-3 text-base font-semibold tracking-tight text-white">{s.t}</h2>
                  <p className="mt-1.5 text-sm text-txt-dim leading-relaxed max-w-xs">{s.d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageHero>

      <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        {/* Kind tabs + category chips + result count */}
        <div className="flex flex-col gap-4 sm:gap-5 mb-8 sm:mb-10 pt-8 sm:pt-10 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 scrollbar-none" role="group" aria-label="Listing kind">
            {kindTabs.map(({ val, label }) => (
              <button
                key={val || 'all'}
                type="button"
                aria-pressed={filters.kind === val}
                onClick={() => setFilters((f) => ({ ...f, kind: val }))}
                className={`shrink-0 min-h-[40px] px-4 rounded-full text-sm transition-colors border
                  ${filters.kind === val
                    ? 'bg-white text-bg border-white font-medium'
                    : 'bg-transparent text-txt-dim border-line hover:text-white hover:border-white/20'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category chips — the single control for category */}
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, category: '' }))}
              aria-pressed={!filters.category}
              className={`shrink-0 min-h-[36px] px-3.5 rounded-full text-xs border transition-colors whitespace-nowrap
                ${!filters.category
                  ? 'border-purple-accent/50 text-purple-light bg-purple/15'
                  : 'border-line text-txt-dim hover:text-white hover:border-white/20'
                }`}
            >
              All categories
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setFilters((f) => ({
                  ...f,
                  category: f.category === c.name ? '' : c.name,
                }))}
                aria-pressed={filters.category === c.name}
                className={`shrink-0 min-h-[36px] px-3.5 rounded-full text-xs border transition-colors whitespace-nowrap
                  ${filters.category === c.name
                    ? 'border-purple-accent/50 text-purple-light bg-purple/15'
                    : 'border-line text-txt-dim hover:text-white hover:border-white/20'
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="font-mono uppercase tracking-[0.16em] text-[10px] sm:text-[11px] text-txt-mute tabular-nums"
              aria-live="polite"
            >
              {resultLabel}
            </div>

            <div className="flex items-center gap-2">
              {hasFilters && (
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
                aria-controls="mobile-filters"
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
            <div id="mobile-filters" className="lg:hidden rounded-xl border border-line bg-bg p-4 sm:p-5 fadein">
              <FilterFields filters={filters} set={set} />
              <div className="mt-5 flex gap-3">
                <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                  Show results
                </Button>
                {hasFilters && (
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
          <aside className="hidden lg:flex h-fit flex-col lg:sticky lg:top-24">
            <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
              Refine
            </div>
            <FilterFields filters={filters} set={set} />
            {hasFilters && (
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
              <ResultsGrid>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingSkeleton key={i} />
                ))}
              </ResultsGrid>
            ) : loadError ? (
              <ExploreError message={loadError} onRetry={load} />
            ) : listings.length === 0 ? (
              <ExploreEmpty hasFilters={hasFilters} onClear={clearFilters} />
            ) : (
              <ResultsGrid>
                {listings.map((l, i) => (
                  <Reveal key={l.id} delay={Math.min(i * 45, 240)}>
                    <FreelancerCard listing={l} />
                  </Reveal>
                ))}
              </ResultsGrid>
            )}
          </div>
        </div>

        {/* Page-level CTA — full container width so its rule lines up with the
            hero divider rather than indenting to the results column. */}
        {!loading && !loadError && listings.length > 0 && (
          <div className="mt-14 sm:mt-20 pt-10 sm:pt-12 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-md">
              <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
                Offer your own work?
              </p>
              <p className="text-sm sm:text-base text-txt-dim mt-2 leading-relaxed">
                List a service or post a job. Same escrow rules either way.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button href="/listing/new" className="w-full sm:w-auto">Post a listing</Button>
              <Button variant="ghost" href="/hire" className="w-full sm:w-auto">Post a job</Button>
            </div>
          </div>
        )}

        {/* Quiet help footer link */}
        <p className="mt-12 sm:mt-16 text-center text-sm text-txt-mute">
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
        <div>
          <PageHero
            eyebrow="Browse"
            title="Find a freelancer, vetted and ready."
            sub="Filter by category, price, delivery, and rating. Wallet, portfolio, and reviews are visible before you chat."
          />
          <section className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 pb-16 sm:pb-24">
            <div className="pt-8 sm:pt-10 mb-8 sm:mb-10 border-t border-white/[0.06]">
              <Skeleton className="h-10 w-52 rounded-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr] gap-8 lg:gap-12">
              <div className="hidden lg:block">
                <Skeleton className="h-5 w-20 mb-5" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="min-w-0">
                <ResultsGrid>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ListingSkeleton key={i} />
                  ))}
                </ResultsGrid>
              </div>
            </div>
          </section>
        </div>
      }
    >
      <ExploreInner />
    </Suspense>
  );
}

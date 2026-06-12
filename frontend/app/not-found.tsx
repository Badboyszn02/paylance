import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <section className="max-w-container mx-auto px-5 py-24 sm:py-32">
      <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl max-w-xl leading-snug">
        We could not find that <span className="font-display italic text-purple-light">page</span>.
      </h1>
      <p className="text-txt-dim mt-6 max-w-xl leading-relaxed">
        The link may be broken, or the listing or order you opened was removed. Try browsing from the home page.
      </p>
      <div className="flex flex-wrap gap-3 mt-8">
        <Button href="/">Go home</Button>
        <Button variant="ghost" href="/explore">Browse listings</Button>
      </div>
    </section>
  );
}

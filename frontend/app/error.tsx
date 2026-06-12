'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error('[page error]', error);
  }, [error]);

  return (
    <section className="max-w-container mx-auto px-5 py-24 sm:py-32">
      <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
        Something broke
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl max-w-xl leading-snug">
        This page hit an unexpected{' '}
        <span className="font-display italic text-purple-light">error</span>.
      </h1>
      <p className="text-txt-dim mt-6 max-w-xl leading-relaxed">
        The page failed to render. Try reloading. If it keeps happening, head back to the home page and let us know.
      </p>
      <div className="flex flex-wrap gap-3 mt-8">
        <Button onClick={reset}>Try again</Button>
        <Button variant="ghost" href="/">Go home</Button>
      </div>
      {error.digest && (
        <p className="text-xs text-txt-mute mt-10 font-mono">Ref: {error.digest}</p>
      )}
    </section>
  );
}

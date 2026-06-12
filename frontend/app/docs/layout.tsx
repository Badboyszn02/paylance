import Link from 'next/link';
import type { ReactNode } from 'react';

const SECTIONS = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/terms', label: 'Terms' },
  { href: '/docs/privacy', label: 'Privacy' },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-container mx-auto px-5 py-10 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
      <aside className="lg:sticky lg:top-24 h-fit">
        <div className="text-xs uppercase tracking-wider text-txt-mute mb-3">Docs</div>
        <nav className="flex flex-row lg:flex-col gap-3 lg:gap-2 overflow-x-auto whitespace-nowrap text-sm">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="text-txt-dim hover:text-white"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </aside>
      <article className="min-w-0 max-w-3xl">
        {children}
      </article>
    </div>
  );
}

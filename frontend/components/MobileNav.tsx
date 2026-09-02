'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
      </svg>
    ),
  },
  {
    href: '/explore',
    label: 'Listings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: '/hire',
    label: 'Hire',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'You',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 19.5c1.5-3.2 3.8-4.8 6.5-4.8s5 1.6 6.5 4.8" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-bg/95 backdrop-blur-md"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-4">
        {ITEMS.map((i) => {
          const active = i.href === '/' ? pathname === '/' : pathname?.startsWith(i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`flex flex-col items-center justify-center gap-1 min-h-[52px] pt-2 pb-1 text-[10px] font-medium tracking-wide
                active:scale-[0.97] transition-colors
                ${active ? 'text-purple-light' : 'text-txt-mute'}`}
            >
              <span className={active ? 'text-purple-light' : 'text-txt-dim'}>{i.icon}</span>
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

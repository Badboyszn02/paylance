'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/orders', label: 'Orders' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line grid grid-cols-4">
      {ITEMS.map((i) => {
        const active = i.href === '/' ? pathname === '/' : pathname?.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href}
            className={`py-3 text-center text-xs ${active ? 'text-purple-light' : 'text-txt-dim'}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

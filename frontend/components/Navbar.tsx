'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/lib/wallet';
import { useToast } from './Toast';
import { Button } from './ui';
import Logo from './Logo';
import { shortAddr } from '@/lib/format';
import { friendly } from '@/lib/errors';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Listings' },
  { href: '/hire', label: 'Hire' },
  { href: '/#testnet', label: 'Testnet' },
];

function WalletButton() {
  const { address, user, connect, disconnect, chainOk, connecting, switchToArc } = useWallet();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [switching, setSwitching] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const onSwitch = async () => {
    setSwitching(true);
    try {
      await switchToArc();
      toast.success('Switched to Arc');
      setMenu(false);
    } catch (e) {
      toast.error(friendly(e) || 'Could not switch network.');
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menu]);

  const onConnect = async () => {
    try { await connect(); } catch (e) { toast.error(friendly(e)); }
  };

  if (!address || !user) {
    return (
      <Button
        variant="primary"
        onClick={onConnect}
        disabled={connecting}
        className="w-full sm:w-auto min-h-[44px]"
      >
        {connecting ? 'Signing in…' : 'Connect wallet'}
      </Button>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full sm:w-auto">
      <button
        onClick={() => setMenu((v) => !v)}
        className="flex w-full sm:w-auto items-center justify-center gap-2 text-sm min-h-[44px] px-3 py-2.5 rounded-md hover:bg-white/[0.04] border border-line sm:border-transparent"
        aria-haspopup="menu"
        aria-expanded={menu}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${chainOk ? 'bg-ok' : 'bg-danger'}`} />
        <span className="tabular-nums">{shortAddr(address)}</span>
      </button>

      {menu && (
        <div className="absolute right-0 left-0 sm:left-auto top-full mt-2 w-full sm:w-52 bg-bg border border-line rounded-md py-1.5 fadein z-50 shadow-xl">
          {!chainOk && (
            <button
              onClick={onSwitch}
              disabled={switching}
              className="w-full text-left px-4 py-3 text-xs text-danger hover:bg-white/[0.04] disabled:opacity-50 min-h-[44px]"
            >
              {switching ? 'Switching…' : 'Wrong network. Switch to Arc →'}
            </button>
          )}
          <Link href="/listing/new" onClick={() => setMenu(false)} className="block px-4 py-3 text-sm text-purple-light hover:bg-white/[0.04] min-h-[44px]">
            + New listing
          </Link>
          <div className="h-px bg-line my-1" />
          <Link href="/dashboard" onClick={() => setMenu(false)} className="block px-4 py-3 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04] min-h-[44px]">Dashboard</Link>
          <Link href="/orders" onClick={() => setMenu(false)} className="block px-4 py-3 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04] min-h-[44px]">Orders</Link>
          <Link href="/settings" onClick={() => setMenu(false)} className="block px-4 py-3 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04] min-h-[44px]">Settings</Link>
          <div className="h-px bg-line my-1" />
          <button
            onClick={() => { setMenu(false); disconnect(); }}
            className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-white/[0.04] min-h-[44px]"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center py-3 md:py-0 min-h-[44px] md:min-h-0 ${active ? 'text-white' : 'text-txt-dim hover:text-white'}`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    return href === '/' ? pathname === '/' : (pathname?.startsWith(href) ?? false);
  };
  const close = () => setOpen(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-line/60">
      <div className="max-w-container mx-auto px-4 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Logo />

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} />
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <WalletButton />
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/[0.04] active:scale-[0.97]"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-bg px-4 sm:px-5 py-4 flex flex-col gap-1 fadein max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
          {LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} onClick={close} />
          ))}
          <Link href="/orders" onClick={close} className="flex items-center py-3 min-h-[44px] text-txt-dim hover:text-white">
            Orders
          </Link>
          <Link href="/dashboard" onClick={close} className="flex items-center py-3 min-h-[44px] text-txt-dim hover:text-white">
            Dashboard
          </Link>
          <div className="pt-3 pb-2">
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
}

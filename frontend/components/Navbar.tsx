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

  // close on click outside
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
      <Button variant="primary" onClick={onConnect} disabled={connecting}>
        {connecting ? 'Signing in…' : 'Connect wallet'}
      </Button>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setMenu((v) => !v)}
        className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-md hover:bg-white/[0.04]"
        aria-haspopup="menu"
        aria-expanded={menu}
      >
        <span className={`w-2 h-2 rounded-full ${chainOk ? 'bg-ok' : 'bg-danger'}`} />
        <span className="tabular-nums">{shortAddr(address)}</span>
      </button>

      {menu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-bg border border-line rounded-md py-1.5 fadein z-50 shadow-xl">
          {!chainOk && (
            <button
              onClick={onSwitch}
              disabled={switching}
              className="w-full text-left px-4 py-2 text-xs text-danger hover:bg-white/[0.04] disabled:opacity-50"
            >
              {switching ? 'Switching…' : 'Wrong network. Switch to Arc →'}
            </button>
          )}
          <Link href="/listing/new" onClick={() => setMenu(false)} className="block px-4 py-2 text-sm text-purple-light hover:bg-white/[0.04]">+ New listing</Link>
          <div className="h-px bg-line my-1" />
          <Link href="/dashboard" onClick={() => setMenu(false)} className="block px-4 py-2 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04]">Dashboard</Link>
          <Link href="/orders" onClick={() => setMenu(false)} className="block px-4 py-2 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04]">Orders</Link>
          <Link href="/settings" onClick={() => setMenu(false)} className="block px-4 py-2 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04]">Settings</Link>
          <div className="h-px bg-line my-1" />
          <button
            onClick={() => { setMenu(false); disconnect(); }}
            className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-white/[0.04]"
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
    <Link href={href} onClick={onClick} className={active ? 'text-white' : 'text-txt-dim hover:text-white'}>
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => href === '/' ? pathname === '/' : (pathname?.startsWith(href) ?? false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-bg">
      <div className="max-w-container mx-auto px-5 h-16 flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {LINKS.map((l) => <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} />)}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <WalletButton />
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/[0.04]"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        <div className="md:hidden bg-bg px-5 py-4 flex flex-col gap-4 fadein">
          {LINKS.map((l) => <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} onClick={close} />)}
          <div className="pt-2"><WalletButton /></div>
        </div>
      )}
    </header>
  );
}

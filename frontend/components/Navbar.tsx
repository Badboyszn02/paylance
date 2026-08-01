'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/lib/wallet';
import { useToast } from './Toast';
import Logo from './Logo';
import { shortAddr } from '@/lib/format';
import { friendly } from '@/lib/errors';

const LINKS = [
  { href: '/explore', label: 'Listings' },
  { href: '/hire', label: 'Hire' },
  { href: '/how-it-works', label: 'How it works' },
];

function WalletButton({ compact = false }: { compact?: boolean }) {
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
    try {
      await connect();
    } catch (e) {
      toast.error(friendly(e));
    }
  };

  if (!address || !user) {
    return (
      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className={
          compact
            ? 'w-full inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-md bg-white text-bg hover:bg-white/90 disabled:opacity-40 transition-colors'
            : 'inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-full bg-white text-bg hover:bg-white/90 disabled:opacity-40 transition-colors whitespace-nowrap'
        }
      >
        {connecting ? 'Signing in…' : 'Connect wallet'}
      </button>
    );
  }

  return (
    <div ref={wrapRef} className={`relative ${compact ? 'w-full' : 'w-full sm:w-auto'}`}>
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        className="flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs min-h-[32px] h-8 px-3 rounded-full border border-line bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
        aria-haspopup="menu"
        aria-expanded={menu}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${chainOk ? 'bg-ok' : 'bg-danger'}`} />
        <span className="tabular-nums font-mono text-[13px]">{shortAddr(address)}</span>
      </button>

      {menu && (
        <div className="absolute right-0 left-0 sm:left-auto top-full mt-2 w-full sm:w-52 rounded-xl border border-line bg-bg py-1.5 fadein z-50 shadow-2xl shadow-black/40">
          {!chainOk && (
            <button
              type="button"
              onClick={onSwitch}
              disabled={switching}
              className="w-full text-left px-4 py-3 text-xs text-danger hover:bg-white/[0.04] disabled:opacity-50 min-h-[44px]"
            >
              {switching ? 'Switching…' : 'Switch to Arc →'}
            </button>
          )}
          <Link
            href="/listing/new"
            onClick={() => setMenu(false)}
            className="block px-4 py-3 text-sm text-purple-light hover:bg-white/[0.04] min-h-[44px]"
          >
            Post a listing
          </Link>
          <div className="h-px bg-line my-1" />
          <Link href="/dashboard" onClick={() => setMenu(false)} className="block px-4 py-3 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04] min-h-[44px]">
            Dashboard
          </Link>
          <Link href="/orders" onClick={() => setMenu(false)} className="block px-4 py-3 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04] min-h-[44px]">
            Orders
          </Link>
          <Link href="/settings" onClick={() => setMenu(false)} className="block px-4 py-3 text-sm text-txt-dim hover:text-white hover:bg-white/[0.04] min-h-[44px]">
            Settings
          </Link>
          <div className="h-px bg-line my-1" />
          <button
            type="button"
            onClick={() => {
              setMenu(false);
              disconnect();
            }}
            className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-white/[0.04] min-h-[44px]"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative text-[13px] tracking-wide transition-colors
        ${active ? 'text-white' : 'text-txt-dim hover:text-white'}`}
    >
      {label}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-px bg-purple-accent/80 hidden md:block" />
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) ?? false;
  };

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 isolate">
      {/* Single clean bar — no marquee, no double borders */}
      <div className="border-b border-white/[0.06] bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70">
        <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-8 h-14 sm:h-[3.75rem] flex items-center gap-6">
          <Logo />

          <nav className="hidden md:flex items-center gap-6 flex-1 ml-2" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} />
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5 ml-auto">
            {/* Same destination and label as the mobile sheet and the wallet
                menu — this used to read "Post" / "Post a listing" / "New
                listing" for one route. Bordered so it reads as an action next
                to the wallet button rather than a fourth nav link. */}
            <Link
              href="/listing/new"
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-full
                border border-line text-txt-dim hover:text-white hover:border-white/20 hover:bg-white/[0.04]
                transition-colors whitespace-nowrap"
            >
              Post a listing
            </Link>
            <WalletButton />
          </div>

          {/* Mobile: wallet peek + menu */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button
              type="button"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.08] hover:bg-white/[0.04] active:scale-[0.97] transition-all"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                {open ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile full-screen sheet */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-50 bg-bg flex flex-col fadein">
          <nav className="flex-1 px-5 py-6 flex flex-col gap-1 overflow-y-auto" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className={`flex items-center min-h-[52px] text-lg border-b border-white/[0.06]
                  ${isActive(l.href) ? 'text-white' : 'text-txt-dim'}`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/listing/new"
              onClick={close}
              className="flex items-center min-h-[52px] text-lg border-b border-white/[0.06] text-txt-dim"
            >
              Post a listing
            </Link>
            <Link
              href="/orders"
              onClick={close}
              className="flex items-center min-h-[52px] text-lg border-b border-white/[0.06] text-txt-dim"
            >
              Orders
            </Link>
            <Link
              href="/dashboard"
              onClick={close}
              className="flex items-center min-h-[52px] text-lg border-b border-white/[0.06] text-txt-dim"
            >
              Dashboard
            </Link>
          </nav>
          <div className="p-5 border-t border-white/[0.06] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <WalletButton compact />
          </div>
        </div>
      )}
    </header>
  );
}

'use client';
import Link from 'next/link';
import type {
  AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes,
  InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes,
} from 'react';
import { initials, STATUS_META, type StatusTone } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

// ---------- Button ----------
type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'subtle';

const BTN: Record<Variant, string> = {
  primary: 'bg-white text-bg hover:bg-white/90',
  ghost: 'bg-transparent text-white hover:bg-white/5 border border-line',
  danger: 'bg-danger text-white hover:opacity-90',
  success: 'bg-ok text-white hover:opacity-90',
  subtle: 'bg-card text-white/80 hover:text-white hover:bg-white/5',
};

type ButtonProps =
  & { variant?: Variant; className?: string; children?: ReactNode; href?: string }
  & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>
  & Partial<Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'>>;

export function Button({ variant = 'primary', href, className = '', disabled, children, ...rest }: ButtonProps) {
  const cls = `inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md
    disabled:opacity-40 disabled:cursor-not-allowed ${BTN[variant]} ${className}`;
  if (href) return <Link href={href} className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</Link>;
  return <button className={cls} disabled={disabled} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}

// ---------- Input / Field ----------
export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-surface px-3 py-2.5 text-sm rounded-md outline-none
        border border-line focus:border-purple-accent ${className}`}
      {...rest}
    />
  );
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full bg-surface px-3 py-2.5 text-sm rounded-md outline-none leading-relaxed
        border border-line focus:border-purple-accent ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full bg-surface px-3 py-2.5 text-sm rounded-md outline-none
        border border-line focus:border-purple-accent ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label?: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-txt-dim mb-1.5">{label}</span>}
      {children}
      {hint && <span className="block text-xs text-txt-mute mt-1">{hint}</span>}
    </label>
  );
}

// ---------- Card (no border, separated by background color) ----------
export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-card rounded-lg ${className}`} {...rest}>{children}</div>;
}

// ---------- Pill / Badge ----------
export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full bg-purple/20 text-purple-light ${className}`}>
      {children}
    </span>
  );
}

// ---------- Avatar (initials only, no uploaded images) ----------
// `src` is accepted for compat but ignored; profile pictures are intentionally unsupported.
export function Avatar({ name, size = 40 }: { name?: string; src?: string | null; size?: number }) {
  const dim = { width: size, height: size, fontSize: size * 0.4 };
  return (
    <span style={dim} className="rounded-full bg-purple/25 text-purple-light flex items-center justify-center font-medium shrink-0">
      {initials(name)}
    </span>
  );
}

// ---------- Star rating (text + filled chars, color only) ----------
export function Stars({ value = 0, count }: { value?: number | string | null; count?: number | null }) {
  const v = Math.round(Number(value) * 10) / 10;
  return (
    <span className="text-sm text-txt-dim">
      <span className="text-purple-light tabular-nums">{v.toFixed(1)}</span>
      <span className="text-purple/60"> ★</span>
      {count != null && <span className="text-txt-mute"> ({count})</span>}
    </span>
  );
}

// ---------- Status badge (colored dot + text) ----------
const DOT: Record<StatusTone, string> = { ok: 'bg-ok', danger: 'bg-danger', warn: 'bg-warn', purple: 'bg-purple-accent' };

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status] || { label: status, tone: 'purple' as StatusTone };
  return (
    <span className="inline-flex items-center gap-2 text-sm text-txt-dim">
      <span className={`w-2 h-2 rounded-full ${DOT[meta.tone]}`} />
      {meta.label}
    </span>
  );
}

// ---------- Skeleton ----------
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-md animate-pulse ${className}`} />;
}

// ---------- Section heading ----------
export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl">{children}</h2>
      {sub && <p className="text-txt-dim mt-1">{sub}</p>}
    </div>
  );
}

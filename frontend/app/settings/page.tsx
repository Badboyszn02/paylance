'use client';
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';
import { useToast } from '@/components/Toast';
import { Button, Input, Textarea, Select, Field, Skeleton } from '@/components/ui';
import { CATEGORIES } from '@/components/CategoryGrid';
import PageHero from '@/components/PageHero';
import { shortAddr } from '@/lib/format';
import { friendly } from '@/lib/errors';
import type { User } from '@/lib/types';

interface ProfileForm {
  company: string;
  bio: string;
  location: string;
  wallet_address: string;
  category: string;
  skills: string;
  portfolio_links: string;
  niche: string;
  social_instagram: string;
  social_tiktok: string;
  social_youtube: string;
  social_twitter: string;
  follower_count_instagram: number | string;
  follower_count_tiktok: number | string;
  follower_count_youtube: number | string;
  follower_count_twitter: number | string;
  engagement_rate: number | string;
  rate_per_post_usdc: number | string;
  social_verified?: boolean;
}

interface NotifySettings { chat: boolean }

const csv = (arr?: string[] | null): string => (arr || []).join(', ');
const toArr = (s: string): string[] => (s || '').split(',').map((x) => x.trim()).filter(Boolean);

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono uppercase tracking-[0.18em] text-[11px] text-purple-light mb-5">
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading, refresh } = useAuth();
  const { address, connect } = useWallet();
  const toast = useToast();
  const router = useRouter();
  const [p, setP] = useState<ProfileForm | false | null>(null);
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState<NotifySettings>({ chat: true });

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/'); return; }
    api<{ user: User }>('/api/auth/me').then(({ user }) => {
      const pr = user.profile || {};
      setP({
        company: pr.company || '', bio: pr.bio || '', location: pr.location || '',
        wallet_address: pr.wallet_address || '',
        category: pr.category || '', skills: csv(pr.skills), portfolio_links: csv(pr.portfolio_links),
        niche: pr.niche || '', social_instagram: pr.social_instagram || '', social_tiktok: pr.social_tiktok || '',
        social_youtube: pr.social_youtube || '', social_twitter: pr.social_twitter || '',
        follower_count_instagram: pr.follower_count_instagram || 0, follower_count_tiktok: pr.follower_count_tiktok || 0,
        follower_count_youtube: pr.follower_count_youtube || 0, follower_count_twitter: pr.follower_count_twitter || 0,
        engagement_rate: pr.engagement_rate || 0, rate_per_post_usdc: pr.rate_per_post_usdc || 0,
        social_verified: pr.social_verified,
      });
    }).catch(() => setP(false));
    const n = localStorage.getItem('paylance_notify');
    if (n) {
      try { setNotify(JSON.parse(n)); } catch { /* corrupt; keep defaults */ }
    }
  }, [user, loading, router]);

  const set = (k: keyof ProfileForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setP((s) => (s ? { ...s, [k]: e.target.value } : s));

  const save = async () => {
    if (!p || !user) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        company: p.company || undefined, bio: p.bio || undefined, location: p.location || undefined,
        wallet_address: p.wallet_address || undefined,
        category: p.category || undefined, skills: toArr(p.skills), portfolio_links: toArr(p.portfolio_links),
      };
      if (user.role === 'creator') {
        Object.assign(body, {
          niche: p.niche || undefined,
          social_instagram: p.social_instagram || undefined, social_tiktok: p.social_tiktok || undefined,
          social_youtube: p.social_youtube || undefined, social_twitter: p.social_twitter || undefined,
          follower_count_instagram: Number(p.follower_count_instagram) || 0,
          follower_count_tiktok: Number(p.follower_count_tiktok) || 0,
          follower_count_youtube: Number(p.follower_count_youtube) || 0,
          follower_count_twitter: Number(p.follower_count_twitter) || 0,
          engagement_rate: Number(p.engagement_rate) || 0,
          rate_per_post_usdc: Number(p.rate_per_post_usdc) || 0,
        });
      }
      await api('/api/profile', { method: 'PUT', body });
      await refresh();
      toast.success('Profile saved');
    } catch (e) { toast.error(friendly(e)); }
    setBusy(false);
  };

  const verifySocial = async () => {
    try {
      const { verified } = await api<{ verified: boolean }>('/api/profile/verify-social', { method: 'POST', body: {} });
      setP((s) => (s ? { ...s, social_verified: verified } : s));
      toast[verified ? 'success' : 'error'](verified ? 'Socials verified' : 'Add a social link first');
    } catch (e) { toast.error(friendly(e)); }
  };

  const saveNotify = (next: NotifySettings) => {
    setNotify(next);
    localStorage.setItem('paylance_notify', JSON.stringify(next));
  };

  return (
    <div>
      <PageHero
        quiet
        eyebrow="Settings"
        title={
          <>
            Your public profile and <span className="font-display italic text-purple-light">payout wallet</span>.
          </>
        }
        sub="Updates apply across PayLance. Profile fields appear on your listings, orders, and reviews."
      />

      {!p || !user ? (
        <section className="max-w-2xl mx-auto px-5 pb-16">
          <Skeleton className="h-96" />
        </section>
      ) : (
        <section className="max-w-2xl mx-auto px-5 pb-16 sm:pb-24 flex flex-col gap-14">
          {/* Profile */}
          <div>
            <SectionLabel>Profile</SectionLabel>
            <div className="flex flex-col gap-4">
              {user.role === 'client' && (
                <Field label="Company"><Input value={p.company} onChange={set('company')} /></Field>
              )}
              <Field label="Bio"><Textarea rows={3} value={p.bio} onChange={set('bio')} /></Field>
              <Field label="Location"><Input value={p.location} onChange={set('location')} /></Field>
              {user.role !== 'client' && (
                <>
                  <Field label="Primary category">
                    <Select value={p.category} onChange={set('category')}>
                      <option value="">Select…</option>
                      {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Skills" hint="Comma separated"><Input value={p.skills} onChange={set('skills')} /></Field>
                  <Field label="Portfolio links" hint="Comma separated (Drive, Behance, Dribbble)">
                    <Input value={p.portfolio_links} onChange={set('portfolio_links')} />
                  </Field>
                </>
              )}
            </div>
          </div>

          {/* Creator-specific */}
          {user.role === 'creator' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <SectionLabel>Creator profile</SectionLabel>
                <Button variant="ghost" onClick={verifySocial}>{p.social_verified ? 'Verified' : 'Verify socials'}</Button>
              </div>
              <div className="flex flex-col gap-4">
                <Field label="Niche"><Input value={p.niche} onChange={set('niche')} placeholder="tech, lifestyle" /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Instagram"><Input value={p.social_instagram} onChange={set('social_instagram')} /></Field>
                  <Field label="IG followers"><Input type="number" value={p.follower_count_instagram} onChange={set('follower_count_instagram')} /></Field>
                  <Field label="TikTok"><Input value={p.social_tiktok} onChange={set('social_tiktok')} /></Field>
                  <Field label="TikTok followers"><Input type="number" value={p.follower_count_tiktok} onChange={set('follower_count_tiktok')} /></Field>
                  <Field label="YouTube"><Input value={p.social_youtube} onChange={set('social_youtube')} /></Field>
                  <Field label="YT subscribers"><Input type="number" value={p.follower_count_youtube} onChange={set('follower_count_youtube')} /></Field>
                  <Field label="X / Twitter"><Input value={p.social_twitter} onChange={set('social_twitter')} /></Field>
                  <Field label="X followers"><Input type="number" value={p.follower_count_twitter} onChange={set('follower_count_twitter')} /></Field>
                  <Field label="Engagement rate %"><Input type="number" step="0.1" value={p.engagement_rate} onChange={set('engagement_rate')} /></Field>
                  <Field label="Rate per post (USDC)"><Input type="number" value={p.rate_per_post_usdc} onChange={set('rate_per_post_usdc')} /></Field>
                </div>
              </div>
            </div>
          )}

          {/* Wallet */}
          <div>
            <SectionLabel>Wallet</SectionLabel>
            <div className="flex flex-col gap-4">
              <Field label="Payout wallet address (USDC on Arc)">
                <Input value={p.wallet_address} onChange={set('wallet_address')} placeholder="0x…" />
              </Field>
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost" onClick={async () => {
                  const a = address || await connect();
                  if (a) setP((s) => (s ? { ...s, wallet_address: a } : s));
                }}>
                  Use connected wallet
                </Button>
                {address && (
                  <span className="text-sm text-txt-dim tabular-nums font-mono">{shortAddr(address)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <SectionLabel>Notifications</SectionLabel>
            <div className="flex flex-col gap-3 max-w-md">
              <label className="flex items-center justify-between text-sm py-1">
                <span className="text-txt-dim">Chat message alerts</span>
                <input
                  type="checkbox"
                  checked={notify.chat}
                  onChange={(e) => saveNotify({ chat: e.target.checked })}
                  className="w-4 h-4 accent-purple-accent"
                />
              </label>
            </div>
          </div>

          <Button onClick={save} disabled={busy} className="self-start">
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </section>
      )}
    </div>
  );
}

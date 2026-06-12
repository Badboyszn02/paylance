'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Avatar, Stars, Pill, Skeleton } from '@/components/ui';
import FreelancerCard from '@/components/FreelancerCard';
import { usdc, timeAgo, shortAddr, safeHref } from '@/lib/format';
import type { Listing, Profile, Review, UserRole } from '@/lib/types';

interface ProfileData {
  id: number;
  name: string;
  role: UserRole;
  created_at?: string;
  profile?: Profile;
  listings?: Listing[];
  reviews?: Review[];
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-medium tabular-nums">{value}</div>
      <div className="text-xs text-txt-dim mt-0.5">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [data, setData] = useState<ProfileData | false | null>(null);
  const [tab, setTab] = useState<'listings' | 'reviews' | 'about'>('listings');

  useEffect(() => {
    api<ProfileData>(`/api/profile/${id}`, { auth: false }).then(setData).catch(() => setData(false));
  }, [id]);

  if (data === null) return <div className="max-w-container mx-auto px-5 py-10"><Skeleton className="h-72" /></div>;
  if (data === false) return <div className="max-w-container mx-auto px-5 py-20 text-txt-dim">Profile not found.</div>;

  const p: Profile = data.profile || {};
  const isCreator = data.role === 'creator';
  const socials: Array<[string, string | undefined, number | undefined]> = [
    ['Instagram', p.social_instagram, p.follower_count_instagram],
    ['TikTok', p.social_tiktok, p.follower_count_tiktok],
    ['YouTube', p.social_youtube, p.follower_count_youtube],
    ['X / Twitter', p.social_twitter, p.follower_count_twitter],
  ].filter(([, handle]) => !!handle) as Array<[string, string, number | undefined]>;

  return (
    <div>
      {/* spacer */}
      <div className="h-16" />

      <div className="max-w-container mx-auto px-5">
        <div className="-mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar name={data.name} src={p.avatar_url} size={88} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl">{data.name}</h1>
              {p.social_verified && <Pill>Verified creator</Pill>}
            </div>
            <div className="text-txt-dim text-sm mt-1">
              {p.category || (isCreator ? p.niche : 'Freelancer')}{p.location ? ` · ${p.location}` : ''}
            </div>
          </div>
          <div className="flex gap-8 sm:pb-2">
            <Stat value={p.completed_orders || 0} label="Orders" />
            <Stat value={Number(p.average_rating || 0).toFixed(1)} label="Rating" />
            <Stat value={timeAgo(data.created_at).replace(' ago', '')} label="On platform" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-8 border-b border-line text-sm">
          {(['listings', 'reviews', 'about'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 capitalize ${tab === t ? 'text-white border-b-2 border-purple-accent -mb-px' : 'text-txt-dim'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === 'listings' && (
            data.listings?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.listings.map((l) => (
                  <FreelancerCard
                    key={l.id}
                    listing={{
                      ...l, freelancer_id: data.id, freelancer_name: data.name, avatar_url: p.avatar_url,
                      average_rating: p.average_rating, review_count: p.review_count, location: p.location,
                    }}
                  />
                ))}
              </div>
            ) : <p className="text-txt-dim">No active listings.</p>
          )}

          {tab === 'reviews' && (
            data.reviews?.length ? (
              <div className="flex flex-col gap-4 max-w-2xl">
                {data.reviews.map((r) => (
                  <div key={r.id} className="bg-card rounded-lg p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{r.reviewer_name}</span>
                      <Stars value={r.rating} />
                    </div>
                    <p className="text-sm text-txt-dim mt-2">{r.comment}</p>
                    <div className="text-xs text-txt-mute mt-1">{timeAgo(r.created_at)}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-txt-dim">No reviews yet.</p>
          )}

          {tab === 'about' && (
            <div className="max-w-2xl flex flex-col gap-6">
              {p.bio && <p className="text-txt-dim leading-relaxed">{p.bio}</p>}

              {isCreator && socials.length > 0 && (
                <div>
                  <h3 className="text-sm text-txt-dim mb-3">Platforms</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {socials.map(([name, handle, followers]) => (
                      <div key={name} className="bg-card rounded-lg p-4">
                        <div className="text-sm">{name}</div>
                        <div className="text-xs text-txt-dim mt-1">{handle}</div>
                        <div className="text-purple-light text-sm mt-2 tabular-nums">{Number(followers || 0).toLocaleString()} followers</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-8 mt-4 text-sm">
                    {p.engagement_rate != null && p.engagement_rate > 0 && <div><span className="text-txt-dim">Engagement: </span>{p.engagement_rate}%</div>}
                    {p.rate_per_post_usdc != null && p.rate_per_post_usdc > 0 && <div><span className="text-txt-dim">Rate / post: </span>{usdc(p.rate_per_post_usdc)}</div>}
                  </div>
                </div>
              )}

              {p.skills && p.skills.length > 0 && (
                <div>
                  <h3 className="text-sm text-txt-dim mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">{p.skills.map((s) => <Pill key={s}>{s}</Pill>)}</div>
                </div>
              )}

              {p.portfolio_links && p.portfolio_links.length > 0 && (
                <div>
                  <h3 className="text-sm text-txt-dim mb-2">Portfolio</h3>
                  <div className="flex flex-col gap-2">
                    {p.portfolio_links.map((link, i) => (
                      <a key={i} href={safeHref(link)} target="_blank" rel="noreferrer" className="text-purple-light hover:underline text-sm break-all">{link}</a>
                    ))}
                  </div>
                </div>
              )}

              {p.wallet_address && (
                <div className="text-sm">
                  <span className="text-txt-dim">Payout wallet: </span>
                  <span className="tabular-nums">{shortAddr(p.wallet_address)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

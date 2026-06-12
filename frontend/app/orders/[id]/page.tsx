'use client';
import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useWallet } from '@/lib/wallet';
import { useToast } from '@/components/Toast';
import { getSocket } from '@/lib/socket';
import { Avatar, Button, Input, StatusBadge, Skeleton } from '@/components/ui';
import { usdc, timeAgo, shortHash, explorerTx, safeHref, ORDER_STEPS, STATUS_META } from '@/lib/format';
import { friendly } from '@/lib/errors';
import { fundEscrow as fundEscrowOnChain, markSatisfiedOnChain, markCancelledOnChain } from '@/lib/escrowChain';
import type { Order, Message, OrderStatus } from '@/lib/types';

// ---- status tracker (purple-filled completed steps) ----
function Tracker({ status }: { status: OrderStatus }) {
  const idx = ORDER_STEPS.indexOf(status);
  const terminal = (['COMPLETED', 'CANCELLED', 'DISPUTED'] as OrderStatus[]).includes(status);
  return (
    <div className="flex flex-col gap-2">
      {ORDER_STEPS.map((s, i) => {
        const done = idx >= 0 && i <= idx;
        return (
          <div key={s} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${done ? 'bg-purple-accent' : 'bg-white/15'}`} />
            <span className={`text-sm ${done ? 'text-white' : 'text-txt-mute'}`}>{STATUS_META[s].label}</span>
          </div>
        );
      })}
      {terminal && status !== 'COMPLETED' && (
        <div className="flex items-center gap-3 mt-1">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-sm text-white">{STATUS_META[status].label}</span>
        </div>
      )}
    </div>
  );
}

// ---- chat message bubble ----
function Bubble({ m, mine }: { m: Message; mine: boolean }) {
  if (m.message_type === 'system') {
    return <div className="text-center text-xs text-txt-mute py-1">{m.content}</div>;
  }
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-lg px-3.5 py-2.5 text-sm ${mine ? 'bg-white text-bg' : 'bg-surface text-white/90'}`}>
        {!mine && <div className="text-xs text-txt-mute mb-1">{m.sender_name}</div>}
        {m.message_type === 'offer' && <div className={`text-xs mb-1 ${mine ? 'text-bg/60' : 'text-purple-light'}`}>Offer</div>}
        {m.message_type === 'delivery' && <div className={`text-xs mb-1 ${mine ? 'text-bg/60' : 'text-purple-light'}`}>Delivery</div>}
        {m.content && <div className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</div>}
        {m.file_url && (
          <a href={safeHref(m.file_url)} target="_blank" rel="noreferrer"
            className={`block mt-1 break-all underline ${mine ? 'text-bg/80' : 'text-purple-light'}`}>
            {m.file_url}
          </a>
        )}
        <div className={`text-[10px] mt-1 ${mine ? 'text-bg/50' : 'text-txt-mute'}`}>{timeAgo(m.sent_at)}</div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { user, loading } = useAuth();
  const { address } = useWallet();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [showFile, setShowFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const refreshOrder = useCallback(async () => {
    const d = await api<{ order: Order }>(`/api/orders/${id}`);
    setOrder(d.order);
  }, [id]);

  // initial load
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/'); return; }
    (async () => {
      try {
        await refreshOrder();
        const { messages } = await api<{ messages: Message[] }>(`/api/orders/${id}/messages`);
        setMessages(messages || []);
      } catch (e) {
        const status = (e as ApiError).status;
        if (status === 404 || status === 403) setNotFound(true);
      }
    })();
  }, [id, user, loading, router, refreshOrder]);

  // socket realtime
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('order:join', id);
    const onMsg = (m: Message) => setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
    const onStatus = ({ status }: { status: OrderStatus }) => setOrder((o) => (o ? { ...o, status } : o));
    socket.on('message', onMsg);
    socket.on('status', onStatus);
    return () => {
      socket.emit('order:leave', id);
      socket.off('message', onMsg); socket.off('status', onStatus);
    };
  }, [id, user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const act = async (fn: () => Promise<void>, successMsg?: string) => {
    setBusy(true);
    try { await fn(); if (successMsg) toast.success(successMsg); await refreshOrder(); }
    catch (e) { toast.error(friendly(e)); }
    finally { setBusy(false); }
  };

  const send = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() && !fileUrl.trim()) return;
    const body = { content: input || undefined, file_url: fileUrl || undefined, message_type: 'text' as const };
    setInput(''); setFileUrl(''); setShowFile(false);
    try { await api(`/api/orders/${id}/messages`, { method: 'POST', body }); }
    catch (e) { toast.error(friendly(e)); }
  };

  if (notFound) return <div className="max-w-container mx-auto px-5 py-20 text-txt-dim">Order not found or not yours.</div>;
  if (!order || !user) return <div className="max-w-container mx-auto px-5 py-10"><Skeleton className="h-[70vh]" /></div>;

  const isClient = order.client_id === user.id;
  const isFreelancer = order.freelancer_id === user.id;
  const mySatisfied = isClient ? order.client_satisfied : order.freelancer_satisfied;
  const fee = Number(order.amount_usdc) * Number(process.env.NEXT_PUBLIC_PLATFORM_FEE || 0.02);
  const payout = Number(order.amount_usdc) - fee;
  const funded = (['FUNDED', 'IN_PROGRESS', 'DELIVERED', 'REVIEWING', 'COMPLETED'] as OrderStatus[]).includes(order.status);
  const terminal = (['COMPLETED', 'CANCELLED'] as OrderStatus[]).includes(order.status);

  // composite actions
  // Funding: backend deploys the escrow, then the client's wallet approves USDC and locks it.
  const fundEscrow = () => act(async () => {
    if (!address) throw new Error('Connect your wallet first');
    const dep = await api<{ escrowAddress: string; usdcAddress: string; amountUsdc: number }>(
      '/api/payments/escrow/deploy', { method: 'POST', body: { order_id: Number(id) } }
    );
    const lockTx = await fundEscrowOnChain({
      escrowAddress: dep.escrowAddress,
      usdcAddress: dep.usdcAddress,
      amountUsdc: dep.amountUsdc,
      orderId: Number(id),
      from: address,
    });
    await api(`/api/orders/${id}/sync`, { method: 'POST', body: { tx_hash: lockTx } });
  }, 'Escrow funded on Arc');

  // Satisfaction: each party signs markSatisfied(); the contract releases when both have.
  const satisfy = () => act(async () => {
    if (!address) throw new Error('Connect your wallet first');
    if (!order.escrow_contract_address) throw new Error('Escrow is not funded yet');
    const tx = await markSatisfiedOnChain(order.escrow_contract_address, address);
    await api(`/api/orders/${id}/sync`, { method: 'POST', body: { tx_hash: tx } });
  }, 'Marked satisfied');

  // Cancel: pre-funding closes off-chain; a funded order is cancelled on-chain (both must cancel to refund).
  const cancel = () => act(async () => {
    if (funded && order.escrow_contract_address) {
      if (!address) throw new Error('Connect your wallet first');
      const tx = await markCancelledOnChain(order.escrow_contract_address, address);
      await api(`/api/orders/${id}/sync`, { method: 'POST', body: { tx_hash: tx } });
    } else {
      await api(`/api/orders/${id}/cancel`, { method: 'POST', body: {} });
    }
  }, 'Cancellation recorded');

  const accept = () => act(async () => { await api(`/api/orders/${id}/accept`, { method: 'POST', body: {} }); }, 'Agreed. Hirer can now fund the escrow.');

  const adjustPrice = () => {
    const raw = window.prompt('New price in USDC:', String(Number(order.amount_usdc)));
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a positive number'); return; }
    act(async () => {
      await api(`/api/orders/${id}/adjust-price`, { method: 'POST', body: { amount_usdc: amount } });
    }, `Price adjusted to ${amount} USDC. Freelancer must re-accept.`);
  };
  const deliver = () => act(async () => {
    await api(`/api/orders/${id}/deliver`, { method: 'POST', body: { note: 'Delivered. See files in chat.' } });
  }, 'Marked delivered');

  const dispute = () => {
    const reason = window.prompt('Describe the issue for Support Care:');
    if (!reason) return;
    act(async () => { await api(`/api/orders/${id}/dispute`, { method: 'POST', body: { reason } }); }, 'Dispute opened');
  };

  const leaveReview = () => {
    const rating = Number(window.prompt('Rate 1-5:'));
    if (!rating) return;
    const comment = window.prompt('Comment (optional):') || '';
    act(async () => { await api('/api/reviews', { method: 'POST', body: { order_id: Number(id), rating, comment } }); }, 'Review submitted');
  };

  return (
    <div className="max-w-container mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* Chat */}
      <div className="bg-card rounded-lg flex flex-col h-[75vh]">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={isClient ? order.freelancer_name : order.client_name}
              src={isClient ? order.freelancer_avatar : order.client_avatar} size={36} />
            <div>
              <div className="font-medium text-sm">{isClient ? order.freelancer_name : order.client_name}</div>
              <div className="text-xs text-txt-mute">Order #{order.id}</div>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
          {messages.map((m) => <Bubble key={m.id} m={m} mine={m.sender_id === user.id} />)}
        </div>

        {!terminal && (
          <div className="border-t border-line px-4 py-3">
            {showFile && (
              <Input className="mb-2" placeholder="Paste a file link (Drive, Behance, Dribbble…)"
                value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
            )}
            <form onSubmit={send} className="flex flex-col sm:flex-row gap-2">
              <Input className="sm:flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message…" />
              <div className="flex gap-2">
                <Button type="button" variant="subtle" onClick={() => setShowFile((v) => !v)}>Link</Button>
                <Button type="submit" className="ml-auto">Send</Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Order panel */}
      <aside className="flex flex-col gap-4">
        {/* Escrow */}
        <div className="bg-card rounded-lg p-5">
          <div className="text-sm text-txt-dim">Escrow amount</div>
          <div className="text-2xl font-medium text-purple-light mt-1">{usdc(order.amount_usdc)}</div>
          <div className="mt-3 text-sm flex flex-col gap-1.5">
            <div className="flex justify-between"><span className="text-txt-dim">Platform fee (2%)</span><span>{usdc(fee)}</span></div>
            <div className="flex justify-between"><span className="text-txt-dim">Freelancer receives</span><span>{usdc(payout)}</span></div>
            <div className="flex justify-between">
              <span className="text-txt-dim">Escrow</span>
              <span className={funded ? 'text-ok' : 'text-txt-mute'}>{funded ? 'Locked on Arc' : 'Not funded'}</span>
            </div>
          </div>
          {order.arc_tx_hash && (
            <a href={explorerTx(order.arc_tx_hash)} target="_blank" rel="noreferrer"
              className="text-xs text-purple-light hover:underline mt-3 block break-all tabular-nums">
              Tx {shortHash(order.arc_tx_hash)}
            </a>
          )}
        </div>

        {/* Status tracker */}
        <div className="bg-card rounded-lg p-5">
          <div className="text-sm text-txt-dim mb-3">Order status</div>
          <Tracker status={order.status} />
        </div>

        {/* Satisfaction */}
        <div className="bg-card rounded-lg p-5">
          <div className="text-sm text-txt-dim mb-3">Both parties must agree to release</div>
          <div className="flex justify-between text-sm">
            <span>Client</span>
            <span className={order.client_satisfied ? 'text-ok' : 'text-txt-mute'}>{order.client_satisfied ? 'Satisfied' : 'Pending'}</span>
          </div>
          <div className="flex justify-between text-sm mt-1.5">
            <span>Freelancer</span>
            <span className={order.freelancer_satisfied ? 'text-ok' : 'text-txt-mute'}>{order.freelancer_satisfied ? 'Satisfied' : 'Pending'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card rounded-lg p-5 flex flex-col gap-2.5">
          {isFreelancer && (['OFFER_SENT', 'NEGOTIATING'] as OrderStatus[]).includes(order.status) && (
            <Button onClick={accept} disabled={busy}>Agree at {usdc(order.amount_usdc)}</Button>
          )}
          {isClient && (['OFFER_SENT', 'NEGOTIATING', 'ACCEPTED'] as OrderStatus[]).includes(order.status) && (
            <Button variant="ghost" onClick={adjustPrice} disabled={busy}>Adjust price</Button>
          )}
          {isClient && order.status === 'ACCEPTED' && (
            <>
              {!address && <p className="text-xs text-txt-mute">Connect a wallet from the navbar to fund.</p>}
              <Button onClick={fundEscrow} disabled={busy || !address}>Fund escrow · {usdc(order.amount_usdc)}</Button>
              <p className="text-xs text-txt-mute leading-relaxed">
                Your wallet will pop up twice: once to allow the USDC, once to lock it in escrow.
              </p>
            </>
          )}
          {isClient && (['OFFER_SENT', 'NEGOTIATING'] as OrderStatus[]).includes(order.status) && (
            <p className="text-xs text-txt-mute">Waiting for the freelancer to accept at the current price. You can adjust the price above.</p>
          )}
          {isFreelancer && funded && !(['DELIVERED', 'REVIEWING', 'COMPLETED'] as OrderStatus[]).includes(order.status) && (
            <Button onClick={deliver} disabled={busy} variant="ghost">Submit delivery</Button>
          )}
          {!terminal && funded && (
            <Button variant="success" onClick={satisfy} disabled={busy || !!mySatisfied}>
              {mySatisfied ? 'You marked satisfied' : 'I am satisfied'}
            </Button>
          )}
          {!terminal && (
            <Button variant="danger" onClick={cancel} disabled={busy}>Cancel order</Button>
          )}
          {!terminal && funded && (
            <Button variant="subtle" onClick={dispute} disabled={busy}>Open dispute</Button>
          )}
          {order.status === 'COMPLETED' && (
            <Button onClick={leaveReview} disabled={busy}>Leave a review</Button>
          )}
        </div>

      </aside>
    </div>
  );
}

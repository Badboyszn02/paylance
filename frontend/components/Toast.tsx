'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Tone = 'default' | 'ok' | 'danger';

interface ToastApi {
  info: (m: string) => void;
  success: (m: string) => void;
  error: (m: string) => void;
}

interface ToastItem {
  id: string;
  message: string;
  tone: Tone;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: Tone = 'default') => {
    const id = Math.random().toString(36).slice(2);
    let added = false;
    setToasts((t) => {
      // Dedupe: if the same message+tone is already showing, don't stack another.
      if (t.some((x) => x.message === message && x.tone === tone)) return t;
      added = true;
      return [...t, { id, message, tone }];
    });
    if (added) {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }
  }, []);

  const toast: ToastApi = {
    info: (m) => push(m, 'default'),
    success: (m) => push(m, 'ok'),
    error: (m) => push(m, 'danger'),
  };

  const toneBar: Record<Tone, string> = { ok: 'bg-ok', danger: 'bg-danger', default: 'bg-purple-accent' };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[320px] max-w-[90vw]">
        {toasts.map((t) => (
          <div key={t.id} className="fadein bg-white/[0.06] backdrop-blur text-sm flex">
            <div className={`w-[3px] ${toneBar[t.tone]}`} />
            <div className="px-4 py-3 text-white/90">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#0a0a0f', color: '#fff', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '6rem 1.5rem' }}>
          <div style={{
            fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase',
            letterSpacing: '0.18em', fontSize: 11, color: '#67E8F9', marginBottom: 20,
          }}>
            Application error
          </div>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.3, fontWeight: 500, margin: 0 }}>
            Something went wrong loading PayLance.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 24, lineHeight: 1.7 }}>
            The app failed to start. Try reloading. If this keeps happening, check your connection.
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                background: '#0891B2', color: '#fff', border: 0, padding: '0.7rem 1.2rem',
                borderRadius: 8, cursor: 'pointer', fontSize: 14,
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                color: '#fff', border: '1px solid rgba(255,255,255,0.16)',
                padding: '0.7rem 1.2rem', borderRadius: 8, textDecoration: 'none', fontSize: 14,
              }}
            >
              Go home
            </a>
          </div>
          {error.digest && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 40, fontFamily: 'ui-monospace, monospace' }}>
              Ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

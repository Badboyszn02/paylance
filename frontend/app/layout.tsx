import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '@/lib/auth';
import { WalletProvider } from '@/lib/wallet';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';

// Local Geist (bundled) — no Google Fonts network dependency.
// Product sans for UI; mono for wallets / amounts / labels.

export const metadata: Metadata = {
  title: {
    default: 'PayLance · Freelance & creator marketplace on Arc',
    template: '%s · PayLance',
  },
  description:
    'Hire freelancers and creators and pay in USDC with on-chain escrow on the Arc network. Funds release only when both sides are satisfied.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans bg-bg text-white min-h-[100dvh] flex flex-col overflow-x-hidden antialiased">
        <AuthProvider>
          <WalletProvider>
            <ToastProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-bg focus:px-3 focus:py-2 focus:rounded-md"
              >
                Skip to content
              </a>
              <Navbar />
              <main id="main" className="fadein flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
                {children}
              </main>
              <Footer />
              <MobileNav />
            </ToastProvider>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

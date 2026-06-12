'use client';
// Compat shim: auth state now lives in WalletProvider (wallet-only sign-in).
import { useWallet } from './wallet';
import type { User } from './types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthValue {
  const w = useWallet();
  return {
    user: w.user,
    loading: w.loadingUser,
    logout: w.disconnect,
    refresh: w.refreshUser,
  };
}

// No-op provider kept for layout compatibility; real provider is WalletProvider.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

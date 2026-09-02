'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api } from './api';
import { resetSocket } from './socket';
import type { User } from './types';

// Wallet connect = sign-in. No email/password. JWT expires after 2h.

interface WalletValue {
  address: string | null;
  chainOk: boolean;
  connecting: boolean;
  chainId: number;
  user: User | null;
  loadingUser: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  refreshUser: () => Promise<void>;
  switchToArc: () => Promise<void>;
}

const WalletCtx = createContext<WalletValue | null>(null);
const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002);
const ARC_CHAIN_HEX = '0x' + ARC_CHAIN_ID.toString(16);
const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network';
const ARC_EXPLORER = process.env.NEXT_PUBLIC_ARC_EXPLORER || 'https://testnet.arcscan.app';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainOk, setChainOk] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('paylance_token');
    if (!token) { setUser(null); setLoadingUser(false); return; }
    try {
      const { user } = await api<{ user: User }>('/api/auth/me');
      setUser(user);
    } catch {
      localStorage.removeItem('paylance_token');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  /** Ask the wallet what chain it is actually on. `chainOk` starts optimistic,
      so without this a restored session renders a green "on Arc" dot for a
      wallet sitting on mainnet until the user happens to switch networks. */
  const syncChain = useCallback(async (): Promise<void> => {
    const eth = typeof window !== 'undefined' ? window.ethereum : null;
    if (!eth?.request) return;
    try {
      const hex = (await eth.request({ method: 'eth_chainId' })) as string;
      setChainOk(parseInt(hex, 16) === ARC_CHAIN_ID);
    } catch {
      // Wallet locked or unavailable — keep the last known value.
    }
  }, []);

  const disconnect = useCallback((): void => {
    setAddress(null);
    setUser(null);
    localStorage.removeItem('paylance_wallet');
    localStorage.removeItem('paylance_token');
    resetSocket();
  }, []);

  // Restore on mount. The saved address is only a hint — ask the wallet which
  // accounts it still exposes (eth_accounts does not prompt). Trusting
  // localStorage alone kept rendering a connected wallet after the user had
  // revoked this site in MetaMask, or in a browser with no wallet at all.
  useEffect(() => {
    let cancelled = false;

    const clearStale = () => {
      localStorage.removeItem('paylance_wallet');
      localStorage.removeItem('paylance_token');
      if (cancelled) return;
      setAddress(null);
      setUser(null);
      setLoadingUser(false);
    };

    (async () => {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('paylance_wallet');
      if (!saved) { await refreshUser(); return; }

      const eth = window.ethereum;
      if (!eth?.request) { clearStale(); return; }

      try {
        const accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
        const live = accounts?.find((a) => a.toLowerCase() === saved.toLowerCase());
        if (cancelled) return;
        if (!live) { clearStale(); return; }
        setAddress(live);
        await syncChain();
      } catch {
        if (!cancelled) setAddress(saved);
      }
      if (!cancelled) await refreshUser();
    })();

    return () => { cancelled = true; };
  }, [refreshUser, syncChain]);

  // listen for in-wallet account / chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum?.on) return;
    const eth = window.ethereum;
    const onAccounts = (accs: unknown) => {
      const list = accs as string[];
      if (!list || list.length === 0) {
        disconnect();
      } else if (list[0].toLowerCase() !== address?.toLowerCase()) {
        // account changed: drop JWT, force re-sign on next connect
        localStorage.removeItem('paylance_token');
        setUser(null);
        setAddress(list[0]);
        localStorage.setItem('paylance_wallet', list[0]);
      }
    };
    const onChain = (hex: unknown) => setChainOk(parseInt(hex as string, 16) === ARC_CHAIN_ID);
    eth.on?.('accountsChanged', onAccounts);
    eth.on?.('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [address, disconnect]);

  async function signIn(wallet: string): Promise<void> {
    const eth = typeof window !== 'undefined' ? window.ethereum : null;
    if (!eth?.request) throw new Error('No wallet extension');

    const { message } = await api<{ message: string }>('/api/auth/nonce', {
      method: 'POST', auth: false, body: { wallet_address: wallet },
    });
    const signature = (await eth.request({
      method: 'personal_sign',
      params: [message, wallet],
    })) as string;

    const { token, user } = await api<{ token: string; user: User }>('/api/auth/verify', {
      method: 'POST', auth: false, body: { wallet_address: wallet, signature },
    });
    localStorage.setItem('paylance_token', token);
    setUser(user);
  }

  const connect = useCallback(async (): Promise<string | null> => {
    setConnecting(true);
    try {
      const eth = typeof window !== 'undefined' ? window.ethereum : null;
      if (!eth?.request) {
        throw new Error('Install a wallet extension (MetaMask, Rabby, Arc App Kit) to sign in.');
      }
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const addr = accounts?.[0];
      if (!addr) throw new Error('No wallet account exposed');
      await syncChain();

      // Sign in if no valid JWT yet
      const existing = localStorage.getItem('paylance_token');
      if (!existing) {
        await signIn(addr);
      } else {
        await refreshUser();
        // if /me failed (expired token), refreshUser cleared it; sign in
        if (!localStorage.getItem('paylance_token')) await signIn(addr);
      }

      // Persist only once the session is real. Writing the address before
      // signing left a stale paylance_wallet behind whenever the user rejected
      // the signature prompt, which then restored as "connected" on reload.
      setAddress(addr);
      localStorage.setItem('paylance_wallet', addr);
      return addr;
    } finally {
      setConnecting(false);
    }
  }, [refreshUser, syncChain]);

  const switchToArc = useCallback(async (): Promise<void> => {
    const eth = typeof window !== 'undefined' ? window.ethereum : null;
    if (!eth?.request) throw new Error('No wallet extension');
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_CHAIN_HEX }],
      });
    } catch (err) {
      // 4902 = chain not yet added in the wallet
      const code = (err as { code?: number }).code;
      if (code === 4902 || code === -32603) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: ARC_CHAIN_HEX,
            chainName: 'Arc',
            nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
            rpcUrls: [ARC_RPC_URL],
            blockExplorerUrls: [ARC_EXPLORER],
          }],
        });
      } else {
        throw err;
      }
    }
    // wallet_addEthereumChain does not reliably emit chainChanged, so the
    // listener alone would leave chainOk stale after adding Arc.
    await syncChain();
  }, [syncChain]);

  return (
    <WalletCtx.Provider value={{
      address, chainOk, connecting, chainId: ARC_CHAIN_ID,
      user, loadingUser, connect, disconnect, refreshUser, switchToArc,
    }}>
      {children}
    </WalletCtx.Provider>
  );
}

export const useWallet = (): WalletValue => {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
};

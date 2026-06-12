// Map wallet / RPC / network errors to short, user-readable strings.
export function friendly(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const m = raw.trim();
  if (!m) return 'Something went wrong. Try again.';

  if (/user rejected|user denied/i.test(m)) return 'Transaction rejected in wallet.';
  if (/insufficient funds/i.test(m))         return 'Wallet does not have enough USDC for this.';
  if (/nonce too low|replacement.*underpriced/i.test(m)) return 'Wallet busy. Try again in a few seconds.';
  if (/underpriced/i.test(m))                return 'Network is busy. Try again.';
  if (/gas/i.test(m) && /estimate/i.test(m)) return 'Could not estimate gas. Try again.';
  if (/timed out|timeout/i.test(m))          return 'Request timed out. Try again.';
  if (/network|failed to fetch|networkerror/i.test(m)) return 'Network error. Check your connection.';
  if (/invalid signature/i.test(m))          return 'Invalid signature. Try connecting your wallet again.';
  if (/nonce expired|no pending nonce/i.test(m)) return 'Session expired. Connect your wallet again.';
  if (/internal json-rpc|json-rpc/i.test(m)) return 'On-chain request failed. Try again.';
  if (/contract|revert/i.test(m))            return 'On-chain request failed. Try again.';
  if (m.startsWith('{') || m.startsWith('['))return 'Something went wrong. Try again.';
  if (m.length > 160)                        return 'Something went wrong. Try again.';
  return m;
}

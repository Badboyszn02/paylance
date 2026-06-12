// Arc escrow orchestration via viem. SIMULATION mode unless ESCROW_FACTORY_ADDRESS and ADMIN_PRIVATE_KEY are set.
import { config } from '../config.js';
import type { EscrowResult } from '../types/models.js';

type Address = `0x${string}`;

let publicClient: any = null;
let walletClient: any = null;
let account: any = null;

const LIVE = Boolean(
  config.arc.escrowFactory &&
  config.arc.escrowFactory !== '0x0000000000000000000000000000000000000000' &&
  config.arc.adminPrivateKey &&
  config.arc.adminPrivateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000'
);

// ABIs mirror contracts/contracts/*.sol
export const FACTORY_ABI = [
  { type: 'function', name: 'createEscrow', stateMutability: 'nonpayable',
    inputs: [
      { name: 'orderId', type: 'uint256' },
      { name: 'client', type: 'address' },
      { name: 'freelancer', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ], outputs: [{ name: 'escrow', type: 'address' }] },
  { type: 'function', name: 'getEscrowAddress', stateMutability: 'view',
    inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] },
] as const;

export const LISTING_REGISTRY_ABI = [
  { type: 'function', name: 'registerListing', stateMutability: 'nonpayable',
    inputs: [{ name: 'listingHash', type: 'bytes32' }], outputs: [] },
  { type: 'event', name: 'ListingPosted', inputs: [
    { name: 'poster', type: 'address', indexed: true },
    { name: 'listingHash', type: 'bytes32', indexed: true },
    { name: 'timestamp', type: 'uint256', indexed: false },
  ] },
] as const;

export const ESCROW_ABI = [
  { type: 'function', name: 'lockFunds', stateMutability: 'nonpayable',
    inputs: [{ name: 'orderId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'markSatisfied', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'markCancelled', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'releaseFunds', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'refundFunds', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'resolveDispute', stateMutability: 'nonpayable',
    inputs: [{ name: 'freelancerAmount', type: 'uint256' }, { name: 'clientAmount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'getOrderDetails', stateMutability: 'view', inputs: [], outputs: [
    { name: 'orderId', type: 'uint256' },
    { name: 'client', type: 'address' },
    { name: 'freelancer', type: 'address' },
    { name: 'platformWallet', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'platformFeePercent', type: 'uint8' },
    { name: 'clientSatisfied', type: 'bool' },
    { name: 'freelancerSatisfied', type: 'bool' },
    { name: 'clientCancelled', type: 'bool' },
    { name: 'freelancerCancelled', type: 'bool' },
    { name: 'status', type: 'uint8' },
    { name: 'createdAt', type: 'uint256' },
  ] },
] as const;

// Mirrors FreelanceEscrow.Status enum.
export type EscrowOnChainStatus = 'Created' | 'Funded' | 'Released' | 'Refunded' | 'Resolved';
const ESCROW_STATUS: EscrowOnChainStatus[] = ['Created', 'Funded', 'Released', 'Refunded', 'Resolved'];

export interface EscrowState {
  status: EscrowOnChainStatus;
  clientSatisfied: boolean;
  freelancerSatisfied: boolean;
  clientCancelled: boolean;
  freelancerCancelled: boolean;
}

async function getClients() {
  if (!LIVE) return null;
  if (publicClient) return { publicClient, walletClient, account };

  const { createPublicClient, createWalletClient, http, defineChain } = await import('viem');
  const { privateKeyToAccount } = await import('viem/accounts');

  const arcChain = defineChain({
    id: config.arc.chainId,
    name: 'Arc',
    nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    rpcUrls: { default: { http: [config.arc.rpcUrl] } },
  });

  account = privateKeyToAccount(config.arc.adminPrivateKey as Address);
  publicClient = createPublicClient({ chain: arcChain, transport: http(config.arc.rpcUrl) });
  walletClient = createWalletClient({ account, chain: arcChain, transport: http(config.arc.rpcUrl) });
  return { publicClient, walletClient, account };
}

// USDC = 6 decimals
const toUnits = (usdc: number | string): bigint => BigInt(Math.round(Number(usdc) * 1e6));
const mockTx = (): string => '0x' + [...crypto.getRandomValues(new Uint8Array(32))]
  .map((b) => b.toString(16).padStart(2, '0')).join('');
const mockAddr = (): string => '0x' + [...crypto.getRandomValues(new Uint8Array(20))]
  .map((b) => b.toString(16).padStart(2, '0')).join('');

const ARC_CALL_TIMEOUT_MS = Number(process.env.ARC_CALL_TIMEOUT_MS || 5000);
const ARC_RECEIPT_TIMEOUT_MS = Number(process.env.ARC_RECEIPT_TIMEOUT_MS || 15_000);
const ARC_CALL_RETRIES = Number(process.env.ARC_CALL_RETRIES || 3);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Hard deadline + backoff retry so an unreachable RPC can't stall a request forever.
async function arcCall<T>(label: string, fn: () => Promise<T>, timeoutMs = ARC_CALL_TIMEOUT_MS): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= ARC_CALL_RETRIES; attempt++) {
    try {
      return await Promise.race<T>([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`arc:${label} timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
    } catch (err) {
      lastErr = err;
      const msg = (err as Error)?.message || String(err);
      console.warn(`[arc] ${label} attempt ${attempt}/${ARC_CALL_RETRIES} failed: ${msg}`);
      if (attempt < ARC_CALL_RETRIES) await sleep(250 * 2 ** (attempt - 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`arc:${label} failed`);
}

interface WriteOpts {
  waitForReceipt?: boolean;
}

async function writeFactory(functionName: string, args: unknown[], opts: WriteOpts = {}): Promise<EscrowResult> {
  const clients = await getClients();
  if (!clients) return { txHash: mockTx(), simulated: true };
  const hash = await arcCall<string>(`factory.${functionName}.submit`, () =>
    clients.walletClient.writeContract({
      address: config.arc.escrowFactory as Address, abi: FACTORY_ABI, functionName, args,
    })
  );
  if (opts.waitForReceipt !== false) {
    await arcCall(
      `factory.${functionName}.receipt`,
      () => clients.publicClient.waitForTransactionReceipt({ hash }),
      ARC_RECEIPT_TIMEOUT_MS
    );
  }
  return { txHash: hash, simulated: false };
}

async function writeEscrow(
  escrowAddress: string, functionName: string, args: unknown[] = [], opts: WriteOpts = {}
): Promise<EscrowResult> {
  const clients = await getClients();
  if (!clients) return { txHash: mockTx(), simulated: true };
  const hash = await arcCall<string>(`escrow.${functionName}.submit`, () =>
    clients.walletClient.writeContract({
      address: escrowAddress as Address, abi: ESCROW_ABI, functionName, args,
    })
  );
  if (opts.waitForReceipt !== false) {
    await arcCall(
      `escrow.${functionName}.receipt`,
      () => clients.publicClient.waitForTransactionReceipt({ hash }),
      ARC_RECEIPT_TIMEOUT_MS
    );
  }
  return { txHash: hash, simulated: false };
}

// Fire-and-forget: logs if a tx reverts after the HTTP response already returned.
export function watchReceipt(label: string, txHash: string): void {
  if (!LIVE) return;
  (async () => {
    try {
      const clients = await getClients();
      if (!clients) return;
      const receipt = await arcCall(
        `watch.${label}`,
        () => clients.publicClient.waitForTransactionReceipt({ hash: txHash as Address }),
        ARC_RECEIPT_TIMEOUT_MS * 2
      );
      if ((receipt as { status: string }).status !== 'success') {
        console.error(`[arc] ${label} tx ${txHash} reverted on-chain`);
      }
    } catch (err) {
      console.error(`[arc] ${label} receipt watch failed for ${txHash}:`, (err as Error).message);
    }
  })();
}

interface CreateParams {
  orderId: number;
  clientAddress: string;
  freelancerAddress: string;
  amountUsdc: number | string;
}

export const arc = {
  live: LIVE,

  // Deploys the per-order escrow. The client funds it themselves via lockFunds().
  async createEscrow({ orderId, clientAddress, freelancerAddress, amountUsdc }: CreateParams): Promise<EscrowResult> {
    const res = await writeFactory('createEscrow', [
      BigInt(orderId), clientAddress, freelancerAddress, toUnits(amountUsdc),
    ]);
    let escrowAddress = mockAddr();
    if (!res.simulated) {
      const clients = await getClients();
      escrowAddress = await arcCall<string>(
        'factory.getEscrowAddress',
        () => clients!.publicClient.readContract({
          address: config.arc.escrowFactory as Address, abi: FACTORY_ABI,
          functionName: 'getEscrowAddress', args: [BigInt(orderId)],
        })
      );
    }
    return { ...res, escrowAddress };
  },

  lockFunds(params: CreateParams): Promise<EscrowResult> { return this.createEscrow(params); },

  // Live on-chain escrow state; the DB mirrors this. Null in simulation mode.
  async readEscrow(escrowAddress: string): Promise<EscrowState | null> {
    const clients = await getClients();
    if (!clients) return null;
    const d = await arcCall<readonly unknown[]>(
      'escrow.getOrderDetails',
      () => clients.publicClient.readContract({
        address: escrowAddress as Address, abi: ESCROW_ABI, functionName: 'getOrderDetails',
      })
    );
    return {
      status: ESCROW_STATUS[Number(d[10])] ?? 'Created',
      clientSatisfied: Boolean(d[6]),
      freelancerSatisfied: Boolean(d[7]),
      clientCancelled: Boolean(d[8]),
      freelancerCancelled: Boolean(d[9]),
    };
  },

  // Submit-and-return; watchReceipt logs any later revert.
  releaseFunds({ escrowAddress }: { escrowAddress: string }): Promise<EscrowResult> {
    return writeEscrow(escrowAddress, 'releaseFunds', [], { waitForReceipt: false });
  },

  refundFunds({ escrowAddress }: { escrowAddress: string }): Promise<EscrowResult> {
    return writeEscrow(escrowAddress, 'refundFunds', [], { waitForReceipt: false });
  },

  resolveDispute(
    { escrowAddress, freelancerAmountUsdc, clientAmountUsdc }:
    { escrowAddress: string; freelancerAmountUsdc: number; clientAmountUsdc: number }
  ): Promise<EscrowResult> {
    return writeEscrow(escrowAddress, 'resolveDispute',
      [toUnits(freelancerAmountUsdc), toUnits(clientAmountUsdc)],
      { waitForReceipt: false }
    );
  },
};

// ---------- ListingRegistry verification ----------
// Read-only (no admin key needed); confirms a listing's on-chain registration tx.

let readOnlyClient: any = null;
async function getReadOnlyClient() {
  if (readOnlyClient) return readOnlyClient;
  const { createPublicClient, http, defineChain } = await import('viem');
  const arcChain = defineChain({
    id: config.arc.chainId,
    name: 'Arc',
    nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    rpcUrls: { default: { http: [config.arc.rpcUrl] } },
  });
  readOnlyClient = createPublicClient({ chain: arcChain, transport: http(config.arc.rpcUrl) });
  return readOnlyClient;
}

export interface ListingProof {
  txHash: string;
  listingHash: string;
  posterAddress: string;
}

/** Verify that `txHash` is a successful ListingPosted event matching the given hash + poster. */
export async function verifyListingTx({ txHash, listingHash, posterAddress }: ListingProof): Promise<void> {
  if (!config.arc.listingRegistry) {
    throw new Error('LISTING_REGISTRY_ADDRESS is not configured on the server');
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error('Invalid tx hash');
  if (!/^0x[0-9a-fA-F]{64}$/.test(listingHash)) throw new Error('Invalid listing hash');

  const client = await getReadOnlyClient();
  const { decodeEventLog, getAddress } = await import('viem');

  const receipt = await arcCall<any>('registry.getReceipt', () =>
    client.waitForTransactionReceipt({ hash: txHash as Address }),
    ARC_RECEIPT_TIMEOUT_MS
  );
  if (receipt.status !== 'success') throw new Error('Listing registration tx reverted on-chain');

  const expectedRegistry = getAddress(config.arc.listingRegistry as string);
  const expectedPoster = getAddress(posterAddress);
  const expectedHash = listingHash.toLowerCase();

  const match = (receipt.logs as Array<{ address: Address; topics: [Address, ...Address[]] | []; data: Address }>).find((log) => {
    if (getAddress(log.address) !== expectedRegistry) return false;
    try {
      const decoded = decodeEventLog({
        abi: LISTING_REGISTRY_ABI,
        data: log.data,
        topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
      }) as { eventName: string; args: { poster: string; listingHash: string } };
      if (decoded.eventName !== 'ListingPosted') return false;
      return getAddress(decoded.args.poster) === expectedPoster
        && decoded.args.listingHash.toLowerCase() === expectedHash;
    } catch { return false; }
  });
  if (!match) throw new Error('Tx does not contain a matching ListingPosted event from this wallet');
}

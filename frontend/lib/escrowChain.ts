// Wallet-driven escrow actions; the contract auto-releases/refunds on the second signature.
import {
  createWalletClient, createPublicClient, custom, http, defineChain, type Hex,
} from 'viem';

const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002);
const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network';

const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: [ARC_RPC_URL] } },
});

const USDC_ABI = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
] as const;

const ESCROW_ABI = [
  { type: 'function', name: 'lockFunds', stateMutability: 'nonpayable',
    inputs: [{ name: 'orderId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'markSatisfied', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'markCancelled', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const;

const toUnits = (usdc: number): bigint => BigInt(Math.round(usdc * 1e6));

function clients(from: Hex) {
  const eth = typeof window !== 'undefined' ? window.ethereum : null;
  if (!eth) throw new Error('No wallet extension detected');
  const wallet = createWalletClient({ account: from, chain: arcChain, transport: custom(eth) });
  const pub = createPublicClient({ chain: arcChain, transport: http(ARC_RPC_URL) });
  return { wallet, pub };
}

export interface FundParams {
  escrowAddress: string;
  usdcAddress: string;
  amountUsdc: number;
  orderId: number;
  from: string;
}

export async function fundEscrow(p: FundParams): Promise<Hex> {
  const from = p.from as Hex;
  const escrow = p.escrowAddress as Hex;
  const usdc = p.usdcAddress as Hex;
  const amount = toUnits(p.amountUsdc);
  const { wallet, pub } = clients(from);

  const allowance = await pub.readContract({
    address: usdc, abi: USDC_ABI, functionName: 'allowance', args: [from, escrow],
  }) as bigint;

  if (allowance < amount) {
    const approveTx = await wallet.writeContract({
      address: usdc, abi: USDC_ABI, functionName: 'approve', args: [escrow, amount],
    });
    await pub.waitForTransactionReceipt({ hash: approveTx });
  }

  const lockTx = await wallet.writeContract({
    address: escrow, abi: ESCROW_ABI, functionName: 'lockFunds', args: [BigInt(p.orderId), amount],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash: lockTx });
  if (receipt.status !== 'success') throw new Error('Locking funds reverted on Arc');
  return lockTx;
}

export async function markSatisfiedOnChain(escrowAddress: string, from: string): Promise<Hex> {
  const { wallet, pub } = clients(from as Hex);
  const tx = await wallet.writeContract({
    address: escrowAddress as Hex, abi: ESCROW_ABI, functionName: 'markSatisfied',
  });
  const receipt = await pub.waitForTransactionReceipt({ hash: tx });
  if (receipt.status !== 'success') throw new Error('Transaction reverted on Arc');
  return tx;
}

export async function markCancelledOnChain(escrowAddress: string, from: string): Promise<Hex> {
  const { wallet, pub } = clients(from as Hex);
  const tx = await wallet.writeContract({
    address: escrowAddress as Hex, abi: ESCROW_ABI, functionName: 'markCancelled',
  });
  const receipt = await pub.waitForTransactionReceipt({ hash: tx });
  if (receipt.status !== 'success') throw new Error('Transaction reverted on Arc');
  return tx;
}

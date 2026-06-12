import { createPublicClient, http, defineChain, type Hex } from 'viem';

const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002);
const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network';
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '') as Hex;

const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: [ARC_RPC_URL] } },
});

const USDC_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

export async function getUsdcBalance(address: string): Promise<number> {
  if (!USDC_ADDRESS || USDC_ADDRESS === '0x') throw new Error('USDC address not configured');
  const pub = createPublicClient({ chain: arcChain, transport: http(ARC_RPC_URL) });
  const raw = await pub.readContract({
    address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'balanceOf', args: [address as Hex],
  }) as bigint;
  return Number(raw) / 1e6;
}

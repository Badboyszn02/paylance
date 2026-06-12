import {
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  custom,
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  type Hex,
} from 'viem';

const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002);
const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network';
const REGISTRY = (process.env.NEXT_PUBLIC_LISTING_REGISTRY || '') as `0x${string}`;

const REGISTRY_ABI = [
  { type: 'function', name: 'registerListing', stateMutability: 'nonpayable',
    inputs: [{ name: 'listingHash', type: 'bytes32' }], outputs: [] },
] as const;

const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: [ARC_RPC_URL] } },
});

export interface ListingFields {
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  poster: `0x${string}`;
}

export function computeListingHash(f: ListingFields): Hex {
  const priceUnits = BigInt(Math.round(f.price_usdc * 1e6));
  const encoded = encodeAbiParameters(
    [
      { type: 'string' }, { type: 'string' }, { type: 'uint256' },
      { type: 'uint32' }, { type: 'string' }, { type: 'address' },
    ],
    [f.title, f.description, priceUnits, f.delivery_days, f.category, f.poster]
  );
  return keccak256(encoded);
}

export interface RegisterResult {
  txHash: Hex;
  listingHash: Hex;
}

/** Sign and submit registerListing() through the connected injected wallet, wait for receipt. */
export async function registerListingOnChain(fields: ListingFields): Promise<RegisterResult> {
  if (!REGISTRY || REGISTRY === '0x') {
    throw new Error('Listing registry address is not configured');
  }
  const eth = typeof window !== 'undefined' ? window.ethereum : null;
  if (!eth) throw new Error('No wallet extension detected');

  const listingHash = computeListingHash(fields);
  const data = encodeFunctionData({
    abi: REGISTRY_ABI,
    functionName: 'registerListing',
    args: [listingHash],
  });

  const walletClient = createWalletClient({ chain: arcChain, transport: custom(eth) });
  const publicClient = createPublicClient({ chain: arcChain, transport: http(ARC_RPC_URL) });

  const txHash = (await eth.request({
    method: 'eth_sendTransaction',
    params: [{ from: fields.poster, to: REGISTRY, data }],
  })) as Hex;

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') throw new Error('Registration tx reverted on Arc');

  // Silence unused-var lint without changing the public client behaviour above.
  void walletClient;

  return { txHash, listingHash };
}

import dotenv from 'dotenv';
dotenv.config();

// The dev fallback is public in this repo; refuse to boot on it in production.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[config] JWT_SECRET must be set in production');
}

export const config = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  arc: {
    rpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
    chainId: Number(process.env.ARC_CHAIN_ID || 5042002),
    usdcAddress: process.env.USDC_TOKEN_ADDRESS,
    escrowFactory: process.env.ESCROW_FACTORY_ADDRESS,
    listingRegistry: process.env.LISTING_REGISTRY_ADDRESS,
    adminPrivateKey: process.env.ADMIN_PRIVATE_KEY,
  },
  platformWallet: process.env.PLATFORM_WALLET,
  platformFee: Number(process.env.PLATFORM_FEE || 0.02),
} as const;

if (!config.databaseUrl) {
  console.warn('[config] DATABASE_URL is not set; the API will fail on DB calls.');
}

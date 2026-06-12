require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const {
  ARC_RPC_URL = "https://rpc.arc.io",
  ARC_CHAIN_ID = "5042002",
  PRIVATE_KEY,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local in-memory chain for `npm test`
    hardhat: {},

    // Gas on Arc is paid in USDC, not ETH; fund the deployer from https://faucet.circle.com
    arcTestnet: {
      url: ARC_RPC_URL,
      chainId: Number(ARC_CHAIN_ID),
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  // Block-explorer verification (arcscan). Update the URLs/key as Arc documents them.
  etherscan: {
    apiKey: { arcTestnet: process.env.ARCSCAN_API_KEY || "no-key-needed" },
    customChains: [
      {
        network: "arcTestnet",
        chainId: Number(ARC_CHAIN_ID),
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
    ],
  },
};

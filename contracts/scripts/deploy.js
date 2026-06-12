// Deploys the upgradeable escrow system:
//   1. UpgradeableBeacon holding the FreelanceEscrow implementation
//   2. EscrowFactory behind a UUPS proxy (Ownable2Step + Pausable)
//
// Local:  npm run deploy:local   (deploys a MockUSDC first)
// Arc:    npm run deploy:arc      (uses USDC_TOKEN_ADDRESS / PLATFORM_WALLET from .env)
const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  let usdc = process.env.USDC_TOKEN_ADDRESS;
  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;

  if (network.name === "hardhat" || network.name === "localhost") {
    const Mock = await ethers.getContractFactory("MockUSDC");
    const mock = await Mock.deploy();
    await mock.waitForDeployment();
    usdc = await mock.getAddress();
    console.log(`MockUSDC: ${usdc}`);
  }
  if (!usdc || usdc === "0x0000000000000000000000000000000000000000") {
    throw new Error("Set USDC_TOKEN_ADDRESS in .env for a live deploy");
  }

  // 1. Beacon for the per-order escrow implementation
  const Escrow = await ethers.getContractFactory("FreelanceEscrow");
  const beacon = await upgrades.deployBeacon(Escrow);
  await beacon.waitForDeployment();
  const beaconAddr = await beacon.getAddress();
  console.log(`Escrow beacon:   ${beaconAddr}`);

  // 2. Factory as a UUPS proxy, owner = deployer (transfer to a multisig later)
  const Factory = await ethers.getContractFactory("EscrowFactory");
  const factory = await upgrades.deployProxy(
    Factory,
    [beaconAddr, usdc, platformWallet, deployer.address],
    { kind: "uups", initializer: "initialize" }
  );
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();

  const implAddr = await upgrades.erc1967.getImplementationAddress(factoryAddr);

  // 3. ListingRegistry: event-only contract that records listing posts on-chain.
  const Registry = await ethers.getContractFactory("ListingRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`ListingRegistry: ${registryAddr}`);

  const deployment = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    escrowFactoryProxy: factoryAddr,
    escrowFactoryImplementation: implAddr,
    escrowBeacon: beaconAddr,
    listingRegistry: registryAddr,
    usdcToken: usdc,
    platformWallet,
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2) + "\n");

  console.log("\n✓ Deployed");
  console.log(`EscrowFactory (proxy): ${factoryAddr}`);
  console.log(`USDC_TOKEN:            ${usdc}`);
  console.log(`PLATFORM_WALLET:       ${platformWallet}`);
  console.log(`Saved: ${path.relative(process.cwd(), outFile)}`);
  console.log("\nCopy into backend/.env:");
  console.log(`ESCROW_FACTORY_ADDRESS=${factoryAddr}`);
  console.log(`USDC_TOKEN_ADDRESS=${usdc}`);
  console.log("\nManage later:");
  console.log(`  Transfer ownership:  factory.transferOwnership(multisig) then multisig calls acceptOwnership()`);
  console.log(`  Pause:               factory.pause() / factory.unpause()`);
  console.log(`  Upgrade factory:     upgrades.upgradeProxy(${factoryAddr}, NewFactory)`);
  console.log(`  Upgrade all escrows: upgrades.upgradeBeacon(${beaconAddr}, NewEscrow)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

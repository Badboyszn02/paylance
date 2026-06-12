// Deploys ListingRegistry standalone and merges the address into
// contracts/deployments/<network>.json without disturbing the escrow stack.
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const Registry = await ethers.getContractFactory("ListingRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`ListingRegistry: ${registryAddr}`);

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);

  let existing = {};
  if (fs.existsSync(outFile)) {
    try { existing = JSON.parse(fs.readFileSync(outFile, "utf8")); } catch {}
  }
  const merged = {
    ...existing,
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    listingRegistry: registryAddr,
    listingRegistryDeployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outFile, JSON.stringify(merged, null, 2) + "\n");

  console.log(`\nSaved: ${path.relative(process.cwd(), outFile)}`);
  console.log("\nCopy into backend/.env:");
  console.log(`LISTING_REGISTRY_ADDRESS=${registryAddr}`);
  console.log("\nCopy into frontend/.env.local:");
  console.log(`NEXT_PUBLIC_LISTING_REGISTRY=${registryAddr}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

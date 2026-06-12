const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const USDC = (n) => BigInt(n) * 10n ** 6n; // 6 decimals

describe("PayLance escrow (upgradeable)", function () {
  let usdc, beacon, factory, admin, client, freelancer, platform, multisig;

  beforeEach(async function () {
    [admin, client, freelancer, platform, multisig] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockUSDC");
    usdc = await Mock.deploy();
    await usdc.mint(client.address, USDC(1000));

    const Escrow = await ethers.getContractFactory("FreelanceEscrow");
    beacon = await upgrades.deployBeacon(Escrow);

    const Factory = await ethers.getContractFactory("EscrowFactory");
    factory = await upgrades.deployProxy(
      Factory,
      [await beacon.getAddress(), await usdc.getAddress(), platform.address, admin.address],
      { kind: "uups", initializer: "initialize" }
    );
  });

  async function newFundedEscrow(orderId, amount) {
    await factory.connect(admin).createEscrow(orderId, client.address, freelancer.address, amount);
    const escrow = await ethers.getContractAt("FreelanceEscrow", await factory.getEscrowAddress(orderId));
    await usdc.connect(client).approve(await escrow.getAddress(), amount);
    await escrow.connect(client).lockFunds(orderId, amount);
    return escrow;
  }

  it("only owner can create escrows", async function () {
    await expect(
      factory.connect(client).createEscrow(1, client.address, freelancer.address, USDC(100))
    ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
  });

  it("funds escrow and pulls USDC from the client", async function () {
    const escrow = await newFundedEscrow(1, USDC(100));
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(USDC(100));
    expect(await escrow.status()).to.equal(1); // Funded
  });

  it("releases 98% / 2% when both satisfied", async function () {
    const escrow = await newFundedEscrow(2, USDC(100));
    await escrow.connect(client).markSatisfied();
    await expect(escrow.connect(freelancer).markSatisfied()).to.emit(escrow, "FundsReleased");
    expect(await usdc.balanceOf(freelancer.address)).to.equal(USDC(98));
    expect(await usdc.balanceOf(platform.address)).to.equal(USDC(2));
    expect(await escrow.status()).to.equal(2); // Released
  });

  it("refunds the client in full when both cancel", async function () {
    const escrow = await newFundedEscrow(3, USDC(100));
    await escrow.connect(freelancer).markCancelled();
    await expect(escrow.connect(client).markCancelled()).to.emit(escrow, "FundsRefunded");
    expect(await usdc.balanceOf(client.address)).to.equal(USDC(1000));
    expect(await escrow.status()).to.equal(3); // Refunded
  });

  it("cannot release without both satisfied", async function () {
    const escrow = await newFundedEscrow(4, USDC(100));
    await escrow.connect(client).markSatisfied();
    await expect(escrow.connect(client).releaseFunds()).to.be.revertedWith("both must be satisfied");
  });

  it("blocks non-parties from marking satisfied", async function () {
    const escrow = await newFundedEscrow(5, USDC(100));
    await expect(escrow.connect(platform).markSatisfied()).to.be.revertedWith("not a party");
  });

  it("rejects lockFunds from non-client and with wrong amount", async function () {
    await factory.connect(admin).createEscrow(99, client.address, freelancer.address, USDC(100));
    const escrow = await ethers.getContractAt("FreelanceEscrow", await factory.getEscrowAddress(99));
    await usdc.connect(client).approve(await escrow.getAddress(), USDC(100));
    await expect(escrow.connect(freelancer).lockFunds(99, USDC(100))).to.be.revertedWith("only client funds");
    await expect(escrow.connect(client).lockFunds(99, USDC(1))).to.be.revertedWith("wrong amount");
    await expect(escrow.connect(client).lockFunds(99, USDC(100))).to.emit(escrow, "FundsLocked");
  });

  it("owner resolves a dispute splitting amount minus 2% fee", async function () {
    const escrow = await newFundedEscrow(6, USDC(100));
    await expect(escrow.connect(admin).resolveDispute(USDC(60), USDC(38)))
      .to.emit(escrow, "DisputeResolved");
    expect(await usdc.balanceOf(freelancer.address)).to.equal(USDC(60));
    expect(await usdc.balanceOf(platform.address)).to.equal(USDC(2));
  });

  it("rejects dispute split that != amount - fee", async function () {
    const escrow = await newFundedEscrow(7, USDC(100));
    await expect(escrow.connect(admin).resolveDispute(USDC(60), USDC(40)))
      .to.be.revertedWith("split != amount - fee");
  });

  it("only owner can resolve disputes", async function () {
    const escrow = await newFundedEscrow(8, USDC(100));
    await expect(escrow.connect(client).resolveDispute(USDC(98), 0)).to.be.revertedWith("not platform admin");
  });

  // --- new admin-control behavior ---

  it("pause blocks new escrow creation, unpause restores it", async function () {
    await factory.connect(admin).pause();
    await expect(
      factory.connect(admin).createEscrow(9, client.address, freelancer.address, USDC(100))
    ).to.be.revertedWithCustomError(factory, "EnforcedPause");
    await factory.connect(admin).unpause();
    await expect(factory.connect(admin).createEscrow(9, client.address, freelancer.address, USDC(100)))
      .to.emit(factory, "EscrowCreated");
  });

  it("a pause never traps funds already in escrow (release still works)", async function () {
    const escrow = await newFundedEscrow(10, USDC(100));
    await factory.connect(admin).pause();
    await escrow.connect(client).markSatisfied();
    await expect(escrow.connect(freelancer).markSatisfied()).to.emit(escrow, "FundsReleased");
  });

  it("ownership transfers in two steps and moves dispute authority", async function () {
    // fund an escrow while admin is still owner
    const escrow = await newFundedEscrow(11, USDC(100));

    // 2-step handoff to the multisig
    await factory.connect(admin).transferOwnership(multisig.address);
    expect(await factory.owner()).to.equal(admin.address); // pending until accepted
    await factory.connect(multisig).acceptOwnership();
    expect(await factory.owner()).to.equal(multisig.address);

    // dispute authority now follows the new owner
    await expect(escrow.connect(admin).resolveDispute(USDC(98), 0)).to.be.revertedWith("not platform admin");
    await expect(escrow.connect(multisig).resolveDispute(USDC(98), 0)).to.emit(escrow, "DisputeResolved");
  });

  it("only owner can upgrade the factory", async function () {
    const Factory = await ethers.getContractFactory("EscrowFactory", client);
    await expect(
      upgrades.upgradeProxy(await factory.getAddress(), Factory)
    ).to.be.reverted; // non-owner cannot authorize the upgrade
  });
});

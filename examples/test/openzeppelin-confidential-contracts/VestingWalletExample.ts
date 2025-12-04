import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { VestingWalletExample, MockConfidentialToken } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VestingWalletExample", function () {
  let signers: { deployer: HardhatEthersSigner; beneficiary: HardhatEthersSigner };
  let vesting: VestingWalletExample;
  let token: MockConfidentialToken;
  let vestingAddress: string;
  let tokenAddress: string;
  let startTimestamp: number;
  const DURATION = 1000;
  const ALLOCATION = 1000;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], beneficiary: ethSigners[1] };
  });

  beforeEach(async function () {
    // Deploy Token
    const tokenFactory = await ethers.getContractFactory("MockConfidentialToken");
    token = (await tokenFactory.deploy()) as MockConfidentialToken;
    tokenAddress = await token.getAddress();

    // Setup Start Time
    startTimestamp = (await time.latest()) + 100;

    // Deploy Vesting Wallet
    const vestingFactory = await ethers.getContractFactory("VestingWalletExample");
    vesting = (await vestingFactory.deploy(
        tokenAddress, 
        signers.beneficiary.address, 
        startTimestamp, 
        DURATION
    )) as VestingWalletExample;
    vestingAddress = await vesting.getAddress();

    // Mint and Initialize
    await token.mint(signers.deployer.address, ALLOCATION);
    await token.connect(signers.deployer).approve(vestingAddress, ALLOCATION);

    const input = await fhevm.createEncryptedInput(vestingAddress, signers.deployer.address)
        .add64(ALLOCATION)
        .encrypt();

    await vesting.initialize(input.handles[0], input.inputProof);
  });

  /**
   * @chapter openzeppelin
   * @example vesting-wallet
   * @summary Demonstrates confidential linear vesting.
   */
  it("should release tokens over time", async function () {
    // 1. Check initial release (should be 0)
    await time.increaseTo(startTimestamp - 10);
    // Try to release
    await expect(vesting.release()).to.be.revertedWith("Vesting has not started");

    // 2. Advance to 50% duration
    await time.increaseTo(startTimestamp + DURATION / 2);
    
    // Release
    await vesting.release();

    // Check Beneficiary Balance (should be ~500)
    const balanceHandle = await token.balanceOf(signers.beneficiary.address);
    const balance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balanceHandle,
        tokenAddress,
        signers.beneficiary
    );
    
    // Allow small margin of error for time precision
    expect(balance).to.be.closeTo(500, 5);

    // 3. Advance to end
    await time.increaseTo(startTimestamp + DURATION + 1);
    
    // Release remaining
    await vesting.release();

    // Check Beneficiary Balance (should be 1000)
    const finalBalanceHandle = await token.balanceOf(signers.beneficiary.address);
    const finalBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        finalBalanceHandle,
        tokenAddress,
        signers.beneficiary
    );
    expect(finalBalance).to.equal(ALLOCATION);
  });
});


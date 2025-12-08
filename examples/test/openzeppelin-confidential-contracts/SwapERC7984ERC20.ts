import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SwapERC7984ERC20, MockERC20, MockConfidentialToken } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SwapERC7984ERC20", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let swapContract: SwapERC7984ERC20;
  let publicToken: MockERC20;
  let confidentialToken: MockConfidentialToken;
  let swapAddress: string;
  let confTokenAddress: string;
  let pubTokenAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Deploy Tokens
    const pubFactory = await ethers.getContractFactory("MockERC20");
    publicToken = (await pubFactory.deploy()) as MockERC20;
    pubTokenAddress = await publicToken.getAddress();

    const confFactory = await ethers.getContractFactory("MockConfidentialToken");
    confidentialToken = (await confFactory.deploy()) as MockConfidentialToken;
    confTokenAddress = await confidentialToken.getAddress();

    // Deploy Swap
    const swapFactory = await ethers.getContractFactory("SwapERC7984ERC20");
    swapContract = (await swapFactory.deploy(pubTokenAddress, confTokenAddress)) as SwapERC7984ERC20;
    swapAddress = await swapContract.getAddress();
  });

  /**
   * @chapter openzeppelin
   * @example erc7984-erc20-swap
   * @summary Atomic swap between confidential ERC7984 and public ERC20.
   */
  it("should swap confidential tokens for public tokens", async function () {
    const sellAmount = 100;
    const buyAmount = 500;

    // Setup Alice (Seller): Has Confidential Token
    await confidentialToken.mint(signers.alice.address, sellAmount);
    await confidentialToken.connect(signers.alice).setOperator(swapAddress, "281474976710655");

    // Setup Bob (Buyer): Has Public Token
    await publicToken.mint(signers.bob.address, buyAmount);
    await publicToken.connect(signers.bob).approve(swapAddress, buyAmount);

    // Alice creates order
    // Encrypt amount
    const input = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
      .add64(sellAmount)
      .encrypt();

    await swapContract.connect(signers.alice).createOrder(input.handles[0], input.inputProof, buyAmount);

    // Check: Alice's confidential balance should be 0 (transferred to contract)
    const aliceBalanceHandle = await confidentialToken.confidentialBalanceOf(signers.alice.address);
    const aliceBalance = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandle, confTokenAddress, signers.alice);
    expect(aliceBalance).to.equal(0);

    // Bob fills order
    await swapContract.connect(signers.bob).fillOrder(0);

    // Check: Bob's confidential balance should be 100
    const bobBalanceHandle = await confidentialToken.confidentialBalanceOf(signers.bob.address);
    const bobBalance = await fhevm.userDecryptEuint(FhevmType.euint64, bobBalanceHandle, confTokenAddress, signers.bob);
    expect(bobBalance).to.equal(sellAmount);

    // Check: Alice's public balance should be 500
    expect(await publicToken.balanceOf(signers.alice.address)).to.equal(buyAmount);
  });
});


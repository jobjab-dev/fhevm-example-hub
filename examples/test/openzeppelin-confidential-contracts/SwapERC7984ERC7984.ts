import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SwapERC7984ERC7984, MockConfidentialToken } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SwapERC7984ERC7984", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let swapContract: SwapERC7984ERC7984;
  let tokenA: MockConfidentialToken;
  let tokenB: MockConfidentialToken;
  let swapAddress: string;
  let tokenAAddress: string;
  let tokenBAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Deploy Tokens
    const confFactory = await ethers.getContractFactory("MockConfidentialToken");
    
    tokenA = (await confFactory.deploy()) as MockConfidentialToken;
    tokenAAddress = await tokenA.getAddress();
    
    tokenB = (await confFactory.deploy()) as MockConfidentialToken;
    tokenBAddress = await tokenB.getAddress();

    // Deploy Swap
    const swapFactory = await ethers.getContractFactory("SwapERC7984ERC7984");
    swapContract = (await swapFactory.deploy(tokenAAddress, tokenBAddress)) as SwapERC7984ERC7984;
    swapAddress = await swapContract.getAddress();
  });

  /**
   * @chapter openzeppelin
   * @example erc7984-erc7984-swap
   * @summary Private atomic swap between two confidential ERC7984 tokens.
   */
  it("should swap confidential tokens when amounts match", async function () {
    const amountA = 100;
    const amountB = 200;

    // Alice has Token A
    await tokenA.mint(signers.alice.address, amountA);
    await tokenA.connect(signers.alice).approve(swapAddress, amountA);

    // Bob has Token B
    await tokenB.mint(signers.bob.address, amountB);
    await tokenB.connect(signers.bob).approve(swapAddress, amountB);

    // Alice creates order: Offer 100 A, Ask 200 B
    const inputA = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(amountA)
        .encrypt();
    
    const inputAskB = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(amountB)
        .encrypt();

    await swapContract.connect(signers.alice).createOrder(
        inputA.handles[0], inputA.inputProof,
        inputAskB.handles[0], inputAskB.inputProof
    );

    // Alice's balance A should be 0
    const aliceBalanceHandleA = await tokenA.balanceOf(signers.alice.address);
    const aliceBalanceA = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandleA, tokenAAddress, signers.alice);
    expect(aliceBalanceA).to.equal(0);

    // Bob fills order: Sends 200 B
    const inputB = await fhevm.createEncryptedInput(swapAddress, signers.bob.address)
        .add64(amountB)
        .encrypt();

    await swapContract.connect(signers.bob).fillOrder(0, inputB.handles[0], inputB.inputProof);

    // Check Final Balances
    
    // Alice should have 200 Token B
    const aliceBalanceHandleB = await tokenB.balanceOf(signers.alice.address);
    const aliceBalanceB = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandleB, tokenBAddress, signers.alice);
    expect(aliceBalanceB).to.equal(amountB);

    // Bob should have 100 Token A
    const bobBalanceHandleA = await tokenA.balanceOf(signers.bob.address);
    const bobBalanceA = await fhevm.userDecryptEuint(FhevmType.euint64, bobBalanceHandleA, tokenAAddress, signers.bob);
    expect(bobBalanceA).to.equal(amountA);
  });

  it("should fail when amounts do not match", async function () {
    const amountA = 100;
    const askAmountB = 200;
    const wrongAmountB = 150;

    // Alice Setup
    await tokenA.mint(signers.alice.address, amountA);
    await tokenA.connect(signers.alice).approve(swapAddress, amountA);
    
    const inputA = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(amountA)
        .encrypt();
    const inputAskB = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(askAmountB)
        .encrypt();

    await swapContract.connect(signers.alice).createOrder(
        inputA.handles[0], inputA.inputProof,
        inputAskB.handles[0], inputAskB.inputProof
    );

    // Bob Setup
    await tokenB.mint(signers.bob.address, wrongAmountB);
    await tokenB.connect(signers.bob).approve(swapAddress, wrongAmountB);

    // Bob tries to fill with wrong amount
    const inputB = await fhevm.createEncryptedInput(swapAddress, signers.bob.address)
        .add64(wrongAmountB)
        .encrypt();

    await expect(
        swapContract.connect(signers.bob).fillOrder(0, inputB.handles[0], inputB.inputProof)
    ).to.be.reverted; // FHE.req reversion
  });
});


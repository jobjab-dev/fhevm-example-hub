import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { LabReplayAttack } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("LabReplayAttack", function () {
  let signers: { alice: HardhatEthersSigner };
  let contract: LabReplayAttack;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory("LabReplayAttack");
    contract = (await factory.deploy()) as LabReplayAttack;
    contractAddress = await contract.getAddress();
  });

  /**
   * @chapter labs
   * @example replay-attack
   * @summary Shows that the same input can be used multiple times if app logic doesn't prevent it.
   */
  it("vulnerable: allows replaying the same input to double claim", async function () {
    const amount = 100;
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
        .add64(amount)
        .encrypt();

    // 1. First Claim
    await contract.connect(signers.alice).vulnerableClaim(input.handles[0], input.inputProof);

    // 2. Replay!
    await contract.connect(signers.alice).vulnerableClaim(input.handles[0], input.inputProof);

    // Check Balance: Should be 200
    const balanceHandle = await contract.balanceOf(signers.alice.address);
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, balanceHandle, contractAddress, signers.alice);
    expect(balance).to.equal(200);
  });

  it("secure: prevents double claim using state", async function () {
    const amount = 100;
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
        .add64(amount)
        .encrypt();

    // 1. First Claim
    await contract.connect(signers.alice).secureClaim(input.handles[0], input.inputProof);

    // 2. Replay -> Revert
    await expect(
        contract.connect(signers.alice).secureClaim(input.handles[0], input.inputProof)
    ).to.be.revertedWith("Already claimed");
  });
});


import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { LabInputProof, LabInputProof__factory } from "../../types";
import { expect } from "chai";

/**
 * @chapter concepts
 * @title Lab: Input Proofs
 * @description Interactive lesson on why Input Proofs must be bound to the contract.
 */
async function deployFixture() {
  const factory = (await ethers.getContractFactory("LabInputProof")) as LabInputProof__factory;
  const contract = (await factory.deploy()) as LabInputProof;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("Lab 01: Input Proof Binding", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner };
  let contract: LabInputProof;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    ({ contract, contractAddress } = await deployFixture());
  });

  it("Step 1: Success - Valid Proof", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(42)
      .encrypt();
    await expect(contract.connect(signers.alice).setValue(input.handles[0], input.inputProof))
        .to.not.be.reverted;
  });

  it("Step 2: Failure - Wrong Contract Address (Malling Attack)", async function () {
    // 📝 LESSON:
    // If an attacker intercepts a valid ciphertext for Contract A,
    // they shouldn't be able to use it on Contract B.
    
    // Simulate creating input for a DIFFERENT fake address
    const FAKE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000001234";
    
    const input = await fhevm.createEncryptedInput(FAKE_CONTRACT_ADDRESS, signers.alice.address)
      .add32(42)
      .encrypt();

    // Try to send this input to the REAL contract
    await expect(contract.connect(signers.alice).setValue(input.handles[0], input.inputProof))
        .to.be.reverted; 
    // The revert happens because the proof signature doesn't match the contract address.
  });
});


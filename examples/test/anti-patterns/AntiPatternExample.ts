import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AntiPatternExample, AntiPatternExample__factory } from "../../types";
import { expect } from "chai";

/**
 * @chapter concepts
 * @title Anti-Patterns
 * @description Demonstrates common mistakes when working with FHEVM and how to avoid them.
 */
async function deployFixture() {
  const factory = (await ethers.getContractFactory("AntiPatternExample")) as AntiPatternExample__factory;
  const contract = (await factory.deploy()) as AntiPatternExample;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("AntiPatternExample", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner };
  let contract: AntiPatternExample;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  /**
   * ✅ CORRECT PATTERN
   * When storing an encrypted value, always call FHE.allowThis(handle).
   * This ensures the contract itself can compute on this value later.
   */
  it("should succeed when using correctly set value (with allowThis)", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    
    await contract.connect(signers.alice).setCorrectly(input.handles[0], input.inputProof);
    await expect(contract.useCorrectValue()).to.not.be.reverted;
  });

  /**
   * ❌ ANTI-PATTERN: Missing FHE.allowThis()
   * If you forget to allow the contract access to the handle, any subsequent
   * FHE operation (like FHE.add) using that handle will revert.
   */
  it("should fail when using incorrectly set value (missing allowThis)", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    
    // Set value without FHE.allowThis()
    await contract.connect(signers.alice).setIncorrectly(input.handles[0], input.inputProof);
    
    // Attempting to use the value fails because the contract isn't in the ACL
    await expect(contract.useIncorrectValue()).to.be.reverted;
  });
});

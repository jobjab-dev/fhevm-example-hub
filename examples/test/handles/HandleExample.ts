import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { HandleExample } from "../../types";
import { expect } from "chai";

describe("HandleExample", function () {
  let signers: { deployer: HardhatEthersSigner };
  let contract: HandleExample;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0] };
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory("HandleExample");
    contract = (await factory.deploy()) as HandleExample;
    contractAddress = await contract.getAddress();
  });

  /**
   * @chapter concepts
   * @example handles
   * @summary Explains FHE handles and their lifecycle.
   * 
   * # Handle Lifecycle Diagram
   * 
   * ```mermaid
   * graph TD
   *   A[User Encrypts Data] -->|createEncryptedInput| B(Input Handle)
   *   B -->|FHE.fromExternal| C{Smart Contract}
   *   C -->|FHE.add| D(New Result Handle)
   *   C -->|FHE.allow| E[Permission Added]
   *   D -->|reencrypt| F[User Decrypts]
   * ```
   */
  it("should generate new handles for operations", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
        .add32(10)
        .encrypt();

    // Call contract
    // We can't easily get return values from non-view functions in Ethers v6 without staticCall or events.
    // Using staticCall to check return values
    const [h1, h2] = await contract.compareHandles.staticCall(input.handles[0], input.inputProof);
    
    // Actually execute state change (though not needed for this check, good practice)
    await contract.compareHandles(input.handles[0], input.inputProof);

    // Handles should be different numbers
    expect(h1).to.not.equal(h2);
    console.log("Input Handle:", h1.toString());
    console.log("Result Handle:", h2.toString());
  });
});

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { InputProofExample, InputProofExample__factory } from "../../types";
import { expect } from "chai";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("InputProofExample")) as InputProofExample__factory;
  const contract = (await factory.deploy()) as InputProofExample;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("InputProofExample", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; mallory: HardhatEthersSigner };
  let contract: InputProofExample;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], mallory: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  it("should accept valid input proof from alice", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(123)
      .encrypt();
    
    await expect(contract.connect(signers.alice).setValue(input.handles[0], input.inputProof))
      .to.not.be.reverted;
  });

  it("should reject input proof if sent by mallory (Front-running/Replay attack simulation)", async function () {
    // Alice generates a valid input and proof
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(123)
      .encrypt();

    // Mallory sees this in the mempool and tries to use it herself
    // If signers.mallory calls the contract, FHE.fromExternal checks if proof matches msg.sender.
    
    // Expect revert (Checking general revert as the exact message might depend on mock impl)
    await expect(contract.connect(signers.mallory).setValue(input.handles[0], input.inputProof))
      .to.be.reverted;
  });
});


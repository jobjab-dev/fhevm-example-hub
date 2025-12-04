import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { HandleExample, HandleExample__factory } from "../../types";
import { expect } from "chai";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("HandleExample")) as HandleExample__factory;
  const contract = (await factory.deploy()) as HandleExample;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("HandleExample", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner };
  let contract: HandleExample;
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

  it("should return different handles for input and result", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    
    // Use staticCall to inspect return values of the non-view function
    const [h1, h2] = await contract.connect(signers.alice).compareHandles.staticCall(input.handles[0], input.inputProof);
    
    expect(h1).to.not.equal(h2);
    expect(h1).to.not.equal(0);
    expect(h2).to.not.equal(0);
  });
});


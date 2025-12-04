import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { BlindAuction, BlindAuction__factory } from "../../types";
import { expect } from "chai";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("BlindAuction")) as BlindAuction__factory;
  const contract = (await factory.deploy()) as BlindAuction;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("BlindAuction", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: BlindAuction;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  it("should determine the winner correctly", async function () {
    // Alice bids 10
    const inputAlice = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    await contract.connect(signers.alice).bid(inputAlice.handles[0], inputAlice.inputProof);

    // Bob bids 20
    const inputBob = await fhevm.createEncryptedInput(contractAddress, signers.bob.address)
      .add32(20)
      .encrypt();
    await contract.connect(signers.bob).bid(inputBob.handles[0], inputBob.inputProof);

    // Stop Auction
    const tx = await contract.stopAuction();
    await tx.wait();
    
    // In mock, we usually need to assume async operation completes or is mocked instantaneously.
    // If this fails, we need to insert await logic.

    // Bob claims
    const claimTx = await contract.connect(signers.bob).claim();
    await claimTx.wait();
    
    // Alice claims
    const claimTxAlice = await contract.connect(signers.alice).claim();
    await claimTxAlice.wait();
    
    await expect(claimTx)
        .to.emit(contract, "WinnerClaimed")
        .withArgs(signers.bob.address, true);

    await expect(claimTxAlice)
        .to.emit(contract, "WinnerClaimed")
        .withArgs(signers.alice.address, false);
  });
});


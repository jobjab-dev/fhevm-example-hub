import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { LabWrongSigner } from "../../types";
import { expect } from "chai";

describe("LabWrongSigner", function () {
  let signers: { alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: LabWrongSigner;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { alice: ethSigners[0], bob: ethSigners[1] };
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory("LabWrongSigner");
    contract = (await factory.deploy()) as LabWrongSigner;
    contractAddress = await contract.getAddress();
  });

  /**
   * @chapter labs
   * @example wrong-signer
   * @summary Demonstrates that you cannot use someone else's encrypted input.
   */
  it("should fail when Bob submits Alice's input", async function () {
    // 1. Alice generates input
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
        .add64(100)
        .encrypt();

    // 2. Alice submits her own input -> OK
    await contract.connect(signers.alice).setState(input.handles[0], input.inputProof);

    // 3. Bob tries to submit Alice's input
    // The proof contains Alice's signature.
    // The contract call comes from Bob (msg.sender).
    // FHE.fromExternal checks: recoveredSigner(proof) == msg.sender
    // Alice != Bob -> Revert
    await expect(
        contract.connect(signers.bob).setState(input.handles[0], input.inputProof)
    ).to.be.reverted; 
    // Note: exact revert message depends on implementation ("Invalid signature" or similar)
  });
});


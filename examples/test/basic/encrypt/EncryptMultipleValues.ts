//TODO;
import { EncryptMultipleValues, EncryptMultipleValues__factory } from "../../../types";
import type { Signers } from "../../types";
import { FhevmType, HardhatFhevmRuntimeEnvironment } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const factory = (await ethers.getContractFactory("EncryptMultipleValues")) as EncryptMultipleValues__factory;
  const encryptMultipleValues = (await factory.deploy()) as EncryptMultipleValues;
  const encryptMultipleValues_address = await encryptMultipleValues.getAddress();

  return { encryptMultipleValues, encryptMultipleValues_address };
}

/**
 * This trivial example demonstrates the FHE encryption mechanism
 * and highlights a common pitfall developers may encounter.
 */
describe("EncryptMultipleValues", function () {
  let contract: EncryptMultipleValues;
  let contractAddress: string;
  let signers: Signers;

  before(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1] };
  });

  beforeEach(async function () {
    // Deploy a new contract each time we run a new test
    const deployment = await deployFixture();
    contractAddress = deployment.encryptMultipleValues_address;
    contract = deployment.encryptMultipleValues;
  });

  // ✅ Test should succeed
  it("encryption should succeed", async function () {
    // Use the FHEVM Hardhat plugin runtime environment
    // to perform FHEVM input encryptions.
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

    const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);

    input.addBool(true);
    input.add32(123456);
    input.addAddress(signers.owner.address);

    const enc = await input.encrypt();

    const inputEbool = enc.handles[0];
    const inputEuint32 = enc.handles[1];
    const inputEaddress = enc.handles[2];
    const inputProof = enc.inputProof;

    // Don't forget to call `connect(signers.alice)` to make sure
    // the Solidity `msg.sender` is `signers.alice.address`.
    const tx = await contract.connect(signers.alice).initialize(inputEbool, inputEuint32, inputEaddress, inputProof);
    await tx.wait();

    const encryptedBool = await contract.encryptedBool();
    const encryptedUint32 = await contract.encryptedUint32();
    const encryptedAddress = await contract.encryptedAddress();

    const clearBool = await fhevm.userDecryptEbool(
      encryptedBool,
      contractAddress, // The contract address
      signers.alice, // The user wallet
    );

    const clearUint32 = await fhevm.userDecryptEuint(
      FhevmType.euint32, // Specify the encrypted type
      encryptedUint32,
      contractAddress, // The contract address
      signers.alice, // The user wallet
    );

    const clearAddress = await fhevm.userDecryptEaddress(
      encryptedAddress,
      contractAddress, // The contract address
      signers.alice, // The user wallet
    );

    expect(clearBool).to.equal(true);
    expect(clearUint32).to.equal(123456);
    expect(clearAddress).to.equal(signers.owner.address);
  });

  it("should fail if caller is not the signer of the input proof", async function () {
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
    const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
    input.addBool(true);
    input.add32(123456);
    input.addAddress(signers.owner.address);
    const enc = await input.encrypt();

    // Bob tries to submit Alice's input
    await expect(
      contract.connect(signers.owner).initialize(enc.handles[0], enc.handles[1], enc.handles[2], enc.inputProof)
    ).to.be.reverted; // exact error might depend on implementation, usually "Invalid proof" or similar
  });

  it("should fail if unauthorized user tries to decrypt", async function () {
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

    // Alice initializes the values
    const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
    input.addBool(true);
    input.add32(123456);
    input.addAddress(signers.owner.address);
    const enc = await input.encrypt();

    await contract.connect(signers.alice).initialize(enc.handles[0], enc.handles[1], enc.handles[2], enc.inputProof);

    const encryptedBool = await contract.encryptedBool();

    // Bob (signers.owner) tries to decrypt Alice's value
    // Note: In the contract, ONLY msg.sender (Alice) was granted permission.
    // In Mock mode, decrypting without permission usually fails or returns garbage/error.
    let errorOccurred = false;
    try {
      await fhevm.userDecryptEbool(
        encryptedBool,
        contractAddress,
        signers.owner
      );
    } catch (e) {
      errorOccurred = true;
    }
    expect(errorOccurred).to.be.true;
  });
});
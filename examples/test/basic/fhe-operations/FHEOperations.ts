import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHEOperations } from "../../../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("FHEOperations", function () {
  let signers: { deployer: HardhatEthersSigner };
  let contract: FHEOperations;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0] };
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory("FHEOperations");
    contract = (await factory.deploy()) as FHEOperations;
    contractAddress = await contract.getAddress();
  });

  /**
   * @chapter basic
   * @example fhe-operations
   * @summary Basic arithmetic: Add, Sub, Mul.
   */
  it("should perform arithmetic operations", async function () {
    const valA = 20;
    const valB = 5;

    const inputA = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
        .add8(valA)
        .encrypt();
    const inputB = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
        .add8(valB)
        .encrypt();

    await contract.setValues(inputA.handles[0], inputA.inputProof, inputB.handles[0], inputB.inputProof);

    // Test Add
    await contract.add();
    const sumHandle = await contract.sum();
    const sum = await fhevm.userDecryptEuint(FhevmType.euint8, sumHandle, contractAddress, signers.deployer);
    expect(sum).to.equal(valA + valB);

    // Test Sub
    await contract.sub();
    const diffHandle = await contract.diff();
    const diff = await fhevm.userDecryptEuint(FhevmType.euint8, diffHandle, contractAddress, signers.deployer);
    expect(diff).to.equal(valA - valB);

    // Test Mul
    await contract.mul();
    const prodHandle = await contract.prod();
    const prod = await fhevm.userDecryptEuint(FhevmType.euint8, prodHandle, contractAddress, signers.deployer);
    expect(prod).to.equal(valA * valB);
  });

  it("should check equality", async function () {
    const valA = 10;
    // Encrypt same value for B
    const inputA = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
      .add8(valA)
      .encrypt();
    const inputB = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
      .add8(valA)
      .encrypt();

    await contract.setValues(inputA.handles[0], inputA.inputProof, inputB.handles[0], inputB.inputProof);
    
    // Check equality (10 == 10)
    await contract.checkEqual();
    const isEqHandle = await contract.isEqualResult();
    const isEq = await fhevm.userDecryptEuint(FhevmType.euint8, isEqHandle, contractAddress, signers.deployer);
    expect(isEq).to.equal(1); // 1 means true

    // Encrypt different value for B
    const inputB2 = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
      .add8(5)
      .encrypt();
    
    await contract.setValues(inputA.handles[0], inputA.inputProof, inputB2.handles[0], inputB2.inputProof);
    
    await contract.checkEqual();
    const isEqHandle2 = await contract.isEqualResult();
    const isEq2 = await fhevm.userDecryptEuint(FhevmType.euint8, isEqHandle2, contractAddress, signers.deployer);
    expect(isEq2).to.equal(0); // 0 means false
  });
});


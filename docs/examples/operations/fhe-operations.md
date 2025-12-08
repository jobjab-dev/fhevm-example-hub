---
id: fhe-operations
title: FHE Operations
category: operations
tags: [operations, math, beginner]
description: Demonstrates FHE arithmetic operations (Add, Sub, Mul)
---

# FHE Operations

> Demonstrates FHE arithmetic operations (Add, Sub, Mul)

## Overview

This example demonstrates how to implement **FHE Operations** using FHEVM.

- **Level:** 🟢 Beginner
- **Category:** operations

## 📝 Contract Implementation

`contracts/FHEOperations.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint8, externalEuint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Operations
/// @notice Demonstrates basic arithmetic operations on encrypted integers.
contract FHEOperations is ZamaEthereumConfig {
  euint8 private _a;
  euint8 private _b;
  
  euint8 public sum;
  euint8 public diff;
  euint8 public prod;
  // euint8 public quot; // Division is supported but watch out for division by zero
  euint8 public isEqualResult;

  constructor() {
      _a = FHE.asEuint8(0);
      _b = FHE.asEuint8(0);
  }

  function setValues(externalEuint8 inputA, bytes calldata proofA, externalEuint8 inputB, bytes calldata proofB) external {
    _a = FHE.fromExternal(inputA, proofA);
    _b = FHE.fromExternal(inputB, proofB);
    FHE.allowThis(_a);
    FHE.allowThis(_b);
  }

  function add() external {
    sum = FHE.add(_a, _b);
    FHE.allowThis(sum);
    FHE.allow(sum, msg.sender);
  }

  function sub() external {
    // Note: uint overflow/underflow works as expected in FHE (modular arithmetic)
    diff = FHE.sub(_a, _b);
    FHE.allowThis(diff);
    FHE.allow(diff, msg.sender);
  }

  function mul() external {
    prod = FHE.mul(_a, _b);
    FHE.allowThis(prod);
    FHE.allow(prod, msg.sender);
  }

  function checkEqual() external {
    ebool isEq = FHE.eq(_a, _b);
    // Convert ebool to euint8 (1 = true, 0 = false) for easier decryption and verification
    isEqualResult = FHE.select(isEq, FHE.asEuint8(1), FHE.asEuint8(0));
    FHE.allowThis(isEqualResult);
    FHE.allow(isEqualResult, msg.sender);
  }
}


```

## 🧪 Test Suite

`test/FHEOperations.ts`

```typescript
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
  describe("Edge Cases", function () {
    it("should handle overflow (255 + 1 = 0)", async function () {
      const inputA = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
        .add8(255)
        .encrypt();
      const inputB = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
        .add8(1)
        .encrypt();

      await contract.setValues(inputA.handles[0], inputA.inputProof, inputB.handles[0], inputB.inputProof);
      await contract.add();
      const sumHandle = await contract.sum();
      const sum = await fhevm.userDecryptEuint(FhevmType.euint8, sumHandle, contractAddress, signers.deployer);
      expect(sum).to.equal(0);
    });

    it("should handle underflow (0 - 1 = 255)", async function () {
      const inputA = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
        .add8(0)
        .encrypt();
      const inputB = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address)
        .add8(1)
        .encrypt();

      await contract.setValues(inputA.handles[0], inputA.inputProof, inputB.handles[0], inputB.inputProof);
      await contract.sub();
      const diffHandle = await contract.diff();
      const diff = await fhevm.userDecryptEuint(FhevmType.euint8, diffHandle, contractAddress, signers.deployer);
      expect(diff).to.equal(255);
    });
  });
});


```

## Usage

To generate this example locally:

```bash
npm run create fhe-operations ./my-fhe-operations
```

Then run tests:

```bash
cd ./my-fhe-operations
npm install
npm run compile
npm run test
```

---
Generated by FHEVM Example Hub

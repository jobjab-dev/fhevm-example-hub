---
id: fhe-counter
title: Encrypted Counter
category: basic
tags: [basic, counter, beginner]
description: A simple FHE counter demonstrating basic encrypted operations
---

# Encrypted Counter

> A simple FHE counter demonstrating basic encrypted operations

## Overview

This example demonstrates how to implement **Encrypted Counter** using FHEVM.

- **Level:** 🟢 Beginner
- **Category:** basic

## 📝 Contract Implementation

`contracts/FHECounter.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A simple FHE counter contract
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  /// @notice Returns the current count
  function getCount() external view returns (euint32) {
    return _count;
  }

  /// @notice Increments the counter by a specified encrypted value.
  /// @dev This example omits overflow/underflow checks for simplicity and readability.
  /// In a production contract, proper range checks should be implemented.
  function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

    _count = FHE.add(_count, encryptedEuint32);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }

  /// @notice Decrements the counter by a specified encrypted value.
  /// @dev This example omits overflow/underflow checks for simplicity and readability.
  /// In a production contract, proper range checks should be implemented.
  function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

    _count = FHE.sub(_count, encryptedEuint32);

    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }
}
```

## 🧪 Test Suite

`test/FHECounter.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHECounter, FHECounter__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FHECounter")) as FHECounter__factory;
  const fheCounterContract = (await factory.deploy()) as FHECounter;
  const fheCounterContractAddress = await fheCounterContract.getAddress();

  return { fheCounterContract, fheCounterContractAddress };
}

describe("FHECounter", function () {
  let signers: Signers;
  let fheCounterContract: FHECounter;
  let fheCounterContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ fheCounterContract, fheCounterContractAddress } = await deployFixture());
  });

  it("encrypted count should be uninitialized after deployment", async function () {
    const encryptedCount = await fheCounterContract.getCount();
    // Expect initial count to be bytes32(0) after deployment,
    // (meaning the encrypted count value is uninitialized)
    expect(encryptedCount).to.eq(ethers.ZeroHash);
  });

  it("increment the counter by 1", async function () {
    const encryptedCountBeforeInc = await fheCounterContract.getCount();
    expect(encryptedCountBeforeInc).to.eq(ethers.ZeroHash);
    const clearCountBeforeInc = 0;

    // Encrypt constant 1 as a euint32
    const clearOne = 1;
    const encryptedOne = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(clearOne)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    const encryptedCountAfterInc = await fheCounterContract.getCount();
    const clearCountAfterInc = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCountAfterInc,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(clearCountAfterInc).to.eq(clearCountBeforeInc + clearOne);
  });

  it("decrement the counter by 1", async function () {
    // Encrypt constant 1 as a euint32
    const clearOne = 1;
    const encryptedOne = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(clearOne)
      .encrypt();

    // First increment by 1, count becomes 1
    let tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    // Then decrement by 1, count goes back to 0
    tx = await fheCounterContract.connect(signers.alice).decrement(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    const encryptedCountAfterDec = await fheCounterContract.getCount();
    const clearCountAfterInc = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCountAfterDec,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(clearCountAfterInc).to.eq(0);
  });
  describe("Complex Interactions", function () {
    it("should handle underflow (0 - 1 = MAX_UINT32)", async function () {
      const clearOne = 1;
      const encryptedOne = await fhevm
        .createEncryptedInput(fheCounterContractAddress, signers.deployer.address)
        .add32(clearOne)
        .encrypt();

      await fheCounterContract.connect(signers.deployer).decrement(encryptedOne.handles[0], encryptedOne.inputProof);

      const encryptedCount = await fheCounterContract.getCount();
      const count = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCount,
        fheCounterContractAddress,
        signers.deployer,
      );
      // for euint32, underflow 0-1 gives 2^32 - 1 = 4294967295
      expect(count).to.eq(4294967295n);
    });

    it("should allow multiple users to increment", async function () {
      // Alice increments by 1
      const inputAlice = await fhevm
        .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
        .add32(1)
        .encrypt();
      await fheCounterContract.connect(signers.alice).increment(inputAlice.handles[0], inputAlice.inputProof);

      // Bob increments by 2
      const inputBob = await fhevm
        .createEncryptedInput(fheCounterContractAddress, signers.bob.address)
        .add32(2)
        .encrypt();
      await fheCounterContract.connect(signers.bob).increment(inputBob.handles[0], inputBob.inputProof);

      const encryptedCount = await fheCounterContract.getCount();
      // Alice decrypts to verify total is 3 (1+2 from initialized 0, assuming previous tests didn't dirty state 
      // but actually beforeEach redeploys so it is fresh 0)
      const count = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCount,
        fheCounterContractAddress,
        signers.bob,
      );
      expect(count).to.eq(3);
    });
  });
});

```

## Usage

To generate this example locally:

```bash
npm run create fhe-counter ./my-fhe-counter
```

Then run tests:

```bash
cd ./my-fhe-counter
npm install
npm run compile
npm run test
```

---
Generated by FHEVM Example Hub

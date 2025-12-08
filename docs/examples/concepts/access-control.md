---
id: access-control
title: Access Control
category: concepts
tags: [concepts, security, intermediate]
description: Demonstrates FHE.allow and FHE.allowTransient for access control
---

# Access Control

> Demonstrates FHE.allow and FHE.allowTransient for access control

## Overview

This example demonstrates how to implement **Access Control** using FHEVM.

- **Level:** 🟡 Intermediate
- **Category:** concepts

## 📝 Contract Implementation

`contracts/AccessControlExample.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Access Control Example
/// @notice Demonstrates FHE.allow and FHE.allowTransient for controlling access to encrypted data.
contract AccessControlExample is ZamaEthereumConfig {
    euint32 private _secureValue;

    // Event to emit for testing transient allowance
    event ValueAccessed(address indexed by);

    constructor() {
        // Initialize with 0
        _secureValue = FHE.asEuint32(0);
        FHE.allowThis(_secureValue);
    }

    /// @notice Sets a new secure value.
    /// @param input The encrypted value to set.
    /// @param inputProof The proof for the encrypted value.
    function setSecureValue(externalEuint32 input, bytes calldata inputProof) external {
        _secureValue = FHE.fromExternal(input, inputProof);
        FHE.allowThis(_secureValue);
    }

    /// @notice Grants persistent access to the caller.
    function grantAccessToSender() external {
        FHE.allow(_secureValue, msg.sender);
    }

    /// @notice Grants persistent access to a specific user.
    /// @param user The address to grant access to.
    function grantAccess(address user) external {
        FHE.allow(_secureValue, user);
    }

    /// @notice Returns the encrypted secure value.
    /// @return The encrypted euint32 handle.
    function getSecureValue() external view returns (euint32) {
        return _secureValue;
    }

    /// @notice Demonstrates transient allowance.
    /// @dev Allows a specific address (e.g. another contract) to access the value temporarily.
    /// @param other The address to grant transient access to.
    function temporaryUse(address other) external {
        FHE.allowTransient(_secureValue, other);
        emit ValueAccessed(other);
    }
}


```

## 🧪 Test Suite

`test/AccessControlExample.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AccessControlExample, AccessControlExample__factory } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("AccessControlExample")) as AccessControlExample__factory;
  const contract = (await factory.deploy()) as AccessControlExample;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("AccessControlExample", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: AccessControlExample;
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

  it("should allow alice to decrypt after being granted access", async function () {
    // 1. Alice sets value to 42
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(42)
      .encrypt();
    
    await contract.connect(signers.alice).setSecureValue(input.handles[0], input.inputProof);

    // 2. Grant access to Alice
    await contract.connect(signers.alice).grantAccessToSender();

    // 3. Decrypt
    const encryptedValue = await contract.getSecureValue();
    const clearValue = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedValue,
        contractAddress,
        signers.alice
    );
    expect(clearValue).to.equal(42);
  });

  it("should not allow bob to decrypt if only alice is allowed", async function () {
    // 1. Alice sets value
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(100)
      .encrypt();
    await contract.connect(signers.alice).setSecureValue(input.handles[0], input.inputProof);

    // 2. Grant access to Alice
    await contract.connect(signers.alice).grantAccess(signers.alice.address);

    // 3. Bob tries to decrypt
    const encryptedValue = await contract.getSecureValue();
    
    // In mock mode, attempting to decrypt without permission usually throws or returns error
    let errorOccurred = false;
    try {
        await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedValue,
            contractAddress,
            signers.bob
        );
    } catch (error) {
        errorOccurred = true;
    }
    expect(errorOccurred).to.be.true;
  });
});


```

## Usage

To generate this example locally:

```bash
npm run create access-control ./my-access-control
```

Then run tests:

```bash
cd ./my-access-control
npm install
npm run compile
npm run test
```

---
Generated by FHEVM Example Hub

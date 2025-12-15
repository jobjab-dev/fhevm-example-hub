---
id: anti-patterns
title: Anti-Patterns
category: concepts
tags: [concepts, security, best-practices]
description: Highlights common mistakes and how to fix them
---

# Anti-Patterns

> Highlights common mistakes and how to fix them

## Overview

This example demonstrates how to implement **Anti-Patterns** using FHEVM.

| Property | Value |
|----------|-------|
| **Level** | 🟡 Intermediate |
| **Category** | concepts |
| **Key** | `anti-patterns` |

## ❌ Common Mistakes

### 1. Missing FHE.allowThis
```solidity
// ❌ BAD: Contract can't use this handle later
_value = FHE.fromExternal(input, proof);

// ✅ GOOD: Contract has permission
_value = FHE.fromExternal(input, proof);
FHE.allowThis(_value);
```

### 2. Trying to decrypt in view functions
```solidity
// ❌ IMPOSSIBLE: Can't decrypt synchronously
function getBalance() view returns (uint64) {
    return decrypt(_balance); // Will fail!
}
```

## 🧠 Key FHE Concepts Used

- `Always call FHE.allowThis`
- `View functions return handles only`
- `Two-step decryption pattern`

## 📝 Contract Implementation

`contracts/AntiPatternExample.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Anti-Patterns Example
/// @notice Demonstrates common mistakes when developing with FHEVM.
contract AntiPatternExample is ZamaEthereumConfig {
    euint32 private _val;

    // BAD: This handle will be unusable by the contract
    euint32 private _unusableVal;

    constructor() {
        _val = FHE.asEuint32(0);
        FHE.allowThis(_val);
    }

    /// @notice Correct way: Always use allowThis when storing a handle in state
    function setCorrectly(externalEuint32 input, bytes calldata inputProof) external {
        _val = FHE.fromExternal(input, inputProof);
        FHE.allowThis(_val);
    }

    /// @notice Anti-Pattern 1: Forgetting FHE.allowThis()
    /// @dev If you forget allowThis(), the contract will not be able to compute on this value later.
    function setIncorrectly(externalEuint32 input, bytes calldata inputProof) external {
        _unusableVal = FHE.fromExternal(input, inputProof);
        // MISSING: FHE.allowThis(_unusableVal);
    }

    /// @notice Tries to use the correctly set value (Should succeed)
    function useCorrectValue() external {
        euint32 res = FHE.add(_val, FHE.asEuint32(1));
        _val = res;
        FHE.allowThis(_val);
    }

    /// @notice Tries to use the incorrectly set value (Should fail)
    function useIncorrectValue() external {
        // This should fail because address(this) is not in the ACL for _unusableVal
        euint32 res = FHE.add(_unusableVal, FHE.asEuint32(1));
        _unusableVal = res;
        FHE.allowThis(_unusableVal);
    }

    /// @notice Anti-Pattern 2: View functions with encrypted values
    /// @dev View functions cannot modify state. FHE operations like decrypt() or reencrypt() 
    /// usually require gas and might change state (e.g. key switching / temporary storage).
    /// HOWEVER: In Zama's FHEVM, you CAN return handles from view functions, 
    /// but you CANNOT do `FHE.req` or decryption that changes state inside a view.
    /// Also, a common mistake is trying to "view" the decrypted value directly.
    function badViewAttempt() external pure returns (uint32) {
        // This is impossible. You cannot decrypt inside a view function to return a cleartext.
        // FHE.decrypt(_val); // Compile error or Runtime error depending on version
        return 0; 
    }

    /// @notice Correct View: Return the handle (euint32)
    /// @dev The caller (dApp) must then re-encrypt it using their public key (FHE.seal) locally 
    /// OR call a view function that supports re-encryption if supported (e.g. Gateway).
    function goodViewHandle() external view returns (euint32) {
        return _val;
    }
}

```

## 🧪 Test Suite

`test/AntiPatternExample.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AntiPatternExample, AntiPatternExample__factory } from "../../types";
import { expect } from "chai";

/**
 * @chapter concepts
 * @title Anti-Patterns
 * @description Demonstrates common mistakes when working with FHEVM and how to avoid them.
 */
async function deployFixture() {
  const factory = (await ethers.getContractFactory("AntiPatternExample")) as AntiPatternExample__factory;
  const contract = (await factory.deploy()) as AntiPatternExample;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("AntiPatternExample", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner };
  let contract: AntiPatternExample;
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

  /**
   * ✅ CORRECT PATTERN
   * When storing an encrypted value, always call FHE.allowThis(handle).
   * This ensures the contract itself can compute on this value later.
   */
  it("should succeed when using correctly set value (with allowThis)", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    
    await contract.connect(signers.alice).setCorrectly(input.handles[0], input.inputProof);
    await expect(contract.useCorrectValue()).to.not.be.reverted;
  });

  /**
   * ❌ ANTI-PATTERN: Missing FHE.allowThis()
   * If you forget to allow the contract access to the handle, any subsequent
   * FHE operation (like FHE.add) using that handle will revert.
   */
  it("should fail when using incorrectly set value (missing allowThis)", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    
    // Set value without FHE.allowThis()
    await contract.connect(signers.alice).setIncorrectly(input.handles[0], input.inputProof);
    
    // Attempting to use the value fails because the contract isn't in the ACL
    await expect(contract.useIncorrectValue()).to.be.reverted;
  });
});

```

## 🚀 Quick Start

Generate this example locally:

```bash
# Using npx (no install)
npx jobjab-fhevm-examples anti-patterns ./my-anti-patterns

# Or with the CLI
npm run create anti-patterns ./my-anti-patterns
```

Then build and test:

```bash
cd ./my-anti-patterns
npm install
npm run compile
npm run test
```

---
*Generated by FHEVM Example Hub*

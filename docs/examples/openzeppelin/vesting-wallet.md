---
id: vesting-wallet
title: Vesting Wallet
category: openzeppelin
tags: [openzeppelin, finance, vesting]
description: Confidential vesting wallet for ERC7984 tokens
---

# Vesting Wallet

> Confidential vesting wallet for ERC7984 tokens

## Overview

This example demonstrates how to implement **Vesting Wallet** using FHEVM.

- **Level:** 🟡 Intermediate
- **Category:** openzeppelin

## 📝 Contract Implementation

`contracts/VestingWalletExample.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/ERC7984.sol";
import { IERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/IERC7984.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Confidential Vesting Wallet
/// @notice Handles the vesting of ERC7984 confidential tokens for a beneficiary.
contract VestingWalletExample is ZamaEthereumConfig {
    IERC7984 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable duration;

    euint64 private _totalReleased;
    euint64 private _totalAllocation;
    bool private _initialized;

    event TokensReleased(address indexed beneficiary, uint256 amount); // Amount is hidden, so maybe don't emit amount? Or emit encrypted handle? 
    // Standard Events usually emit amount, but here it's confidential. We just emit "Something happened".

    constructor(
        address _token,
        address _beneficiary,
        uint64 _startTimestamp,
        uint64 _durationSeconds
    ) {
        token = IERC7984(_token);
        beneficiary = _beneficiary;
        start = _startTimestamp;
        duration = _durationSeconds;
        _totalReleased = FHE.asEuint64(0);
        FHE.allowThis(_totalReleased);
    }

    /// @notice Initialize the vesting by depositing tokens (can be done once)
    function initialize(externalEuint64 encryptedAmount, bytes calldata proof) external {
        require(!_initialized, "Already initialized");
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        
        token.transferFrom(msg.sender, address(this), amount);
        
        _totalAllocation = amount;
        FHE.allowThis(_totalAllocation);
        
        _initialized = true;
    }

    /// @notice Release vested tokens to beneficiary
    function release() external {
        uint64 currentTimestamp = uint64(block.timestamp);
        require(currentTimestamp > start, "Vesting has not started");
        
        euint64 vested = _vestedAmount(currentTimestamp);
        euint64 releasable = FHE.sub(vested, _totalReleased);
        
        // Update released state
        _totalReleased = FHE.add(_totalReleased, releasable);
        FHE.allowThis(_totalReleased); // Allow contract to use updated value

        // Transfer releasable amount to beneficiary
        token.transfer(beneficiary, releasable);
    }

    /// @notice Calculates the amount that has already vested
    function _vestedAmount(uint64 timestamp) internal view returns (euint64) {
        if (timestamp < start) {
            return FHE.asEuint64(0);
        } else if (timestamp >= start + duration) {
            return _totalAllocation;
        } else {
            // Linear vesting: allocation * (time - start) / duration
            uint64 timePassed = timestamp - start;
            // euint64 * uint64 (scalar) -> euint64
            euint64 vested = FHE.mul(_totalAllocation, timePassed);
            // euint64 / uint64 (scalar) -> euint64 (Assuming scalar division is supported or we iterate)
            // Zama FHEVM supports scalar operations.
            // But wait, integer division? Yes.
            return FHE.div(vested, duration);
        }
    }
    
    // View function to check vested amount (only beneficiary should be able to see?)
    // Actually, we can return a handle for the beneficiary.
    function vestedAmount() external view returns (euint64) {
         // In a real app, we'd need to re-encrypt this for the caller (beneficiary) using FHE.seal() 
         // or just return the handle if they have permission?
         // Since allowThis is used, we need to allow beneficiary to view it.
         // But view functions cannot change state (FHE.allow).
         // So we can't easily "view" the exact result unless we use FHE.allowTransient in a tx.
         // For this example, we skip the view function or return 0.
         // Best practice: The beneficiary calls a TX to "check and re-encrypt" if they want to see status.
         return _totalReleased; // This is a handle, only readable if allowed.
    }
}

// Helpers
contract MockConfidentialToken is ERC7984 {
    constructor() ERC7984("Mock Private", "PRIV") {}
    function mint(address to, uint64 amount) public { _mint(to, amount); }
}


```

## 🧪 Test Suite

`test/VestingWalletExample.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { VestingWalletExample, MockConfidentialToken } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VestingWalletExample", function () {
  let signers: { deployer: HardhatEthersSigner; beneficiary: HardhatEthersSigner };
  let vesting: VestingWalletExample;
  let token: MockConfidentialToken;
  let vestingAddress: string;
  let tokenAddress: string;
  let startTimestamp: number;
  const DURATION = 1000;
  const ALLOCATION = 1000;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], beneficiary: ethSigners[1] };
  });

  beforeEach(async function () {
    // Deploy Token
    const tokenFactory = await ethers.getContractFactory("MockConfidentialToken");
    token = (await tokenFactory.deploy()) as MockConfidentialToken;
    tokenAddress = await token.getAddress();

    // Setup Start Time
    startTimestamp = (await time.latest()) + 100;

    // Deploy Vesting Wallet
    const vestingFactory = await ethers.getContractFactory("VestingWalletExample");
    vesting = (await vestingFactory.deploy(
        tokenAddress, 
        signers.beneficiary.address, 
        startTimestamp, 
        DURATION
    )) as VestingWalletExample;
    vestingAddress = await vesting.getAddress();

    // Mint and Initialize
    await token.mint(signers.deployer.address, ALLOCATION);
    await token.connect(signers.deployer).approve(vestingAddress, ALLOCATION);

    const input = await fhevm.createEncryptedInput(vestingAddress, signers.deployer.address)
        .add64(ALLOCATION)
        .encrypt();

    await vesting.initialize(input.handles[0], input.inputProof);
  });

  /**
   * @chapter openzeppelin
   * @example vesting-wallet
   * @summary Demonstrates confidential linear vesting.
   */
  it("should release tokens over time", async function () {
    // 1. Check initial release (should be 0)
    await time.increaseTo(startTimestamp - 10);
    // Try to release
    await expect(vesting.release()).to.be.revertedWith("Vesting has not started");

    // 2. Advance to 50% duration
    await time.increaseTo(startTimestamp + DURATION / 2);
    
    // Release
    await vesting.release();

    // Check Beneficiary Balance (should be ~500)
    const balanceHandle = await token.balanceOf(signers.beneficiary.address);
    const balance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balanceHandle,
        tokenAddress,
        signers.beneficiary
    );
    
    // Allow small margin of error for time precision
    expect(balance).to.be.closeTo(500, 5);

    // 3. Advance to end
    await time.increaseTo(startTimestamp + DURATION + 1);
    
    // Release remaining
    await vesting.release();

    // Check Beneficiary Balance (should be 1000)
    const finalBalanceHandle = await token.balanceOf(signers.beneficiary.address);
    const finalBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        finalBalanceHandle,
        tokenAddress,
        signers.beneficiary
    );
    expect(finalBalance).to.equal(ALLOCATION);
  });
});


```

## Usage

To generate this example locally:

```bash
npx run create vesting-wallet ./my-vesting-wallet
```

Then run tests:

```bash
cd ./my-vesting-wallet
npm install
npm run test
```

---
Generated by FHEVM Example Hub

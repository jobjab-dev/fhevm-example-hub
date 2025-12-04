---
id: erc7984-erc7984-swap
title: Swap ERC7984 <-> ERC7984
category: openzeppelin
tags: [openzeppelin, defi, swap]
description: Atomic swap between two confidential ERC7984 tokens
---

# Swap ERC7984 <-> ERC7984

> Atomic swap between two confidential ERC7984 tokens

## Overview

This example demonstrates how to implement **Swap ERC7984 <-> ERC7984** using FHEVM.

- **Level:** 🟡 Intermediate
- **Category:** openzeppelin

## 📝 Contract Implementation

`contracts/SwapERC7984ERC7984.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/ERC7984.sol";
import { IERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/IERC7984.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";

/// @title Swap ERC7984 <-> ERC7984
/// @notice Atomic swap between two confidential ERC7984 tokens with hidden amounts.
contract SwapERC7984ERC7984 is ZamaEthereumConfig {
    IERC7984 public tokenA;
    IERC7984 public tokenB;

    struct Order {
        address maker;
        euint64 amountA;      // Amount offered by Maker
        euint64 askAmountB;   // Amount requested from Taker
        bool active;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId;

    event OrderCreated(uint256 indexed orderId, address indexed maker);
    event OrderFilled(uint256 indexed orderId, address indexed taker);

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC7984(_tokenA);
        tokenB = IERC7984(_tokenB);
    }

    /// @notice Maker creates an order
    /// @param encryptedAmountA Amount of Token A to sell
    /// @param encryptedAskAmountB Amount of Token B required
    function createOrder(
        externalEuint64 encryptedAmountA, 
        bytes calldata proofA,
        externalEuint64 encryptedAskAmountB,
        bytes calldata proofB
    ) external {
        euint64 amountA = FHE.fromExternal(encryptedAmountA, proofA);
        euint64 askAmountB = FHE.fromExternal(encryptedAskAmountB, proofB);
        
        // Lock Token A from Maker
        tokenA.transferFrom(msg.sender, address(this), amountA);
        
        orders[nextOrderId] = Order({
            maker: msg.sender,
            amountA: amountA,
            askAmountB: askAmountB,
            active: true
        });
        
        // Allow contract to manage these handles
        FHE.allowThis(orders[nextOrderId].amountA);
        FHE.allowThis(orders[nextOrderId].askAmountB);

        emit OrderCreated(nextOrderId, msg.sender);
        nextOrderId++;
    }

    /// @notice Taker fills the order
    /// @param encryptedAmountB Amount of Token B sending
    function fillOrder(uint256 orderId, externalEuint64 encryptedAmountB, bytes calldata proofB) external {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        
        euint64 amountB = FHE.fromExternal(encryptedAmountB, proofB);

        // Check if Taker sent enough Token B
        ebool isEnough = FHE.eq(amountB, order.askAmountB);
        
        // Enforce the check (Reverts if false)
        // Note: This reveals whether the amount was correct.
        FHE.req(isEnough);

        // Lock Token B from Taker
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        // Swap:
        // Token A -> Taker
        tokenA.transfer(msg.sender, order.amountA);
        
        // Token B -> Maker
        tokenB.transfer(order.maker, amountB);
        
        order.active = false;
        emit OrderFilled(orderId, msg.sender);
    }
}


```

## 🧪 Test Suite

`test/SwapERC7984ERC7984.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SwapERC7984ERC7984, MockConfidentialToken } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SwapERC7984ERC7984", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let swapContract: SwapERC7984ERC7984;
  let tokenA: MockConfidentialToken;
  let tokenB: MockConfidentialToken;
  let swapAddress: string;
  let tokenAAddress: string;
  let tokenBAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Deploy Tokens
    const confFactory = await ethers.getContractFactory("MockConfidentialToken");
    
    tokenA = (await confFactory.deploy()) as MockConfidentialToken;
    tokenAAddress = await tokenA.getAddress();
    
    tokenB = (await confFactory.deploy()) as MockConfidentialToken;
    tokenBAddress = await tokenB.getAddress();

    // Deploy Swap
    const swapFactory = await ethers.getContractFactory("SwapERC7984ERC7984");
    swapContract = (await swapFactory.deploy(tokenAAddress, tokenBAddress)) as SwapERC7984ERC7984;
    swapAddress = await swapContract.getAddress();
  });

  /**
   * @chapter openzeppelin
   * @example erc7984-erc7984-swap
   * @summary Private atomic swap between two confidential ERC7984 tokens.
   */
  it("should swap confidential tokens when amounts match", async function () {
    const amountA = 100;
    const amountB = 200;

    // Alice has Token A
    await tokenA.mint(signers.alice.address, amountA);
    await tokenA.connect(signers.alice).approve(swapAddress, amountA);

    // Bob has Token B
    await tokenB.mint(signers.bob.address, amountB);
    await tokenB.connect(signers.bob).approve(swapAddress, amountB);

    // Alice creates order: Offer 100 A, Ask 200 B
    const inputA = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(amountA)
        .encrypt();
    
    const inputAskB = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(amountB)
        .encrypt();

    await swapContract.connect(signers.alice).createOrder(
        inputA.handles[0], inputA.inputProof,
        inputAskB.handles[0], inputAskB.inputProof
    );

    // Alice's balance A should be 0
    const aliceBalanceHandleA = await tokenA.balanceOf(signers.alice.address);
    const aliceBalanceA = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandleA, tokenAAddress, signers.alice);
    expect(aliceBalanceA).to.equal(0);

    // Bob fills order: Sends 200 B
    const inputB = await fhevm.createEncryptedInput(swapAddress, signers.bob.address)
        .add64(amountB)
        .encrypt();

    await swapContract.connect(signers.bob).fillOrder(0, inputB.handles[0], inputB.inputProof);

    // Check Final Balances
    
    // Alice should have 200 Token B
    const aliceBalanceHandleB = await tokenB.balanceOf(signers.alice.address);
    const aliceBalanceB = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandleB, tokenBAddress, signers.alice);
    expect(aliceBalanceB).to.equal(amountB);

    // Bob should have 100 Token A
    const bobBalanceHandleA = await tokenA.balanceOf(signers.bob.address);
    const bobBalanceA = await fhevm.userDecryptEuint(FhevmType.euint64, bobBalanceHandleA, tokenAAddress, signers.bob);
    expect(bobBalanceA).to.equal(amountA);
  });

  it("should fail when amounts do not match", async function () {
    const amountA = 100;
    const askAmountB = 200;
    const wrongAmountB = 150;

    // Alice Setup
    await tokenA.mint(signers.alice.address, amountA);
    await tokenA.connect(signers.alice).approve(swapAddress, amountA);
    
    const inputA = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(amountA)
        .encrypt();
    const inputAskB = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
        .add64(askAmountB)
        .encrypt();

    await swapContract.connect(signers.alice).createOrder(
        inputA.handles[0], inputA.inputProof,
        inputAskB.handles[0], inputAskB.inputProof
    );

    // Bob Setup
    await tokenB.mint(signers.bob.address, wrongAmountB);
    await tokenB.connect(signers.bob).approve(swapAddress, wrongAmountB);

    // Bob tries to fill with wrong amount
    const inputB = await fhevm.createEncryptedInput(swapAddress, signers.bob.address)
        .add64(wrongAmountB)
        .encrypt();

    await expect(
        swapContract.connect(signers.bob).fillOrder(0, inputB.handles[0], inputB.inputProof)
    ).to.be.reverted; // FHE.req reversion
  });
});


```

## Usage

To generate this example locally:

```bash
npx run create erc7984-erc7984-swap ./my-erc7984-erc7984-swap
```

Then run tests:

```bash
cd ./my-erc7984-erc7984-swap
npm install
npm run test
```

---
Generated by FHEVM Example Hub

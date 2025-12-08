---
id: erc7984-erc20-swap
title: Swap ERC7984 <-> ERC20
category: openzeppelin
tags: [openzeppelin, defi, swap]
description: Atomic swap between ERC7984 and ERC20 tokens
---

# Swap ERC7984 <-> ERC20

> Atomic swap between ERC7984 and ERC20 tokens

## Overview

This example demonstrates how to implement **Swap ERC7984 <-> ERC20** using FHEVM.

- **Level:** 🟡 Intermediate
- **Category:** openzeppelin

## 📝 Contract Implementation

`contracts/SwapERC7984ERC20.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import { IERC7984 } from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Swap ERC7984 <-> ERC20
/// @notice Atomic swap between a confidential ERC7984 token and a public ERC20 token.
contract SwapERC7984ERC20 is ZamaEthereumConfig {
    IERC20 public publicToken;
    IERC7984 public confidentialToken;

    struct Order {
        address seller;
        uint256 publicAmountAsking;
        euint64 confidentialAmountSelling;
        bool active;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId;

    event OrderCreated(uint256 indexed orderId, address indexed seller, uint256 publicAmountAsking);
    event OrderFilled(uint256 indexed orderId, address indexed buyer);

    constructor(address _publicToken, address _confidentialToken) {
        publicToken = IERC20(_publicToken);
        confidentialToken = IERC7984(_confidentialToken);
    }

    /// @notice Seller creates an order by depositing confidential tokens
    function createOrder(externalEuint64 encryptedAmount, bytes calldata proof, uint256 askingAmount) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        
        // Transfer confidential tokens from Seller to Contract
        // Seller must have set this contract as operator
        FHE.allow(amount, address(confidentialToken));
        confidentialToken.confidentialTransferFrom(msg.sender, address(this), amount);
        
        orders[nextOrderId] = Order({
            seller: msg.sender,
            publicAmountAsking: askingAmount,
            confidentialAmountSelling: amount,
            active: true
        });
        
        // Allow contract to manage this amount (allowThis)
        FHE.allowThis(orders[nextOrderId].confidentialAmountSelling);

        emit OrderCreated(nextOrderId, msg.sender, askingAmount);
        nextOrderId++;
    }

    /// @notice Buyer fills the order by paying public tokens
    function fillOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        
        // 1. Transfer Public Token: Buyer -> Seller
        bool success = publicToken.transferFrom(msg.sender, order.seller, order.publicAmountAsking);
        require(success, "Public token transfer failed");
        
        // 2. Transfer Confidential Token: Contract -> Buyer
        confidentialToken.confidentialTransfer(msg.sender, order.confidentialAmountSelling);
        
        order.active = false;
        emit OrderFilled(orderId, msg.sender);
    }
}

// Helpers for testing
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Public", "PUB") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    function mint(address to, uint256 amount) public { _mint(to, amount); }
}

contract MockConfidentialToken is ERC7984, ZamaEthereumConfig {
    constructor() ERC7984("Mock Private", "PRIV", "") {}
    function mint(address to, uint64 amount) public { _mint(to, FHE.asEuint64(amount)); }
}


```

## 🧪 Test Suite

`test/SwapERC7984ERC20.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SwapERC7984ERC20, MockERC20, MockConfidentialToken } from "../../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SwapERC7984ERC20", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let swapContract: SwapERC7984ERC20;
  let publicToken: MockERC20;
  let confidentialToken: MockConfidentialToken;
  let swapAddress: string;
  let confTokenAddress: string;
  let pubTokenAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Deploy Tokens
    const pubFactory = await ethers.getContractFactory("MockERC20");
    publicToken = (await pubFactory.deploy()) as MockERC20;
    pubTokenAddress = await publicToken.getAddress();

    const confFactory = await ethers.getContractFactory("MockConfidentialToken");
    confidentialToken = (await confFactory.deploy()) as MockConfidentialToken;
    confTokenAddress = await confidentialToken.getAddress();

    // Deploy Swap
    const swapFactory = await ethers.getContractFactory("SwapERC7984ERC20");
    swapContract = (await swapFactory.deploy(pubTokenAddress, confTokenAddress)) as SwapERC7984ERC20;
    swapAddress = await swapContract.getAddress();
  });

  /**
   * @chapter openzeppelin
   * @example erc7984-erc20-swap
   * @summary Atomic swap between confidential ERC7984 and public ERC20.
   */
  it("should swap confidential tokens for public tokens", async function () {
    const sellAmount = 100;
    const buyAmount = 500;

    // Setup Alice (Seller): Has Confidential Token
    await confidentialToken.mint(signers.alice.address, sellAmount);
    await confidentialToken.connect(signers.alice).setOperator(swapAddress, "281474976710655");

    // Setup Bob (Buyer): Has Public Token
    await publicToken.mint(signers.bob.address, buyAmount);
    await publicToken.connect(signers.bob).approve(swapAddress, buyAmount);

    // Alice creates order
    // Encrypt amount
    const input = await fhevm.createEncryptedInput(swapAddress, signers.alice.address)
      .add64(sellAmount)
      .encrypt();

    await swapContract.connect(signers.alice).createOrder(input.handles[0], input.inputProof, buyAmount);

    // Check: Alice's confidential balance should be 0 (transferred to contract)
    const aliceBalanceHandle = await confidentialToken.confidentialBalanceOf(signers.alice.address);
    const aliceBalance = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandle, confTokenAddress, signers.alice);
    expect(aliceBalance).to.equal(0);

    // Bob fills order
    await swapContract.connect(signers.bob).fillOrder(0);

    // Check: Bob's confidential balance should be 100
    const bobBalanceHandle = await confidentialToken.confidentialBalanceOf(signers.bob.address);
    const bobBalance = await fhevm.userDecryptEuint(FhevmType.euint64, bobBalanceHandle, confTokenAddress, signers.bob);
    expect(bobBalance).to.equal(sellAmount);

    // Check: Alice's public balance should be 500
    expect(await publicToken.balanceOf(signers.alice.address)).to.equal(buyAmount);
  });
});


```

## Usage

To generate this example locally:

```bash
npm run create erc7984-erc20-swap ./my-erc7984-erc20-swap
```

Then run tests:

```bash
cd ./my-erc7984-erc20-swap
npm install
npm run compile
npm run test
```

---
Generated by FHEVM Example Hub

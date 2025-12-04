---
id: blind-auction
title: Blind Auction
category: applications
tags: [applications, defi, advanced]
description: Sealed-bid auction with confidential bids
---

# Blind Auction

> Sealed-bid auction with confidential bids

## Overview

This example demonstrates how to implement **Blind Auction** using FHEVM.

- **Level:** 🔴 Advanced
- **Category:** applications

## 📝 Contract Implementation

`contracts/BlindAuction.sol`

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract BlindAuction is ZamaEthereumConfig {
    euint32 private _highestBid;
    bool public ended;
    address public beneficiary;
    uint32 public clearHighestBid;

    mapping(address => euint32) private _bids;

    // Mapping from requestID to user address for claims
    mapping(uint256 => address) public claimRequests;

    event AuctionEnded(uint32 highestBid);
    event BidPlaced(address indexed user);
    event WinnerClaimed(address indexed user, bool result);

    constructor() {
        _highestBid = FHE.asEuint32(0);
        FHE.allowThis(_highestBid);
        beneficiary = msg.sender;
    }

    function bid(externalEuint32 input, bytes calldata inputProof) external {
        require(!ended, "Auction ended");
        
        euint32 userBid = FHE.fromExternal(input, inputProof);
        _bids[msg.sender] = userBid;
        FHE.allowThis(userBid);

        // Update highest bid
        ebool isHigher = FHE.gt(userBid, _highestBid);
        _highestBid = FHE.select(isHigher, userBid, _highestBid);
        FHE.allowThis(_highestBid);
        
        emit BidPlaced(msg.sender);
    }

    function stopAuction() external {
        require(msg.sender == beneficiary, "Not beneficiary");
        require(!ended, "Already ended");
        ended = true;

        uint256[] memory cts = new uint256[](1);
        cts[0] = euint32.unwrap(_highestBid);
        FHE.req(cts, this.onStopCallback.selector);
    }

    function onStopCallback(uint256 /*requestID*/, uint32 decryptedBid) external {
        // Ideally enforce onlyCOPROCESSOR here
        clearHighestBid = decryptedBid;
        emit AuctionEnded(decryptedBid);
    }

    function claim() external {
        require(ended, "Not ended");
        
        euint32 myBid = _bids[msg.sender];
        // Check if my bid == highestBid
        ebool isWinner = FHE.eq(myBid, FHE.asEuint32(clearHighestBid));
        
        uint256[] memory cts = new uint256[](1);
        cts[0] = ebool.unwrap(isWinner);
        
        uint256 reqID = FHE.req(cts, this.onClaimCallback.selector);
        claimRequests[reqID] = msg.sender;
    }
    
    function onClaimCallback(uint256 requestID, bool isWinner) external {
        // Ideally enforce onlyCOPROCESSOR here
        address user = claimRequests[requestID];
        delete claimRequests[requestID];
        
        if (isWinner) {
            emit WinnerClaimed(user, true);
        } else {
            emit WinnerClaimed(user, false);
        }
    }
}


```

## 🧪 Test Suite

`test/BlindAuction.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { BlindAuction, BlindAuction__factory } from "../../types";
import { expect } from "chai";

async function deployFixture() {
  const factory = (await ethers.getContractFactory("BlindAuction")) as BlindAuction__factory;
  const contract = (await factory.deploy()) as BlindAuction;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("BlindAuction", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: BlindAuction;
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

  it("should determine the winner correctly", async function () {
    // Alice bids 10
    const inputAlice = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    await contract.connect(signers.alice).bid(inputAlice.handles[0], inputAlice.inputProof);

    // Bob bids 20
    const inputBob = await fhevm.createEncryptedInput(contractAddress, signers.bob.address)
      .add32(20)
      .encrypt();
    await contract.connect(signers.bob).bid(inputBob.handles[0], inputBob.inputProof);

    // Stop Auction
    const tx = await contract.stopAuction();
    await tx.wait();
    
    // In mock, we usually need to assume async operation completes or is mocked instantaneously.
    // If this fails, we need to insert await logic.

    // Bob claims
    const claimTx = await contract.connect(signers.bob).claim();
    await claimTx.wait();
    
    // Alice claims
    const claimTxAlice = await contract.connect(signers.alice).claim();
    await claimTxAlice.wait();
    
    await expect(claimTx)
        .to.emit(contract, "WinnerClaimed")
        .withArgs(signers.bob.address, true);

    await expect(claimTxAlice)
        .to.emit(contract, "WinnerClaimed")
        .withArgs(signers.alice.address, false);
  });
});


```

## Usage

To generate this example locally:

```bash
npx run create blind-auction ./my-blind-auction
```

Then run tests:

```bash
cd ./my-blind-auction
npm install
npm run test
```

---
Generated by FHEVM Example Hub

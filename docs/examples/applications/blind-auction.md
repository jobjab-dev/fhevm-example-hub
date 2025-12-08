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

interface IGateway {
    function requestDecryption(uint256[] calldata ctsHandles, bytes4 callbackSelector, uint256 msgValue, uint256 maxTimestamp, bool passSignaturesToCaller) external returns (uint256);
}

contract BlindAuction is ZamaEthereumConfig {
    euint32 private _highestBid;
    bool public ended;
    address public beneficiary;
    uint32 public clearHighestBid;
    address public gateway;

    mapping(address => euint32) private _bids;

    // Mapping from requestID to user address for claims
    mapping(uint256 => address) public claimRequests;

    event AuctionEnded(uint32 highestBid);
    event BidPlaced(address indexed user);
    event WinnerClaimed(address indexed user, bool result);

    constructor(address _gateway) {
        _highestBid = FHE.asEuint32(0);
        FHE.allowThis(_highestBid);
        beneficiary = msg.sender;
        gateway = _gateway;
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
        cts[0] = uint256(euint32.unwrap(_highestBid));
        IGateway(gateway).requestDecryption(cts, this.onStopCallback.selector, 0, block.timestamp + 100, false);
    }

    function onStopCallback(uint256 /*requestID*/, uint256 decryptedBid) external {
        // Ideally enforce onlyCOPROCESSOR here
        clearHighestBid = uint32(decryptedBid);
        emit AuctionEnded(clearHighestBid);
    }

    function claim() external {
        require(ended, "Not ended");
        
        euint32 myBid = _bids[msg.sender];
        // Check if my bid == highestBid
        ebool isWinner = FHE.eq(myBid, FHE.asEuint32(clearHighestBid));
        
        uint256[] memory cts = new uint256[](1);
        cts[0] = uint256(ebool.unwrap(isWinner));
        
        uint256 reqID = IGateway(gateway).requestDecryption(cts, this.onClaimCallback.selector, 0, block.timestamp + 100, false);
        claimRequests[reqID] = msg.sender;
    }
    
    function onClaimCallback(uint256 requestID, uint256 isWinnerVal) external {
        // Ideally enforce onlyCOPROCESSOR here
        bool isWinner = isWinnerVal == 1;
        address user = claimRequests[requestID];
        delete claimRequests[requestID];
        
        if (isWinner) {
            emit WinnerClaimed(user, true);
        } else {
            emit WinnerClaimed(user, false);
        }
    }
}

contract MockGateway {
    event RequestDecryption(uint256[] handles, bytes4 selector, address callbackTarget);

    uint256 public nextReqId;

    function requestDecryption(
        uint256[] calldata handles,
        bytes4 selector,
        uint256 /*msgValue*/,
        uint256 /*maxTimestamp*/,
        bool /*passSignaturesToCaller*/
    ) external returns (uint256) {
        emit RequestDecryption(handles, selector, msg.sender);
        return nextReqId++;
    }

    function fulfillRequest(address target, bytes4 selector, uint256 reqId, uint256 decryptedValue) external {
        (bool success, ) = target.call(abi.encodeWithSelector(selector, reqId, decryptedValue));
        require(success, "Callback failed");
    }
}

```

## 🧪 Test Suite

`test/BlindAuction.ts`

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { BlindAuction, MockGateway } from "../../types";
import { expect } from "chai";

async function deployFixture() {
  const [deployer, alice, bob] = await ethers.getSigners();

  // Deploy Mock Gateway
  const gatewayFactory = await ethers.getContractFactory("MockGateway");
  const gateway = (await gatewayFactory.deploy()) as MockGateway;

  // Deploy Blind Auction with Gateway address
  const factory = await ethers.getContractFactory("BlindAuction");
  const contract = (await factory.deploy(await gateway.getAddress())) as BlindAuction;
  const contractAddress = await contract.getAddress();

  return { contract, gateway, contractAddress, deployer, alice, bob };
}

describe("BlindAuction", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let contract: BlindAuction;
  let gateway: MockGateway;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }
    const fixture = await deployFixture();
    contract = fixture.contract;
    gateway = fixture.gateway;
    contractAddress = fixture.contractAddress;
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

    // Catch RequestDecryption event from Gateway
    // Event: RequestDecryption(handles, selector, callbackTarget)
    const requestEvent = (await gateway.queryFilter(gateway.filters.RequestDecryption()))[0];
    const args = requestEvent.args;
    const reqId = 0; // First request

    // Fulfill request: We know Bob (20) is highest.
    await gateway.fulfillRequest(args.callbackTarget, args.selector, reqId, 20);

    const ended = await contract.ended();
    expect(ended).to.be.true;

    // Claim - Bob
    const claimTxBob = await contract.connect(signers.bob).claim();
    await claimTxBob.wait();

    // Catch Bob's claim decryption request
    const claimRequests = await gateway.queryFilter(gateway.filters.RequestDecryption());
    const claimReqBob = claimRequests[1]; // Second request (Index 1)

    // Bob is winner (1)
    await gateway.fulfillRequest(claimReqBob.args.callbackTarget, claimReqBob.args.selector, 1, 1);
  });

  it("should emit WinnerClaimed event upon fulfillment", async function () {
    // Setup bid 10 (Alice)
    const inputAlice = await fhevm.createEncryptedInput(contractAddress, signers.alice.address)
      .add32(10)
      .encrypt();
    await contract.connect(signers.alice).bid(inputAlice.handles[0], inputAlice.inputProof);

    // Stop
    await contract.stopAuction();

    // Fulfill stop (10)
    const reqs = await gateway.queryFilter(gateway.filters.RequestDecryption());
    await gateway.fulfillRequest(reqs[0].args.callbackTarget, reqs[0].args.selector, 0, 10);

    // Alice claims
    await contract.connect(signers.alice).claim();
    const reqs2 = await gateway.queryFilter(gateway.filters.RequestDecryption());
    const tx = await gateway.fulfillRequest(reqs2[1].args.callbackTarget, reqs2[1].args.selector, 1, 1);

    await expect(tx).to.emit(contract, "WinnerClaimed").withArgs(signers.alice.address, true);
  });

  it("should fail if non-beneficiary stops auction", async function () {
    await expect(contract.connect(signers.bob).stopAuction()).to.be.revertedWith("Not beneficiary");
  });

  it("should fail if bidding after end", async function () {
    await contract.stopAuction();
    const input = await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add32(10).encrypt();
    await expect(contract.bid(input.handles[0], input.inputProof)).to.be.revertedWith("Auction ended");
  });
});


```

## Usage

To generate this example locally:

```bash
npm run create blind-auction ./my-blind-auction
```

Then run tests:

```bash
cd ./my-blind-auction
npm install
npm run compile
npm run test
```

---
Generated by FHEVM Example Hub

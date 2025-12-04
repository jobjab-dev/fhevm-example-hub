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


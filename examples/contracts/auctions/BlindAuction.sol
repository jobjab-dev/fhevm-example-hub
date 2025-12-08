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

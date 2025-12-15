// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "encrypted-types/EncryptedTypes.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateCrowdfunding is ZamaEthereumConfig {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    struct Campaign {
        address creator;
        euint64 targetAmount;
        euint64 totalPledged;
        uint256 deadline;
        bool isFinalized;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;

    // campaignId => user => encrypted pledge amount
    mapping(uint256 => mapping(address => euint64)) public pledges;

    event CampaignCreated(uint256 indexed campaignId, address creator, uint256 deadline);
    event Pledged(uint256 indexed campaignId, address contributor);
    event CampaignFinalized(uint256 indexed campaignId);

    constructor() {
        owner = msg.sender;
    }

    function createCampaign(externalEuint64 _encryptedTarget, bytes calldata _inputProof, uint256 _duration) public {
        campaignCount++;
        Campaign storage c = campaigns[campaignCount];
        c.creator = msg.sender;
        c.targetAmount = FHE.fromExternal(_encryptedTarget, _inputProof);
        FHE.allowThis(c.targetAmount);
        
        c.totalPledged = FHE.asEuint64(0);
        FHE.allowThis(c.totalPledged);
        c.deadline = block.timestamp + _duration;
        
        emit CampaignCreated(campaignCount, msg.sender, c.deadline);
    }

    function pledge(uint256 _campaignId, externalEuint64 _encryptedAmount, bytes calldata _inputProof) public {
        Campaign storage c = campaigns[_campaignId];
        require(block.timestamp < c.deadline, "Campaign ended");
        
        euint64 amount = FHE.fromExternal(_encryptedAmount, _inputProof);
        FHE.allowThis(amount);
        
        // Update user pledge
        if (!FHE.isInitialized(pledges[_campaignId][msg.sender])) {
             pledges[_campaignId][msg.sender] = amount;
             FHE.allowThis(pledges[_campaignId][msg.sender]);
        } else {
             pledges[_campaignId][msg.sender] = FHE.add(pledges[_campaignId][msg.sender], amount);
             FHE.allowThis(pledges[_campaignId][msg.sender]);
        }
        
        // Update total
        c.totalPledged = FHE.add(c.totalPledged, amount);
        FHE.allowThis(c.totalPledged);

        emit Pledged(_campaignId, msg.sender);
    }

    function finalizeCampaign(uint256 _campaignId) public {
        Campaign storage c = campaigns[_campaignId];
        require(block.timestamp >= c.deadline, "Campaign ongoing");
        require(!c.isFinalized, "Already finalized");

        // Check if totalPledged >= targetAmount
        ebool reached = FHE.ge(c.totalPledged, c.targetAmount);
        
        // Allow the Creator to see the results
        FHE.allow(c.totalPledged, c.creator);
        FHE.allow(c.targetAmount, c.creator);
        FHE.allow(reached, c.creator);
        
        c.isFinalized = true;
        
        emit CampaignFinalized(_campaignId);
    }
}

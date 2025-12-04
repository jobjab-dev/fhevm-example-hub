// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Lab: Replay Attack
/// @notice Demonstrates potential replay issues if state checks are missing.
contract LabReplayAttack is ZamaEthereumConfig {
    mapping(address => euint64) private _balances;
    mapping(address => bool) public hasClaimed;

    constructor() {}

    /// @notice Vulnerable function: Allows using the same input multiple times?
    /// Actually, FHEVM inputs might be reusable across transactions if not careful?
    /// Zama's current testnet/library might allow re-submission of the same valid input 
    /// if the application logic doesn't prevent it.
    function vulnerableClaim(externalEuint64 input, bytes calldata proof) external {
         euint64 amount = FHE.fromExternal(input, proof);
         
         // If I call this twice with the same input, I add amount twice.
         _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
         FHE.allowThis(_balances[msg.sender]);
    }

    /// @notice Secure function: Checks state to prevent double action
    function secureClaim(externalEuint64 input, bytes calldata proof) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        
        euint64 amount = FHE.fromExternal(input, proof);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        FHE.allowThis(_balances[msg.sender]);
        
        hasClaimed[msg.sender] = true;
    }
    
    function balanceOf(address user) external view returns (euint64) {
        return _balances[user];
    }
}


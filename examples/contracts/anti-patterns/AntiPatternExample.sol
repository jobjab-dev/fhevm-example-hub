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

    /// @notice Anti-Pattern: Forgetting FHE.allowThis()
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
}


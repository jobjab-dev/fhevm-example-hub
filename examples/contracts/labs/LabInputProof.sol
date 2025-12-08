// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Lab 01: Input Proofs & Binding
/// @notice This contract is designed for educational purposes.
/// @dev GOAL: Understand why we need to bind input proofs to a specific contract/user.
contract LabInputProof is ZamaEthereumConfig {
    euint32 private _secureValue;

    constructor() {
        _secureValue = FHE.asEuint32(0);
        FHE.allowThis(_secureValue);
    }

    /// @notice A standard setter function.
    /// @dev CHALLENGE: Can you call this function using a proof generated for ANOTHER contract?
    function setValue(externalEuint32 input, bytes calldata inputProof) external {
        // FHE.fromExternal verifies the proof is for THIS contract and THIS sender.
        _secureValue = FHE.fromExternal(input, inputProof);
        FHE.allowThis(_secureValue);
    }

    function getValue() external view returns (euint32) {
        return _secureValue;
    }
}


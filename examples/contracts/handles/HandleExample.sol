// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Handle Lifecycle Example
/// @notice Demonstrates how FHE handles work under the hood.
contract HandleExample is ZamaEthereumConfig {
    euint32 private _storedValue;

    constructor() {
        _storedValue = FHE.asEuint32(0);
        FHE.allowThis(_storedValue);
    }

    /// @notice Returns the raw handle ID for the stored value.
    /// @dev Handles are just uint256 identifiers pointing to data in the Coprocessor/Validator memory.
    function getHandle() external view returns (uint256) {
        return euint32.unwrap(_storedValue);
    }

    /// @notice Demonstrates that operations produce NEW handles.
    /// @return originalHandle The handle of the input.
    /// @return newHandle The handle of the result (different).
    function compareHandles(externalEuint32 input, bytes calldata inputProof) 
        external 
        returns (uint256 originalHandle, uint256 newHandle) 
    {
        euint32 val = FHE.fromExternal(input, inputProof);
        FHE.allowThis(val);
        
        euint32 res = FHE.add(val, FHE.asEuint32(1));
        FHE.allowThis(res);

        return (euint32.unwrap(val), euint32.unwrap(res));
    }
}


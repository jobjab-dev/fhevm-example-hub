// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Access Control Example
/// @notice Demonstrates FHE.allow and FHE.allowTransient for controlling access to encrypted data.
contract AccessControlExample is ZamaEthereumConfig {
    euint32 private _secureValue;

    // Event to emit for testing transient allowance
    event ValueAccessed(address indexed by);

    constructor() {
        // Initialize with 0
        _secureValue = FHE.asEuint32(0);
        FHE.allowThis(_secureValue);
    }

    /// @notice Sets a new secure value.
    /// @param input The encrypted value to set.
    /// @param inputProof The proof for the encrypted value.
    function setSecureValue(externalEuint32 input, bytes calldata inputProof) external {
        _secureValue = FHE.fromExternal(input, inputProof);
        FHE.allowThis(_secureValue);
    }

    /// @notice Grants persistent access to the caller.
    function grantAccessToSender() external {
        FHE.allow(_secureValue, msg.sender);
    }

    /// @notice Grants persistent access to a specific user.
    /// @param user The address to grant access to.
    function grantAccess(address user) external {
        FHE.allow(_secureValue, user);
    }

    /// @notice Returns the encrypted secure value.
    /// @return The encrypted euint32 handle.
    function getSecureValue() external view returns (euint32) {
        return _secureValue;
    }

    /// @notice Demonstrates transient allowance.
    /// @dev Allows a specific address (e.g. another contract) to access the value temporarily.
    /// @param other The address to grant transient access to.
    function temporaryUse(address other) external {
        FHE.allowTransient(_secureValue, other);
        emit ValueAccessed(other);
    }
}


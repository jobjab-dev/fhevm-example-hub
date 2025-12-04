// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Input Proof Example
/// @notice Demonstrates correct usage of Input Proofs to prevent Ciphertext Malling.
/// @dev In FHE, it is crucial to verify that the sender knows the plaintext of the ciphertext they are submitting.
/// This prevents "Malling" attacks where an attacker copies a ciphertext from another user/transaction
/// and submits it as their own, potentially tricking the contract.
/// FHE.fromExternal() automatically verifies this proof against the msg.sender.
contract InputProofExample is ZamaEthereumConfig {
    euint32 private _userValue;

    /// @notice Sets a value using an input proof.
    /// @dev The `inputProof` is cryptographically bound to `msg.sender` and the `input` ciphertext.
    /// If an attacker intercepts the `input` and tries to call this function, the proof verification will fail
    /// because the proof was signed by the original sender, not the attacker (unless they are the same).
    function setValue(externalEuint32 input, bytes calldata inputProof) external {
        // This function call will revert if the proof is invalid or not for msg.sender
        _userValue = FHE.fromExternal(input, inputProof);
        FHE.allowThis(_userValue);
    }
    
    function getValue() external view returns (euint32) {
        return _userValue;
    }
}


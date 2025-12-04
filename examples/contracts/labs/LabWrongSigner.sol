// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Lab: Wrong Signer
/// @notice Demonstrates that encrypted inputs are bound to the msg.sender.
contract LabWrongSigner is ZamaEthereumConfig {
    euint64 private _state;
    
    constructor() {
        _state = FHE.asEuint64(0);
        FHE.allowThis(_state);
    }

    // Anyone can set state, but the input must be signed by them.
    function setState(externalEuint64 input, bytes calldata proof) external {
        // This line verifies that 'proof' is valid AND that it was signed by 'msg.sender'.
        // If Bob submits Alice's proof, msg.sender is Bob, but proof is signed by Alice.
        // FHE.fromExternal will REVERT.
        _state = FHE.fromExternal(input, proof);
        FHE.allowThis(_state);
    }
}


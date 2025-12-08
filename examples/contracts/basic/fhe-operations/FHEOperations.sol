// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint8, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Operations
/// @notice Demonstrates basic arithmetic operations on encrypted integers.
contract FHEOperations is ZamaEthereumConfig {
  euint8 private _a;
  euint8 private _b;
  
  euint8 public sum;
  euint8 public diff;
  euint8 public prod;
  // euint8 public quot; // Division is supported but watch out for division by zero
  euint8 public isEqualResult;

  constructor() {
      _a = FHE.asEuint8(0);
      _b = FHE.asEuint8(0);
  }

  function setValues(externalEuint8 inputA, bytes calldata proofA, externalEuint8 inputB, bytes calldata proofB) external {
    _a = FHE.fromExternal(inputA, proofA);
    _b = FHE.fromExternal(inputB, proofB);
    FHE.allowThis(_a);
    FHE.allowThis(_b);
  }

  function add() external {
    sum = FHE.add(_a, _b);
    FHE.allowThis(sum);
    FHE.allow(sum, msg.sender);
  }

  function sub() external {
    // Note: uint overflow/underflow works as expected in FHE (modular arithmetic)
    diff = FHE.sub(_a, _b);
    FHE.allowThis(diff);
    FHE.allow(diff, msg.sender);
  }

  function mul() external {
    prod = FHE.mul(_a, _b);
    FHE.allowThis(prod);
    FHE.allow(prod, msg.sender);
  }

  function checkEqual() external {
    ebool isEq = FHE.eq(_a, _b);
    // Convert ebool to euint8 (1 = true, 0 = false) for easier decryption and verification
    isEqualResult = FHE.select(isEq, FHE.asEuint8(1), FHE.asEuint8(0));
    FHE.allowThis(isEqualResult);
    FHE.allow(isEqualResult, msg.sender);
  }
}


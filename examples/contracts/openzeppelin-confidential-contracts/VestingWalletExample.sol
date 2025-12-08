// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import { IERC7984 } from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Confidential Vesting Wallet
/// @notice Handles the vesting of ERC7984 confidential tokens for a beneficiary.
contract VestingWalletExample is ZamaEthereumConfig {
    IERC7984 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable duration;

    euint64 private _totalReleased;
    euint64 private _totalAllocation;
    bool private _initialized;

    event TokensReleased(address indexed beneficiary, uint256 amount); // Amount is hidden, so maybe don't emit amount? Or emit encrypted handle? 
    // Standard Events usually emit amount, but here it's confidential. We just emit "Something happened".

    constructor(
        address _token,
        address _beneficiary,
        uint64 _startTimestamp,
        uint64 _durationSeconds
    ) {
        token = IERC7984(_token);
        beneficiary = _beneficiary;
        start = _startTimestamp;
        duration = _durationSeconds;
        _totalReleased = FHE.asEuint64(0);
        FHE.allowThis(_totalReleased);
    }

    /// @notice Initialize the vesting by depositing tokens (can be done once)
    function initialize(externalEuint64 encryptedAmount, bytes calldata proof) external {
        require(!_initialized, "Already initialized");
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        
        FHE.allow(amount, address(token));
        token.confidentialTransferFrom(msg.sender, address(this), amount);
        
        _totalAllocation = amount;
        FHE.allowThis(_totalAllocation);
        
        _initialized = true;
    }

    /// @notice Release vested tokens to beneficiary
    function release() external {
        uint64 currentTimestamp = uint64(block.timestamp);
        require(currentTimestamp > start, "Vesting has not started");
        
        euint64 vested = _vestedAmount(currentTimestamp);
        euint64 releasable = FHE.sub(vested, _totalReleased);
        
        // Update released state
        _totalReleased = FHE.add(_totalReleased, releasable);
        FHE.allowThis(_totalReleased); // Allow contract to use updated value

        // Transfer releasable amount to beneficiary
        FHE.allow(releasable, address(token));
        token.confidentialTransfer(beneficiary, releasable);
    }

    /// @notice Calculates the amount that has already vested
    function _vestedAmount(uint64 timestamp) internal returns (euint64) {
        if (timestamp < start) {
            return FHE.asEuint64(0);
        } else if (timestamp >= start + duration) {
            return _totalAllocation;
        } else {
            // Linear vesting: allocation * (time - start) / duration
            uint64 timePassed = timestamp - start;
            // euint64 * uint64 (scalar) -> euint64
            euint64 vested = FHE.mul(_totalAllocation, FHE.asEuint64(timePassed));
            // euint64 / uint64 (scalar) -> euint64
            // Zama FHEVM supports scalar operations.
            return FHE.div(vested, duration);
        }
    }
    
    // View function to check vested amount (only beneficiary should be able to see?)
    // Actually, we can return a handle for the beneficiary.
    function vestedAmount() external view returns (euint64) {
         // In a real app, we'd need to re-encrypt this for the caller (beneficiary) using FHE.seal() 
         // or just return the handle if they have permission?
         // Since allowThis is used, we need to allow beneficiary to view it.
         // But view functions cannot change state (FHE.allow).
         // So we can't easily "view" the exact result unless we use FHE.allowTransient in a tx.
         // For this example, we skip the view function or return 0.
         // Best practice: The beneficiary calls a TX to "check and re-encrypt" if they want to see status.
         return _totalReleased; // This is a handle, only readable if allowed.
    }
}

// Helpers
contract MockConfidentialToken is ERC7984, ZamaEthereumConfig {
    constructor() ERC7984("Mock Private", "PRIV", "") {}
    function mint(address to, uint64 amount) public { _mint(to, FHE.asEuint64(amount)); }
}


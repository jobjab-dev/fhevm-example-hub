// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "encrypted-types/EncryptedTypes.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateAgeVerification is ZamaEthereumConfig {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // Encrypted storage of user birth years
    mapping(address => euint32) private userBirthYears;
    mapping(address => bool) public isRegistered;
    
    constructor() {
        owner = msg.sender;
    }

    function registerBirthYear(externalEuint32 _encryptedBirthYear, bytes calldata _inputProof) public {
        userBirthYears[msg.sender] = FHE.fromExternal(_encryptedBirthYear, _inputProof);
        isRegistered[msg.sender] = true;
        
        FHE.allowThis(userBirthYears[msg.sender]);
        FHE.allow(userBirthYears[msg.sender], msg.sender);
    }

    // Returns an encrypted boolean indicating if the user is older than _minAge
    // We calculate age as: CurrentYear - BirthYear >= MinAge
    // <=> CurrentYear - MinAge >= BirthYear
    function isOverAge(uint256 _currentYear, uint32 _minAge) public returns (ebool) {
        require(isRegistered[msg.sender], "User not registered");
        
        // ageLimitYear = CurrentYear - MinAge
        // User must be born on or before this year.
        uint32 ageLimitYear = uint32(_currentYear - _minAge);
        
        // We check: ageLimitYear >= BirthYear
        ebool isOlder = FHE.ge(FHE.asEuint32(ageLimitYear), userBirthYears[msg.sender]);
        
        return isOlder;
    }
    
    // Non-view function to generate and share proof
    function proveAgeTo(address _verifier, uint256 _currentYear, uint32 _minAge) public {
        require(isRegistered[msg.sender], "User not registered");

        uint32 ageLimitYear = uint32(_currentYear - _minAge);
        ebool isOlder = FHE.ge(FHE.asEuint32(ageLimitYear), userBirthYears[msg.sender]);

        FHE.allow(isOlder, _verifier);
        FHE.allow(isOlder, msg.sender);
    }
}

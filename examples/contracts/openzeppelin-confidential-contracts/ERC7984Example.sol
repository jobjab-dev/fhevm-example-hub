// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

contract ERC7984Example is ERC7984, ZamaEthereumConfig {
    constructor() ERC7984("ConfidentialToken", "CTK", "https://example.com/meta") {}

    function mint(address to, uint64 amount) public {
        _mint(to, FHE.asEuint64(amount));
    }

    // Helper to allow transfer from external encrypted input
    // ERC7984 might have this, but being explicit is safe for this example.
    function transferExternal(address to, externalEuint64 input, bytes calldata inputProof) external returns (bool) {
        euint64 amount = FHE.fromExternal(input, inputProof);
        _transfer(msg.sender, to, amount);
        return true;
    }
}


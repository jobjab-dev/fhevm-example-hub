// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984Wrapper } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/extensions/ERC7984Wrapper.sol";
import { ERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/ERC7984.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ERC20 Wrapper Example
/// @notice Demonstrates how to wrap a public ERC20 token into a confidential ERC7984 token.
contract ERC20WrapperExample is ERC7984Wrapper, ZamaEthereumConfig {
    constructor(IERC20 underlyingToken) 
        ERC7984Wrapper(underlyingToken) 
        ERC7984("Wrapped Mock Token", "wMCK") 
    {}
}

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MCK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/ERC7984.sol";
import { IERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/IERC7984.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Swap ERC7984 <-> ERC20
/// @notice Atomic swap between a confidential ERC7984 token and a public ERC20 token.
contract SwapERC7984ERC20 is ZamaEthereumConfig {
    IERC20 public publicToken;
    IERC7984 public confidentialToken;

    struct Order {
        address seller;
        uint256 publicAmountAsking;
        euint64 confidentialAmountSelling;
        bool active;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId;

    event OrderCreated(uint256 indexed orderId, address indexed seller, uint256 publicAmountAsking);
    event OrderFilled(uint256 indexed orderId, address indexed buyer);

    constructor(address _publicToken, address _confidentialToken) {
        publicToken = IERC20(_publicToken);
        confidentialToken = IERC7984(_confidentialToken);
    }

    /// @notice Seller creates an order by depositing confidential tokens
    function createOrder(externalEuint64 encryptedAmount, bytes calldata proof, uint256 askingAmount) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        
        // Transfer confidential tokens from Seller to Contract
        // Seller must have approved this contract
        confidentialToken.transferFrom(msg.sender, address(this), amount);
        
        orders[nextOrderId] = Order({
            seller: msg.sender,
            publicAmountAsking: askingAmount,
            confidentialAmountSelling: amount,
            active: true
        });
        
        // Allow contract to manage this amount (allowThis)
        FHE.allowThis(orders[nextOrderId].confidentialAmountSelling);

        emit OrderCreated(nextOrderId, msg.sender, askingAmount);
        nextOrderId++;
    }

    /// @notice Buyer fills the order by paying public tokens
    function fillOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        
        // 1. Transfer Public Token: Buyer -> Seller
        bool success = publicToken.transferFrom(msg.sender, order.seller, order.publicAmountAsking);
        require(success, "Public token transfer failed");
        
        // 2. Transfer Confidential Token: Contract -> Buyer
        confidentialToken.transfer(msg.sender, order.confidentialAmountSelling);
        
        order.active = false;
        emit OrderFilled(orderId, msg.sender);
    }
}

// Helpers for testing
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Public", "PUB") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    function mint(address to, uint256 amount) public { _mint(to, amount); }
}

contract MockConfidentialToken is ERC7984 {
    constructor() ERC7984("Mock Private", "PRIV") {}
    function mint(address to, uint64 amount) public { _mint(to, amount); }
}


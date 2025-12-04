// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/ERC7984.sol";
import { IERC7984 } from "openzeppelin-confidential-contracts/contracts/token/ERC7984/IERC7984.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";

/// @title Swap ERC7984 <-> ERC7984
/// @notice Atomic swap between two confidential ERC7984 tokens with hidden amounts.
contract SwapERC7984ERC7984 is ZamaEthereumConfig {
    IERC7984 public tokenA;
    IERC7984 public tokenB;

    struct Order {
        address maker;
        euint64 amountA;      // Amount offered by Maker
        euint64 askAmountB;   // Amount requested from Taker
        bool active;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId;

    event OrderCreated(uint256 indexed orderId, address indexed maker);
    event OrderFilled(uint256 indexed orderId, address indexed taker);

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC7984(_tokenA);
        tokenB = IERC7984(_tokenB);
    }

    /// @notice Maker creates an order
    /// @param encryptedAmountA Amount of Token A to sell
    /// @param encryptedAskAmountB Amount of Token B required
    function createOrder(
        externalEuint64 encryptedAmountA, 
        bytes calldata proofA,
        externalEuint64 encryptedAskAmountB,
        bytes calldata proofB
    ) external {
        euint64 amountA = FHE.fromExternal(encryptedAmountA, proofA);
        euint64 askAmountB = FHE.fromExternal(encryptedAskAmountB, proofB);
        
        // Lock Token A from Maker
        tokenA.transferFrom(msg.sender, address(this), amountA);
        
        orders[nextOrderId] = Order({
            maker: msg.sender,
            amountA: amountA,
            askAmountB: askAmountB,
            active: true
        });
        
        // Allow contract to manage these handles
        FHE.allowThis(orders[nextOrderId].amountA);
        FHE.allowThis(orders[nextOrderId].askAmountB);

        emit OrderCreated(nextOrderId, msg.sender);
        nextOrderId++;
    }

    /// @notice Taker fills the order
    /// @param encryptedAmountB Amount of Token B sending
    function fillOrder(uint256 orderId, externalEuint64 encryptedAmountB, bytes calldata proofB) external {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        
        euint64 amountB = FHE.fromExternal(encryptedAmountB, proofB);

        // Check if Taker sent enough Token B
        ebool isEnough = FHE.eq(amountB, order.askAmountB);
        
        // Enforce the check (Reverts if false)
        // Note: This reveals whether the amount was correct.
        FHE.req(isEnough);

        // Lock Token B from Taker
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        // Swap:
        // Token A -> Taker
        tokenA.transfer(msg.sender, order.amountA);
        
        // Token B -> Maker
        tokenB.transfer(order.maker, amountB);
        
        order.active = false;
        emit OrderFilled(orderId, msg.sender);
    }
}


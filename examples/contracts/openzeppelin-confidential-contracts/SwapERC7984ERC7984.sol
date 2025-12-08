// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import { IERC7984 } from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
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
        FHE.allow(amountA, address(tokenA));
        tokenA.confidentialTransferFrom(msg.sender, address(this), amountA);
        
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
        
        // Conditional swap based on amount check
        euint64 zero = FHE.asEuint64(0);
        
        // If enough, transfer amountB; else transfer 0
        euint64 amountBToTransfer = FHE.select(isEnough, amountB, zero);
        
        // If enough, transfer amountA; else transfer 0
        euint64 amountAToTransfer = FHE.select(isEnough, order.amountA, zero);

        // Lock Token B from Taker (transfer conditional amount)
        FHE.allow(amountBToTransfer, address(tokenB));
        tokenB.confidentialTransferFrom(msg.sender, address(this), amountBToTransfer);
        
        // Swap:
        // Token A -> Taker
        FHE.allow(amountAToTransfer, address(tokenA));
        tokenA.confidentialTransfer(msg.sender, amountAToTransfer);
        
        // Token B -> Maker
        FHE.allow(amountBToTransfer, address(tokenB));
        tokenB.confidentialTransfer(order.maker, amountBToTransfer);
        
        order.active = false;
        emit OrderFilled(orderId, msg.sender);
    }
}

contract MockConfidentialToken is ERC7984, ZamaEthereumConfig {
    constructor() ERC7984("Mock Private", "PRIV", "") {}
    function mint(address to, uint64 amount) public { _mint(to, FHE.asEuint64(amount)); }
}


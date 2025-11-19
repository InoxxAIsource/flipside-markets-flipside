// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IConditionalTokens {
    function getPositionId(IERC20 collateralToken, bytes32 collectionId) external pure returns (uint256);
    function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint256 indexSet) external pure returns (bytes32);
    function splitPosition(IERC20 collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] calldata partition, uint256 amount) external;
    function mergePositions(IERC20 collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] calldata partition, uint256 amount) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

/**
 * AMMPool - Constant-sum AMM for binary prediction markets
 * Uses x + y = k formula for YES/NO token pricing
 * Supports liquidity provision with LP tokens
 */
contract AMMPool is ERC20, ReentrancyGuard, IERC1155Receiver {
    // Contracts
    IERC20 public immutable collateralToken;
    IConditionalTokens public immutable conditionalTokens;
    
    // Market parameters
    bytes32 public immutable conditionId;
    uint256 public immutable yesPositionId;
    uint256 public immutable noPositionId;
    address public immutable oracle; // Oracle that can resolve the market
    
    // Fee configuration (in basis points, 1% = 100)
    uint256 public immutable lpFeeRate;        // e.g., 150 = 1.5%
    uint256 public immutable protocolFeeRate;  // e.g., 50 = 0.5%
    address public immutable treasury;
    
    // Reserves
    uint256 public yesReserve;
    uint256 public noReserve;
    
    // Resolution state
    bool public resolved;
    uint256 public winningOutcome; // 0 for NO, 1 for YES
    
    // Constants
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MIN_LIQUIDITY = 1000; // Minimum liquidity lock
    
    // Events
    event Swap(
        address indexed user,
        bool buyYes,
        uint256 amountIn,
        uint256 amountOut,
        uint256 lpFee,
        uint256 protocolFee
    );
    
    event LiquidityAdded(
        address indexed provider,
        uint256 yesAmount,
        uint256 noAmount,
        uint256 lpTokens
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 yesAmount,
        uint256 noAmount,
        uint256 lpTokens
    );
    
    event MarketResolved(uint256 winningOutcome);
    
    constructor(
        string memory name,
        string memory symbol,
        address _collateralToken,
        address _conditionalTokens,
        bytes32 _conditionId,
        uint256 _yesPositionId,
        uint256 _noPositionId,
        uint256 _lpFeeRate,
        uint256 _protocolFeeRate,
        address _treasury,
        address _oracle
    ) ERC20(name, symbol) {
        collateralToken = IERC20(_collateralToken);
        conditionalTokens = IConditionalTokens(_conditionalTokens);
        conditionId = _conditionId;
        yesPositionId = _yesPositionId;
        noPositionId = _noPositionId;
        lpFeeRate = _lpFeeRate;
        protocolFeeRate = _protocolFeeRate;
        treasury = _treasury;
        oracle = _oracle;
    }
    
    /**
     * Add liquidity to the pool
     * User must deposit complete sets (YES + NO tokens)
     * Mints LP tokens proportional to contribution
     */
    function addLiquidity(uint256 yesAmount, uint256 noAmount) external nonReentrant returns (uint256 lpTokens) {
        require(yesAmount > 0 && noAmount > 0, "Amount must be positive");
        require(!resolved, "Market resolved");
        
        // Transfer YES and NO tokens from user
        conditionalTokens.safeTransferFrom(msg.sender, address(this), yesPositionId, yesAmount, "");
        conditionalTokens.safeTransferFrom(msg.sender, address(this), noPositionId, noAmount, "");
        
        // Calculate LP tokens to mint
        uint256 totalSupply = totalSupply();
        
        if (totalSupply == 0) {
            // First liquidity provider
            lpTokens = yesAmount + noAmount;
            require(lpTokens >= MIN_LIQUIDITY, "Insufficient initial liquidity");
            
            // Lock minimum liquidity permanently
            _mint(address(1), MIN_LIQUIDITY);
            lpTokens -= MIN_LIQUIDITY;
        } else {
            // Proportional to existing pool
            uint256 totalReserve = yesReserve + noReserve;
            lpTokens = ((yesAmount + noAmount) * totalSupply) / totalReserve;
        }
        
        require(lpTokens > 0, "Insufficient LP tokens");
        
        // Update reserves
        yesReserve += yesAmount;
        noReserve += noAmount;
        
        // Mint LP tokens
        _mint(msg.sender, lpTokens);
        
        emit LiquidityAdded(msg.sender, yesAmount, noAmount, lpTokens);
    }
    
    /**
     * Remove liquidity from the pool
     * Burns LP tokens and returns proportional YES + NO tokens
     */
    function removeLiquidity(uint256 lpTokens) external nonReentrant returns (uint256 yesAmount, uint256 noAmount) {
        require(lpTokens > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= lpTokens, "Insufficient LP tokens");
        
        uint256 totalSupply = totalSupply();
        require(totalSupply > 0, "No liquidity");
        
        // Calculate proportional share
        yesAmount = (lpTokens * yesReserve) / totalSupply;
        noAmount = (lpTokens * noReserve) / totalSupply;
        
        require(yesAmount > 0 && noAmount > 0, "Insufficient output");
        
        // Update reserves
        yesReserve -= yesAmount;
        noReserve -= noAmount;
        
        // Burn LP tokens
        _burn(msg.sender, lpTokens);
        
        // Transfer tokens to user
        conditionalTokens.safeTransferFrom(address(this), msg.sender, yesPositionId, yesAmount, "");
        conditionalTokens.safeTransferFrom(address(this), msg.sender, noPositionId, noAmount, "");
        
        emit LiquidityRemoved(msg.sender, yesAmount, noAmount, lpTokens);
    }
    
    /**
     * Swap YES for NO or NO for YES
     * Uses constant-sum pricing: x + y = k
     * Applies fees to swaps
     */
    function swap(
        bool buyYes,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be positive");
        require(!resolved, "Market resolved");
        require(yesReserve > 0 && noReserve > 0, "No liquidity");
        
        // Calculate total fees
        uint256 totalFee = (amountIn * (lpFeeRate + protocolFeeRate)) / BASIS_POINTS;
        uint256 lpFee = (amountIn * lpFeeRate) / BASIS_POINTS;
        uint256 protocolFee = totalFee - lpFee;
        
        uint256 amountInAfterFee = amountIn - totalFee;
        
        // Constant-sum pricing: amountOut = amountInAfterFee
        // (In constant-sum, 1 YES = 1 NO at equilibrium)
        amountOut = amountInAfterFee;
        
        require(amountOut >= minAmountOut, "Slippage exceeded");
        
        if (buyYes) {
            require(amountOut <= noReserve, "Insufficient NO reserve");
            
            // Transfer NO tokens from user
            conditionalTokens.safeTransferFrom(msg.sender, address(this), noPositionId, amountIn, "");
            
            // Update reserves (LP fee stays in pool for auto-compounding)
            noReserve += (amountIn - protocolFee);
            yesReserve -= amountOut;
            
            // Transfer YES tokens to user
            conditionalTokens.safeTransferFrom(address(this), msg.sender, yesPositionId, amountOut, "");
            
            // Transfer protocol fee (in NO tokens)
            if (protocolFee > 0) {
                conditionalTokens.safeTransferFrom(address(this), treasury, noPositionId, protocolFee, "");
            }
        } else {
            require(amountOut <= yesReserve, "Insufficient YES reserve");
            
            // Transfer YES tokens from user
            conditionalTokens.safeTransferFrom(msg.sender, address(this), yesPositionId, amountIn, "");
            
            // Update reserves (LP fee stays in pool for auto-compounding)
            yesReserve += (amountIn - protocolFee);
            noReserve -= amountOut;
            
            // Transfer NO tokens to user
            conditionalTokens.safeTransferFrom(address(this), msg.sender, noPositionId, amountOut, "");
            
            // Transfer protocol fee (in YES tokens)
            if (protocolFee > 0) {
                conditionalTokens.safeTransferFrom(address(this), treasury, yesPositionId, protocolFee, "");
            }
        }
        
        emit Swap(msg.sender, buyYes, amountIn, amountOut, lpFee, protocolFee);
    }
    
    /**
     * Resolve market with winning outcome
     * Can only be called by oracle
     */
    function resolve(uint256 _winningOutcome) external {
        require(msg.sender == oracle, "Only oracle can resolve");
        require(!resolved, "Already resolved");
        require(_winningOutcome == 0 || _winningOutcome == 1, "Invalid outcome");
        
        resolved = true;
        winningOutcome = _winningOutcome;
        
        emit MarketResolved(_winningOutcome);
    }
    
    /**
     * Redeem LP tokens for collateral after resolution
     * LP receives proportional share of winning tokens
     */
    function redeemLPTokens(uint256 lpTokens) external nonReentrant returns (uint256 payout) {
        require(resolved, "Market not resolved");
        require(lpTokens > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= lpTokens, "Insufficient LP tokens");
        
        uint256 totalSupply = totalSupply();
        require(totalSupply > 0, "No liquidity");
        
        // Calculate proportional share of winning tokens
        uint256 winningReserve = winningOutcome == 1 ? yesReserve : noReserve;
        payout = (lpTokens * winningReserve) / totalSupply;
        
        require(payout > 0, "No payout");
        
        // Update reserves
        if (winningOutcome == 1) {
            yesReserve -= payout;
        } else {
            noReserve -= payout;
        }
        
        // Burn LP tokens
        _burn(msg.sender, lpTokens);
        
        // Transfer winning tokens
        uint256 winningPositionId = winningOutcome == 1 ? yesPositionId : noPositionId;
        conditionalTokens.safeTransferFrom(address(this), msg.sender, winningPositionId, payout, "");
    }
    
    /**
     * Get current price of YES token (in basis points)
     * price = NO_reserve / (YES_reserve + NO_reserve)
     * Higher NO reserves = higher YES price (scarcity pricing)
     */
    function getYesPrice() external view returns (uint256) {
        if (yesReserve + noReserve == 0) return 5000; // 50% if no liquidity
        return (noReserve * BASIS_POINTS) / (yesReserve + noReserve);
    }
    
    /**
     * Get reserves
     */
    function getReserves() external view returns (uint256, uint256) {
        return (yesReserve, noReserve);
    }
    
    /**
     * Calculate swap output amount (with fees)
     */
    function getSwapOutput(bool buyYes, uint256 amountIn) external view returns (uint256 amountOut, uint256 totalFee) {
        totalFee = (amountIn * (lpFeeRate + protocolFeeRate)) / BASIS_POINTS;
        amountOut = amountIn - totalFee;
        
        // Check if sufficient reserves
        if (buyYes) {
            require(amountOut <= noReserve, "Insufficient reserves");
        } else {
            require(amountOut <= yesReserve, "Insufficient reserves");
        }
    }
    
    /**
     * ERC1155 Receiver implementation
     * Required to receive ERC1155 tokens (YES/NO tokens)
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
    
    /**
     * ERC165 support
     */
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}

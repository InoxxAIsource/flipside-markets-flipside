// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AMMPool.sol";
import "./ConditionalTokens.sol";

/**
 * AMMPoolFactorySimple - Simple factory for creating AMM pools
 * Non-upgradeable version for faster deployment
 */
contract AMMPoolFactorySimple is Ownable {
    // Dependencies
    address public immutable collateralToken;
    address public immutable conditionalTokens;
    address public treasury;
    
    // Fee constraints (in basis points)
    uint256 public minLPFee = 50;        // 0.5%
    uint256 public maxLPFee = 500;       // 5%
    uint256 public minProtocolFee = 10;  // 0.1%
    uint256 public maxProtocolFee = 200; // 2%
    
    // Default fees
    uint256 public defaultLPFee = 150;       // 1.5%
    uint256 public defaultProtocolFee = 50;  // 0.5%
    
    // Pool tracking
    mapping(bytes32 => address) public pools; // conditionId => pool address
    address[] public allPools;
    
    // Events
    event PoolCreated(
        address indexed pool,
        bytes32 indexed conditionId,
        uint256 yesPositionId,
        uint256 noPositionId,
        uint256 lpFee,
        uint256 protocolFee
    );
    
    event FeeLimitsUpdated(
        uint256 minLPFee,
        uint256 maxLPFee,
        uint256 minProtocolFee,
        uint256 maxProtocolFee
    );
    
    event DefaultFeesUpdated(uint256 lpFee, uint256 protocolFee);
    event TreasuryUpdated(address newTreasury);
    
    constructor(
        address _collateralToken,
        address _conditionalTokens,
        address _treasury
    ) Ownable(msg.sender) {
        require(_collateralToken != address(0), "Invalid collateral");
        require(_conditionalTokens != address(0), "Invalid CT");
        require(_treasury != address(0), "Invalid treasury");
        
        collateralToken = _collateralToken;
        conditionalTokens = _conditionalTokens;
        treasury = _treasury;
    }
    
    /**
     * Create a new AMM pool for a condition
     */
    function createPool(
        string memory name,
        string memory symbol,
        bytes32 conditionId,
        address oracle,
        uint256 yesPositionId,
        uint256 noPositionId,
        uint256 lpFee,
        uint256 protocolFee
    ) external returns (address pool) {
        require(pools[conditionId] == address(0), "Pool exists");
        require(lpFee >= minLPFee && lpFee <= maxLPFee, "Invalid LP fee");
        require(protocolFee >= minProtocolFee && protocolFee <= maxProtocolFee, "Invalid protocol fee");
        
        // Deploy new pool
        pool = address(new AMMPool(
            name,
            symbol,
            collateralToken,
            conditionalTokens,
            conditionId,
            yesPositionId,
            noPositionId,
            lpFee,
            protocolFee,
            treasury,
            oracle
        ));
        
        pools[conditionId] = pool;
        allPools.push(pool);
        
        emit PoolCreated(pool, conditionId, yesPositionId, noPositionId, lpFee, protocolFee);
        
        return pool;
    }
    
    /**
     * Create pool with default fees
     */
    function createPoolWithDefaults(
        string memory name,
        string memory symbol,
        bytes32 conditionId,
        address oracle,
        uint256 yesPositionId,
        uint256 noPositionId
    ) external returns (address pool) {
        require(pools[conditionId] == address(0), "Pool exists");
        
        // Deploy new pool with default fees
        pool = address(new AMMPool(
            name,
            symbol,
            collateralToken,
            conditionalTokens,
            conditionId,
            yesPositionId,
            noPositionId,
            defaultLPFee,
            defaultProtocolFee,
            treasury,
            oracle
        ));
        
        pools[conditionId] = pool;
        allPools.push(pool);
        
        emit PoolCreated(pool, conditionId, yesPositionId, noPositionId, defaultLPFee, defaultProtocolFee);
        
        return pool;
    }
    
    /**
     * Update fee limits (owner only)
     */
    function updateFeeLimits(
        uint256 _minLPFee,
        uint256 _maxLPFee,
        uint256 _minProtocolFee,
        uint256 _maxProtocolFee
    ) external onlyOwner {
        require(_minLPFee <= _maxLPFee, "Invalid LP range");
        require(_minProtocolFee <= _maxProtocolFee, "Invalid protocol range");
        
        minLPFee = _minLPFee;
        maxLPFee = _maxLPFee;
        minProtocolFee = _minProtocolFee;
        maxProtocolFee = _maxProtocolFee;
        
        emit FeeLimitsUpdated(_minLPFee, _maxLPFee, _minProtocolFee, _maxProtocolFee);
    }
    
    /**
     * Update default fees (owner only)
     */
    function updateDefaultFees(
        uint256 _lpFee,
        uint256 _protocolFee
    ) external onlyOwner {
        require(_lpFee >= minLPFee && _lpFee <= maxLPFee, "Invalid LP fee");
        require(_protocolFee >= minProtocolFee && _protocolFee <= maxProtocolFee, "Invalid protocol fee");
        
        defaultLPFee = _lpFee;
        defaultProtocolFee = _protocolFee;
        
        emit DefaultFeesUpdated(_lpFee, _protocolFee);
    }
    
    /**
     * Update treasury address (owner only)
     */
    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * Get pool address for condition
     */
    function getPool(bytes32 conditionId) external view returns (address) {
        return pools[conditionId];
    }
    
    /**
     * Get total number of pools
     */
    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }
}

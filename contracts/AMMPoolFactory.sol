// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AMMPool.sol";
import "./ConditionalTokens.sol";

/**
 * AMMPoolFactory - Upgradeable factory for creating AMM pools
 * Deploys new pool instances with configurable fees
 * UUPS upgradeable pattern
 */
contract AMMPoolFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // Dependencies
    address public collateralToken;
    address public conditionalTokens;
    address public treasury;
    
    // Fee constraints (in basis points)
    uint256 public minLPFee;        // e.g., 50 = 0.5%
    uint256 public maxLPFee;        // e.g., 500 = 5%
    uint256 public minProtocolFee;  // e.g., 10 = 0.1%
    uint256 public maxProtocolFee;  // e.g., 200 = 2%
    
    // Default fees
    uint256 public defaultLPFee;       // e.g., 150 = 1.5%
    uint256 public defaultProtocolFee; // e.g., 50 = 0.5%
    
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
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * Initialize the factory
     */
    function initialize(
        address _collateralToken,
        address _conditionalTokens,
        address _treasury
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        collateralToken = _collateralToken;
        conditionalTokens = _conditionalTokens;
        treasury = _treasury;
        
        // Set default fee limits (0.5% - 5% for LP, 0.1% - 2% for protocol)
        minLPFee = 50;
        maxLPFee = 500;
        minProtocolFee = 10;
        maxProtocolFee = 200;
        
        // Set default fees (1.5% LP, 0.5% protocol)
        defaultLPFee = 150;
        defaultProtocolFee = 50;
    }
    
    /**
     * Create a new AMM pool for a binary prediction market
     * @param oracle Oracle address that will resolve the market
     * @param questionId Unique identifier for the market question
     * @param name LP token name (e.g., "Flipside LP - ETH > $5K")
     * @param symbol LP token symbol (e.g., "LP-ETH5K")
     * @param lpFee LP fee rate in basis points (or 0 for default)
     * @param protocolFee Protocol fee rate in basis points (or 0 for default)
     */
    function createPool(
        address oracle,
        bytes32 questionId,
        string memory name,
        string memory symbol,
        uint256 lpFee,
        uint256 protocolFee
    ) external returns (address pool) {
        // Use default fees if not specified
        if (lpFee == 0) lpFee = defaultLPFee;
        if (protocolFee == 0) protocolFee = defaultProtocolFee;
        
        // Validate fees
        require(lpFee >= minLPFee && lpFee <= maxLPFee, "Invalid LP fee");
        require(protocolFee >= minProtocolFee && protocolFee <= maxProtocolFee, "Invalid protocol fee");
        
        // Prepare condition on ConditionalTokens
        ConditionalTokens ct = ConditionalTokens(conditionalTokens);
        bytes32 conditionId = ct.getConditionId(oracle, questionId, 2);
        
        require(pools[conditionId] == address(0), "Pool already exists");
        
        // Prepare the condition (creates YES/NO outcome slots)
        ct.prepareCondition(oracle, questionId, 2);
        
        // Get position IDs for YES (index 1) and NO (index 2)
        bytes32 parentCollectionId = bytes32(0);
        bytes32 yesCollectionId = ct.getCollectionId(parentCollectionId, conditionId, 1);
        bytes32 noCollectionId = ct.getCollectionId(parentCollectionId, conditionId, 2);
        
        uint256 yesPositionId = ct.getPositionId(IERC20(collateralToken), yesCollectionId);
        uint256 noPositionId = ct.getPositionId(IERC20(collateralToken), noCollectionId);
        
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
            treasury
        ));
        
        // Track pool
        pools[conditionId] = pool;
        allPools.push(pool);
        
        emit PoolCreated(pool, conditionId, yesPositionId, noPositionId, lpFee, protocolFee);
    }
    
    /**
     * Update fee limits
     */
    function setFeeLimits(
        uint256 _minLPFee,
        uint256 _maxLPFee,
        uint256 _minProtocolFee,
        uint256 _maxProtocolFee
    ) external onlyOwner {
        require(_minLPFee <= _maxLPFee, "Invalid LP fee range");
        require(_minProtocolFee <= _maxProtocolFee, "Invalid protocol fee range");
        
        minLPFee = _minLPFee;
        maxLPFee = _maxLPFee;
        minProtocolFee = _minProtocolFee;
        maxProtocolFee = _maxProtocolFee;
        
        emit FeeLimitsUpdated(_minLPFee, _maxLPFee, _minProtocolFee, _maxProtocolFee);
    }
    
    /**
     * Update default fees
     */
    function setDefaultFees(uint256 _lpFee, uint256 _protocolFee) external onlyOwner {
        require(_lpFee >= minLPFee && _lpFee <= maxLPFee, "Invalid LP fee");
        require(_protocolFee >= minProtocolFee && _protocolFee <= maxProtocolFee, "Invalid protocol fee");
        
        defaultLPFee = _lpFee;
        defaultProtocolFee = _protocolFee;
        
        emit DefaultFeesUpdated(_lpFee, _protocolFee);
    }
    
    /**
     * Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * Get pool address for a condition
     */
    function getPool(bytes32 conditionId) external view returns (address) {
        return pools[conditionId];
    }
    
    /**
     * Get total number of pools
     */
    function poolCount() external view returns (uint256) {
        return allPools.length;
    }
    
    /**
     * Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

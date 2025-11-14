// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * CTFExchange - Polymarket-style order book exchange
 * Requires OPERATOR_ROLE for order execution (relayer-based)
 */
contract CTFExchange is AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC20 public immutable collateral;
    IERC1155 public immutable ctf;
    address public proxyFactory;

    mapping(uint256 => uint256) public complements;
    mapping(uint256 => bytes32) public conditionIds;
    mapping(bytes32 => bool) public filledOrders;
    
    bool public paused;

    struct Order {
        address maker;
        address makerAsset;
        address takerAsset;
        uint256 makerAmount;
        uint256 takerAmount;
        uint256 salt;
        uint256 expiry;
        uint8 side;
        bytes signature;
    }

    event OrderFilled(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 makerAssetId,
        uint256 takerAssetId,
        uint256 makerAmountFilled,
        uint256 takerAmountFilled,
        uint256 fee
    );

    event OrdersMatched(
        bytes32 indexed takerOrderHash,
        bytes32[] makerOrderHashes,
        uint256 takerFilled,
        uint256[] makerFilled
    );

    event TokenRegistered(
        uint256 indexed token0,
        uint256 indexed token1,
        bytes32 indexed conditionId
    );

    event TradingPaused();
    event TradingUnpaused();

    constructor(
        address _collateral,
        address _ctf,
        address _proxyFactory,
        address /* _safeFactory */
    ) {
        collateral = IERC20(_collateral);
        ctf = IERC1155(_ctf);
        proxyFactory = _proxyFactory;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    modifier whenNotPaused() {
        require(!paused, "Trading paused");
        _;
    }

    // Admin functions
    function pauseTrading() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = true;
        emit TradingPaused();
    }

    function unpauseTrading() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = false;
        emit TradingUnpaused();
    }

    function setProxyFactory(address _newProxyFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        proxyFactory = _newProxyFactory;
    }

    function setSafeFactory(address /* _newSafeFactory */) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Not implemented in minimal version
    }

    // Token registration
    function registerToken(
        uint256 token,
        uint256 complement,
        bytes32 conditionId
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        complements[token] = complement;
        complements[complement] = token;
        conditionIds[token] = conditionId;
        conditionIds[complement] = conditionId;
        
        emit TokenRegistered(token, complement, conditionId);
    }

    function getComplement(uint256 token) external view returns (uint256) {
        return complements[token];
    }

    function getConditionId(uint256 token) external view returns (bytes32) {
        return conditionIds[token];
    }

    // Order execution (onlyOperator)
    function fillOrder(
        Order calldata order,
        uint256 fillAmount
    ) public onlyRole(OPERATOR_ROLE) whenNotPaused {
        bytes32 orderHash = hashOrder(order);
        require(!filledOrders[orderHash], "Order already filled");
        require(block.timestamp <= order.expiry, "Order expired");
        require(fillAmount > 0, "Fill amount must be positive");

        filledOrders[orderHash] = true;

        // Simplified: Direct transfer (production would use signature verification)
        uint256 fee = (fillAmount * 25) / 10000; // 0.25% fee
        
        emit OrderFilled(
            orderHash,
            order.maker,
            msg.sender,
            uint256(uint160(order.makerAsset)),
            uint256(uint160(order.takerAsset)),
            order.makerAmount,
            order.takerAmount,
            fee
        );
    }

    function fillOrders(
        Order[] calldata orders,
        uint256[] calldata fillAmounts
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(orders.length == fillAmounts.length, "Array length mismatch");
        
        for (uint i = 0; i < orders.length; i++) {
            fillOrder(orders[i], fillAmounts[i]);
        }
    }

    function matchOrders(
        Order calldata takerOrder,
        Order[] calldata makerOrders,
        uint256 takerFillAmount,
        uint256[] calldata makerFillAmounts
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        bytes32 takerHash = hashOrder(takerOrder);
        bytes32[] memory makerHashes = new bytes32[](makerOrders.length);
        
        for (uint i = 0; i < makerOrders.length; i++) {
            makerHashes[i] = hashOrder(makerOrders[i]);
            fillOrder(makerOrders[i], makerFillAmounts[i]);
        }
        
        fillOrder(takerOrder, takerFillAmount);
        
        emit OrdersMatched(takerHash, makerHashes, takerFillAmount, makerFillAmounts);
    }

    // View functions
    function getCollateral() external view returns (address) {
        return address(collateral);
    }

    function getCtf() external view returns (address) {
        return address(ctf);
    }

    function getProxyFactory() external view returns (address) {
        return proxyFactory;
    }

    function getSafeFactory() external pure returns (address) {
        return address(0);
    }

    function isOrderFilled(bytes32 orderHash) external view returns (bool) {
        return filledOrders[orderHash];
    }

    function getOrderStatus(bytes32 orderHash) external view returns (uint256) {
        return filledOrders[orderHash] ? 1 : 0;
    }

    // Helper functions
    function hashOrder(Order calldata order) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                order.maker,
                order.makerAsset,
                order.takerAsset,
                order.makerAmount,
                order.takerAmount,
                order.salt,
                order.expiry,
                order.side
            )
        );
    }
}

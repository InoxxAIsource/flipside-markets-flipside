// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Minimal Conditional Tokens (Gnosis CTF)
 * Simplified implementation for prediction markets
 */
contract ConditionalTokens is ERC1155 {
    mapping(bytes32 => uint256) public outcomeSlotCounts;
    mapping(bytes32 => uint256[]) public payoutNumerators;
    
    event ConditionPreparation(
        bytes32 indexed conditionId,
        address indexed oracle,
        bytes32 indexed questionId,
        uint256 outcomeSlotCount
    );
    
    event ConditionResolution(
        bytes32 indexed conditionId,
        address indexed oracle,
        bytes32 indexed questionId,
        uint256 outcomeSlotCount,
        uint256[] payoutNumerators
    );
    
    event PositionSplit(
        address indexed stakeholder,
        IERC20 collateralToken,
        bytes32 indexed parentCollectionId,
        bytes32 indexed conditionId,
        uint256[] partition,
        uint256 amount
    );
    
    event PositionsMerge(
        address indexed stakeholder,
        IERC20 collateralToken,
        bytes32 indexed parentCollectionId,
        bytes32 indexed conditionId,
        uint256[] partition,
        uint256 amount
    );

    constructor() ERC1155("") {}

    function prepareCondition(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external {
        bytes32 conditionId = getConditionId(oracle, questionId, outcomeSlotCount);
        require(outcomeSlotCounts[conditionId] == 0, "Condition already prepared");
        outcomeSlotCounts[conditionId] = outcomeSlotCount;
        
        emit ConditionPreparation(conditionId, oracle, questionId, outcomeSlotCount);
    }

    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount));
    }

    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(conditionId, indexSet));
    }

    function getPositionId(
        IERC20 collateralToken,
        bytes32 collectionId
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(collateralToken, collectionId)));
    }

    function splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external {
        require(amount > 0, "Amount must be positive");
        
        // Transfer collateral from user
        require(
            collateralToken.transferFrom(msg.sender, address(this), amount),
            "Collateral transfer failed"
        );
        
        // Mint outcome tokens
        for (uint i = 0; i < partition.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            _mint(msg.sender, positionId, amount, "");
        }
        
        emit PositionSplit(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external {
        require(amount > 0, "Amount must be positive");
        
        // Burn outcome tokens
        for (uint i = 0; i < partition.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            _burn(msg.sender, positionId, amount);
        }
        
        // Return collateral to user
        require(
            collateralToken.transfer(msg.sender, amount),
            "Collateral transfer failed"
        );
        
        emit PositionsMerge(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    function reportPayouts(
        bytes32 questionId,
        uint256[] calldata _payoutNumerators
    ) external {
        // Simplified: caller must be oracle (no validation for testing)
        bytes32 conditionId = getConditionId(msg.sender, questionId, _payoutNumerators.length);
        require(payoutNumerators[conditionId].length == 0, "Payouts already reported");
        
        payoutNumerators[conditionId] = _payoutNumerators;
        
        emit ConditionResolution(conditionId, msg.sender, questionId, _payoutNumerators.length, _payoutNumerators);
    }

    function getOutcomeSlotCount(bytes32 conditionId) external view returns (uint256) {
        return outcomeSlotCounts[conditionId];
    }
}

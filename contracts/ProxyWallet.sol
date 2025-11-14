// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/**
 * ProxyWallet - User's gasless trading wallet
 * Executes transactions on behalf of users via meta-transactions
 */
contract ProxyWallet is IERC1155Receiver {
    address public immutable owner;
    mapping(address => uint256) public nonces;
    
    event ExecutionSuccess(address indexed to, uint256 value, bytes data, bytes returnData);
    event ExecutionFailure(address indexed to, uint256 value, bytes data);

    constructor(address _owner) {
        owner = _owner;
    }

    struct Call {
        address to;
        bytes data;
        uint256 value;
    }

    function execute(
        address to,
        bytes calldata data,
        uint256 value
    ) external payable returns (bytes memory) {
        require(msg.sender == owner, "Only owner");
        
        (bool success, bytes memory returnData) = to.call{value: value}(data);
        
        if (success) {
            emit ExecutionSuccess(to, value, data, returnData);
        } else {
            emit ExecutionFailure(to, value, data);
            revert("Execution failed");
        }
        
        return returnData;
    }

    function executeBatch(Call[] calldata calls) external payable returns (bytes[] memory) {
        require(msg.sender == owner, "Only owner");
        
        bytes[] memory results = new bytes[](calls.length);
        
        for (uint i = 0; i < calls.length; i++) {
            (bool success, bytes memory returnData) = calls[i].to.call{value: calls[i].value}(calls[i].data);
            
            if (success) {
                emit ExecutionSuccess(calls[i].to, calls[i].value, calls[i].data, returnData);
                results[i] = returnData;
            } else {
                emit ExecutionFailure(calls[i].to, calls[i].value, calls[i].data);
                revert("Batch execution failed");
            }
        }
        
        return results;
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    // ERC1155 Receiver
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * ProxyWallet - User's gasless trading wallet
 * Executes transactions on behalf of users via meta-transactions
 * Supports EIP-712 signatures for gasless operations
 */
contract ProxyWallet is IERC1155Receiver {
    using ECDSA for bytes32;
    
    address public immutable owner;
    mapping(address => uint256) public nonces;
    
    // EIP-712 Domain
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant META_TRANSACTION_TYPEHASH = keccak256(
        "MetaTransaction(address user,address target,bytes data,uint256 nonce,uint256 deadline)"
    );
    
    event ExecutionSuccess(address indexed to, uint256 value, bytes data, bytes returnData);
    event ExecutionFailure(address indexed to, uint256 value, bytes data);
    event MetaTransactionExecuted(address indexed user, address indexed target, uint256 nonce);

    constructor(address _owner) {
        owner = _owner;
        
        // Initialize EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("ProxyWallet")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
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

    /**
     * executeMetaTransaction - Execute transaction with EIP-712 signature
     * Allows relayer to execute transactions on behalf of users (gasless)
     * @param user The user who signed the transaction
     * @param target The target contract to call
     * @param data The calldata to execute
     * @param signature The EIP-712 signature from the user
     * @param deadline Expiry timestamp for the signature
     */
    function executeMetaTransaction(
        address user,
        address target,
        bytes calldata data,
        bytes calldata signature,
        uint256 deadline
    ) external payable returns (bytes memory) {
        require(user == owner, "User must be owner");
        require(block.timestamp <= deadline, "Signature expired");
        
        // Get current nonce and increment
        uint256 currentNonce = nonces[user];
        nonces[user]++;
        
        // Verify EIP-712 signature
        bytes32 structHash = keccak256(
            abi.encode(
                META_TRANSACTION_TYPEHASH,
                user,
                target,
                keccak256(data),
                currentNonce,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        address signer = digest.recover(signature);
        require(signer == user, "Invalid signature");
        
        // Execute the transaction
        (bool success, bytes memory returnData) = target.call{value: msg.value}(data);
        
        if (success) {
            emit ExecutionSuccess(target, msg.value, data, returnData);
            emit MetaTransactionExecuted(user, target, currentNonce);
        } else {
            emit ExecutionFailure(target, msg.value, data);
            revert("Meta-transaction execution failed");
        }
        
        return returnData;
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

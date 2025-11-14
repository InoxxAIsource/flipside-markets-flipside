// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProxyWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ProxyWalletFactory - Creates deterministic proxy wallets
 * Uses CREATE2 for deterministic addresses
 */
contract ProxyWalletFactory is Ownable {
    address public implementation;
    
    event ProxyCreation(address indexed instance, address indexed user);
    event ImplementationUpdated(address indexed newImplementation);

    constructor() Ownable(msg.sender) {}

    function setImplementation(address _newImplementation) external onlyOwner {
        implementation = _newImplementation;
        emit ImplementationUpdated(_newImplementation);
    }

    function getImplementation() external view returns (address) {
        return implementation;
    }

    function getInstanceAddress(
        address /* _implementation */,
        address user
    ) public view returns (address) {
        // Deterministic address calculation using CREATE2
        bytes32 salt = bytes32(uint256(uint160(user)));
        bytes memory bytecode = type(ProxyWallet).creationCode;
        bytes memory constructorArgs = abi.encode(user);
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(abi.encodePacked(bytecode, constructorArgs))
            )
        );
        return address(uint160(uint256(hash)));
    }

    function maybeMakeWallet(
        address /* _implementation */,
        address instanceAddress,
        address user
    ) external returns (address) {
        // Check if already deployed
        if (instanceAddress.code.length > 0) {
            return instanceAddress;
        }

        // Deploy new proxy wallet using CREATE2
        bytes32 salt = bytes32(uint256(uint160(user)));
        ProxyWallet wallet = new ProxyWallet{salt: salt}(user);
        
        require(address(wallet) == instanceAddress, "Address mismatch");
        
        emit ProxyCreation(address(wallet), user);
        return address(wallet);
    }

    // Main entry point for gasless transactions
    struct Call {
        address to;
        bytes data;
        uint256 value;
    }

    function proxy(Call[] calldata calls) external payable returns (bytes[] memory) {
        // For simplicity, this forwards to user's wallet
        // In production, this would handle meta-transaction verification
        revert("Use wallet.executeBatch directly");
    }
}

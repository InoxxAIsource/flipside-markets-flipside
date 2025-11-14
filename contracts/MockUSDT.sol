// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * Mock USDT for testing
 * 6 decimals to match real USDT
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {
        // Mint 1 million USDT to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // Allow anyone to mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

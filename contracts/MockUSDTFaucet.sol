// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MockUSDTFaucet
 * @notice Faucet contract for distributing test USDT tokens on Sepolia testnet
 * @dev Rate limits withdrawals to once per 24 hours per address
 */
contract MockUSDTFaucet is Ownable, ReentrancyGuard {
    IERC20 public immutable mockUSDT;
    
    // Faucet parameters
    uint256 public withdrawalAmount = 10 * 10**6; // 10 USDT (6 decimals)
    uint256 public lockTime = 24 hours;
    
    // Rate limiting
    mapping(address => uint256) public lastWithdrawalTime;
    mapping(address => uint256) public totalWithdrawn;
    
    // Optional limits
    uint256 public maxTotalWithdrawal = 100 * 10**6; // 100 USDT lifetime limit
    bool public faucetActive = true;
    
    // Events
    event TokensRequested(address indexed requester, uint256 amount, uint256 timestamp);
    event FaucetRefilled(address indexed donor, uint256 amount);
    event WithdrawalAmountUpdated(uint256 newAmount);
    event LockTimeUpdated(uint256 newLockTime);
    event FaucetToggled(bool active);
    
    /**
     * @param _mockUSDTAddress Address of the MockUSDT token contract
     */
    constructor(address _mockUSDTAddress) Ownable(msg.sender) {
        require(_mockUSDTAddress != address(0), "Invalid token address");
        mockUSDT = IERC20(_mockUSDTAddress);
    }
    
    /**
     * @notice Request tokens from the faucet
     * @dev Subject to rate limiting and balance checks
     */
    function requestTokens() external nonReentrant {
        require(faucetActive, "Faucet is currently inactive");
        require(
            block.timestamp >= lastWithdrawalTime[msg.sender] + lockTime,
            "Please wait before next request"
        );
        require(
            totalWithdrawn[msg.sender] + withdrawalAmount <= maxTotalWithdrawal,
            "Lifetime withdrawal limit reached"
        );
        require(
            mockUSDT.balanceOf(address(this)) >= withdrawalAmount,
            "Insufficient faucet balance"
        );
        
        // Update state before transfer (CEI pattern)
        lastWithdrawalTime[msg.sender] = block.timestamp;
        totalWithdrawn[msg.sender] += withdrawalAmount;
        
        // Transfer tokens
        require(
            mockUSDT.transfer(msg.sender, withdrawalAmount),
            "Token transfer failed"
        );
        
        emit TokensRequested(msg.sender, withdrawalAmount, block.timestamp);
    }
    
    /**
     * @notice Get time remaining until user can request again
     * @param user Address to check
     * @return Time in seconds until next allowed request (0 if can request now)
     */
    function getTimeUntilNextRequest(address user) external view returns (uint256) {
        uint256 nextAllowedTime = lastWithdrawalTime[user] + lockTime;
        if (block.timestamp >= nextAllowedTime) {
            return 0;
        }
        return nextAllowedTime - block.timestamp;
    }
    
    /**
     * @notice Get remaining lifetime allowance for user
     * @param user Address to check
     * @return Remaining tokens user can withdraw in their lifetime
     */
    function getRemainingAllowance(address user) external view returns (uint256) {
        uint256 withdrawn = totalWithdrawn[user];
        if (withdrawn >= maxTotalWithdrawal) {
            return 0;
        }
        return maxTotalWithdrawal - withdrawn;
    }
    
    /**
     * @notice Check if user can request tokens now
     * @param user Address to check
     * @return true if user can request tokens
     */
    function canRequest(address user) external view returns (bool) {
        if (!faucetActive) return false;
        if (mockUSDT.balanceOf(address(this)) < withdrawalAmount) return false;
        if (block.timestamp < lastWithdrawalTime[user] + lockTime) return false;
        if (totalWithdrawn[user] + withdrawalAmount > maxTotalWithdrawal) return false;
        return true;
    }
    
    // ===== ADMIN FUNCTIONS =====
    
    /**
     * @notice Update withdrawal amount per request
     * @param _amount New amount in token units (6 decimals for USDT)
     */
    function setWithdrawalAmount(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        withdrawalAmount = _amount;
        emit WithdrawalAmountUpdated(_amount);
    }
    
    /**
     * @notice Update lock time between requests
     * @param _lockTime New lock time in seconds
     */
    function setLockTime(uint256 _lockTime) external onlyOwner {
        require(_lockTime >= 1 minutes, "Lock time too short");
        lockTime = _lockTime;
        emit LockTimeUpdated(_lockTime);
    }
    
    /**
     * @notice Update maximum total withdrawal per address
     * @param _maxAmount New maximum amount
     */
    function setMaxTotalWithdrawal(uint256 _maxAmount) external onlyOwner {
        maxTotalWithdrawal = _maxAmount;
    }
    
    /**
     * @notice Toggle faucet active status
     */
    function toggleFaucet() external onlyOwner {
        faucetActive = !faucetActive;
        emit FaucetToggled(faucetActive);
    }
    
    /**
     * @notice Emergency withdrawal by owner
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(mockUSDT.transfer(owner(), _amount), "Withdrawal failed");
    }
    
    /**
     * @notice Get faucet balance
     * @return Current token balance of the faucet
     */
    function getFaucetBalance() external view returns (uint256) {
        return mockUSDT.balanceOf(address(this));
    }
}

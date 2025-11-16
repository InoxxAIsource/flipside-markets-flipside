const hre = require("hardhat");

async function main() {
  // MockUSDT address on Sepolia
  const MOCK_USDT_ADDRESS = "0xAf24D4DDbA993F6b11372528C678edb718a097Aa";
  
  console.log("Deploying MockUSDTFaucet...");
  console.log("MockUSDT address:", MOCK_USDT_ADDRESS);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy the faucet contract
  const MockUSDTFaucet = await hre.ethers.getContractFactory("MockUSDTFaucet");
  const faucet = await MockUSDTFaucet.deploy(MOCK_USDT_ADDRESS);
  
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  
  console.log("✅ MockUSDTFaucet deployed to:", faucetAddress);
  
  // Display faucet configuration
  const withdrawalAmount = await faucet.withdrawalAmount();
  const lockTime = await faucet.lockTime();
  const maxTotalWithdrawal = await faucet.maxTotalWithdrawal();
  
  console.log("\nFaucet Configuration:");
  console.log("- Withdrawal Amount:", hre.ethers.formatUnits(withdrawalAmount, 6), "USDT");
  console.log("- Lock Time:", (Number(lockTime) / 3600).toString(), "hours");
  console.log("- Max Total Withdrawal:", hre.ethers.formatUnits(maxTotalWithdrawal, 6), "USDT");
  
  console.log("\nNext steps:");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${faucetAddress} ${MOCK_USDT_ADDRESS}`);
  console.log("2. Fund the faucet with MockUSDT");
  console.log("3. Update server/config/contracts.ts with the faucet address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

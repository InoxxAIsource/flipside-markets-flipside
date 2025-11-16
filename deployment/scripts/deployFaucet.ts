/**
 * MockUSDT Faucet Deployment Script
 * 
 * Deploys the MockUSDTFaucet contract to Sepolia testnet.
 * The faucet allows users to claim 10 USDT once every 24 hours.
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Use the same RPC as hardhat config
const SEPOLIA_RPC = "https://sepolia.gateway.tenderly.co";

// MockUSDT address on Sepolia
const MOCK_USDT_ADDRESS = "0xAf24D4DDbA993F6b11372528C678edb718a097Aa";

async function deployFaucet() {
  console.log("\n🚰 Deploying MockUSDTFaucet...\n");

  try {
    if (!process.env.OWNER_PRIVATE_KEY) {
      throw new Error("OWNER_PRIVATE_KEY not set in environment");
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const deployer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
    
    console.log(`Deployer Address: ${deployer.address}`);
    console.log(`MockUSDT Address: ${MOCK_USDT_ADDRESS}`);
    
    // Get deployer balance
    const balance = await provider.getBalance(deployer.address);
    console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH\n`);

    // Load compiled contract
    const artifactPath = path.join(process.cwd(), "artifacts/contracts/MockUSDTFaucet.sol/MockUSDTFaucet.json");
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found at ${artifactPath}. Run 'npx hardhat compile' first.`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    
    // Create contract factory
    const MockUSDTFaucet = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      deployer
    );

    console.log("📝 Deploying contract...");
    
    // Deploy the contract
    const faucet = await MockUSDTFaucet.deploy(MOCK_USDT_ADDRESS);
    await faucet.waitForDeployment();
    
    const faucetAddress = await faucet.getAddress();
    console.log(`✅ MockUSDTFaucet deployed to: ${faucetAddress}\n`);

    // Display faucet configuration
    const withdrawalAmount = await faucet.withdrawalAmount();
    const lockTime = await faucet.lockTime();
    const maxTotalWithdrawal = await faucet.maxTotalWithdrawal();
    
    console.log("⚙️  Faucet Configuration:");
    console.log(`   - Withdrawal Amount: ${ethers.formatUnits(withdrawalAmount, 6)} USDT`);
    console.log(`   - Lock Time: ${Number(lockTime) / 3600} hours`);
    console.log(`   - Max Total Withdrawal: ${ethers.formatUnits(maxTotalWithdrawal, 6)} USDT\n`);

    console.log("📋 Next steps:");
    console.log(`   1. Verify contract on Etherscan:`);
    console.log(`      npx hardhat verify --network sepolia ${faucetAddress} ${MOCK_USDT_ADDRESS}`);
    console.log(`   2. Fund the faucet with MockUSDT`);
    console.log(`   3. Update server/config/contracts.ts with faucet address: ${faucetAddress}\n`);

    // Write deployment info to file
    const deploymentInfo = {
      network: "sepolia",
      mockUSDTFaucet: faucetAddress,
      mockUSDT: MOCK_USDT_ADDRESS,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      config: {
        withdrawalAmount: ethers.formatUnits(withdrawalAmount, 6),
        lockTime: `${Number(lockTime) / 3600} hours`,
        maxTotalWithdrawal: ethers.formatUnits(maxTotalWithdrawal, 6),
      }
    };

    const outputPath = path.join(process.cwd(), "deployment/faucet-deployment.json");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${outputPath}\n`);

  } catch (error: any) {
    console.error("\n❌ Deployment failed:", error.message);
    if (error.error) {
      console.error("Details:", error.error);
    }
    process.exit(1);
  }
}

deployFaucet()
  .then(() => {
    console.log("✨ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

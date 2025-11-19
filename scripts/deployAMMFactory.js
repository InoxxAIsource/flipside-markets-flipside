const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying AMMPoolFactorySimple with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Get contract addresses from environment or use hardcoded Sepolia addresses
  const MOCK_USDT = process.env.MOCK_USDT_ADDRESS || "0xAf24D4DDbA993F6b11372528C678edb718a097Aa";
  const CONDITIONAL_TOKENS = process.env.CONDITIONAL_TOKENS_ADDRESS || "0xdC8CB01c328795C007879B2C030AbF1c1b580D84";
  const TREASURY = deployer.address; // Use deployer as treasury for now

  console.log("\nDeploying AMMPoolFactorySimple...");
  console.log("MockUSDT:", MOCK_USDT);
  console.log("ConditionalTokens:", CONDITIONAL_TOKENS);
  console.log("Treasury:", TREASURY);

  const Factory = await hre.ethers.getContractFactory("AMMPoolFactorySimple");
  const factory = await Factory.deploy(MOCK_USDT, CONDITIONAL_TOKENS, TREASURY);
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("\n✅ AMMPoolFactorySimple deployed to:", factoryAddress);
  console.log("\nUpdate server/config/contracts.ts with:");
  console.log(`  AMMPoolFactory: '${factoryAddress}',`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

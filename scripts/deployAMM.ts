import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({ network: process.env.HARDHAT_NETWORK || "sepolia" });
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying AMM contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get existing contract addresses
  const mockUSDT = "0xAf24D4DDbA993F6b11372528C678edb718a097Aa";
  const conditionalTokens = "0xdC8CB01c328795C007879B2C030AbF1c1b580D84";
  const treasury = deployer.address;

  console.log("\nUsing existing contracts:");
  console.log("MockUSDT:", mockUSDT);
  console.log("ConditionalTokens:", conditionalTokens);
  console.log("Treasury:", treasury);

  // 1. Deploy AMMPoolFactory
  console.log("\n1. Deploying AMMPoolFactory...");
  const ammPoolFactory = await ethers.deployContract("AMMPoolFactory", [], deployer);
  await ammPoolFactory.waitForDeployment();
  const ammPoolFactoryAddress = await ammPoolFactory.getAddress();
  console.log("AMMPoolFactory deployed to:", ammPoolFactoryAddress);

  // 2. Initialize the factory
  console.log("\n2. Initializing AMMPoolFactory...");
  const initTx = await ammPoolFactory.initialize(mockUSDT, conditionalTokens, treasury);
  await initTx.wait();
  console.log("Factory initialized");

  // Print summary
  console.log("\n=== AMM DEPLOYMENT SUMMARY ===");
  const summary = {
    AMMPoolFactory: ammPoolFactoryAddress,
    CollateralToken: mockUSDT,
    ConditionalTokens: conditionalTokens,
    Treasury: treasury,
    DefaultFees: {
      lpFee: "1.5%",
      protocolFee: "0.5%"
    },
    Network: "Sepolia Testnet"
  };
  console.log(JSON.stringify(summary, null, 2));

  console.log("\n✅ AMM deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${ammPoolFactoryAddress}`);
  console.log(`2. Update CONTRACT_ADDRESSES in server/config/contracts.ts:`);
  console.log(`   AMM_POOL_FACTORY: "${ammPoolFactoryAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

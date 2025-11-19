import { ethers } from 'ethers';
import { readFileSync } from 'fs';

async function main() {
  // Load compiled contract (using simplified non-upgradeable version)
  const factoryArtifact = JSON.parse(
    readFileSync('./artifacts/contracts/AMMPoolFactorySimple.sol/AMMPoolFactorySimple.json', 'utf8')
  );

  // Setup provider and wallet (use Alchemy to avoid rate limits)
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  const rpcUrl = alchemyKey.startsWith('http') 
    ? alchemyKey 
    : `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  
  console.log("Deploying AMM contracts with account:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Existing contract addresses
  const mockUSDT = "0xAf24D4DDbA993F6b11372528C678edb718a097Aa";
  const conditionalTokens = "0xdC8CB01c328795C007879B2C030AbF1c1b580D84";
  const treasury = wallet.address;

  console.log("\nUsing existing contracts:");
  console.log("MockUSDT:", mockUSDT);
  console.log("ConditionalTokens:", conditionalTokens);
  console.log("Treasury:", treasury);

  // 1. Deploy AMMPoolFactorySimple (non-upgradeable)
  console.log("\n1. Deploying AMMPoolFactorySimple...");
  const factory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    wallet
  );
  
  const ammPoolFactory = await factory.deploy(mockUSDT, conditionalTokens, treasury);
  await ammPoolFactory.waitForDeployment();
  const ammPoolFactoryAddress = await ammPoolFactory.getAddress();
  console.log("AMMPoolFactorySimple deployed to:", ammPoolFactoryAddress);

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
  console.log(`\nUpdate CONTRACT_ADDRESSES in server/config/contracts.ts:`);
  console.log(`  AMM_POOL_FACTORY: "${ammPoolFactoryAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

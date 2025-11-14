import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({ network: process.env.HARDHAT_NETWORK || "sepolia" });
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // 1. Deploy MockUSDT
  console.log("\n1. Deploying MockUSDT...");
  const mockUSDT = await ethers.deployContract("MockUSDT", [], deployer);
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", mockUSDTAddress);

  // 2. Deploy ConditionalTokens
  console.log("\n2. Deploying ConditionalTokens...");
  const conditionalTokens = await ethers.deployContract("ConditionalTokens", [], deployer);
  await conditionalTokens.waitForDeployment();
  const conditionalTokensAddress = await conditionalTokens.getAddress();
  console.log("ConditionalTokens deployed to:", conditionalTokensAddress);

  // 3. Deploy ProxyWallet implementation
  console.log("\n3. Deploying ProxyWallet implementation...");
  const dummyOwner = "0x0000000000000000000000000000000000000001";
  const proxyWalletImpl = await ethers.deployContract("ProxyWallet", [dummyOwner], deployer);
  await proxyWalletImpl.waitForDeployment();
  const proxyWalletImplAddress = await proxyWalletImpl.getAddress();
  console.log("ProxyWallet implementation deployed to:", proxyWalletImplAddress);

  // 4. Deploy ProxyWalletFactory
  console.log("\n4. Deploying ProxyWalletFactory...");
  const proxyWalletFactory = await ethers.deployContract("ProxyWalletFactory", [], deployer);
  await proxyWalletFactory.waitForDeployment();
  const proxyWalletFactoryAddress = await proxyWalletFactory.getAddress();
  console.log("ProxyWalletFactory deployed to:", proxyWalletFactoryAddress);

  // 5. Set implementation on ProxyWalletFactory
  console.log("\n5. Setting implementation on ProxyWalletFactory...");
  const tx = await proxyWalletFactory.setImplementation(proxyWalletImplAddress);
  await tx.wait();
  console.log("Implementation set");

  // 6. Deploy CTFExchange
  console.log("\n6. Deploying CTFExchange...");
  const safeFactory = "0x0000000000000000000000000000000000000000";
  const ctfExchange = await ethers.deployContract("CTFExchange", [
    mockUSDTAddress,
    conditionalTokensAddress,
    proxyWalletFactoryAddress,
    safeFactory
  ], deployer);
  await ctfExchange.waitForDeployment();
  const ctfExchangeAddress = await ctfExchange.getAddress();
  console.log("CTFExchange deployed to:", ctfExchangeAddress);

  // 7. Grant OPERATOR_ROLE to relayer
  console.log("\n7. Configuring roles...");
  const OPERATOR_ROLE = await ctfExchange.OPERATOR_ROLE();
  // Get relayer address from private key
  const relayerAddress = process.env.RELAYER_PRIVATE_KEY 
    ? new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY).address
    : deployer.address;
  console.log("Granting OPERATOR_ROLE to relayer:", relayerAddress);
  const grantTx = await ctfExchange.grantRole(OPERATOR_ROLE, relayerAddress);
  await grantTx.wait();
  console.log("OPERATOR_ROLE granted");

  // Print summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  const summary = {
    MockUSDT: mockUSDTAddress,
    ConditionalTokens: conditionalTokensAddress,
    ProxyWalletImpl: proxyWalletImplAddress,
    ProxyWalletFactory: proxyWalletFactoryAddress,
    CTFExchange: ctfExchangeAddress,
  };
  console.log(JSON.stringify(summary, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Update CONTRACT_ADDRESSES in server/config/contracts.ts with these addresses");
  console.log("2. For each market created, call ctfExchange.registerToken(token0, token1, conditionId)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

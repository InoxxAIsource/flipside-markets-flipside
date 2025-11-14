/**
 * Polymarket-Style Contract Addresses on Sepolia
 * 
 * Update these addresses after deploying contracts following DEPLOYMENT_GUIDE.md
 */

export interface ContractAddresses {
  // Core Contracts
  conditionalTokens: string;
  mockUSDT: string;
  ctfExchange: string;
  
  // Proxy Wallet System
  proxyWalletImplementation: string;
  proxyWalletFactory: string;
  
  // Market Creation
  marketFactory: string;
  
  // Oracle & Resolution
  pythPriceResolver: string;
  
  // Relayer & Owner
  relayerAddress: string;
  ownerAddress: string;
}

/**
 * Sepolia Testnet Addresses
 * TODO: Update these after running deployment scripts
 */
export const sepoliaAddresses: ContractAddresses = {
  // Core Contracts (TO BE DEPLOYED)
  conditionalTokens: process.env.CTF_ADDRESS || "0x0000000000000000000000000000000000000000",
  mockUSDT: process.env.MOCK_USDT_ADDRESS || "0x0000000000000000000000000000000000000000",
  ctfExchange: process.env.CTF_EXCHANGE_ADDRESS || "0x0000000000000000000000000000000000000000",
  
  // Proxy Wallet System (TO BE DEPLOYED)
  proxyWalletImplementation: process.env.PROXY_WALLET_IMPL || "0x0000000000000000000000000000000000000000",
  proxyWalletFactory: process.env.PROXY_FACTORY || "0x0000000000000000000000000000000000000000",
  
  // Market Creation (EXISTING - MAY NEED UPDATE)
  marketFactory: process.env.MARKET_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000",
  
  // Oracle & Resolution (EXISTING)
  pythPriceResolver: process.env.PYTH_RESOLVER_ADDRESS || "0x0000000000000000000000000000000000000000",
  
  // Relayer & Owner (FROM ENV)
  relayerAddress: process.env.RELAYER_ADDRESS || "0x0000000000000000000000000000000000000000",
  ownerAddress: process.env.OWNER_ADDRESS || "0x0000000000000000000000000000000000000000",
};

/**
 * Polygon Mainnet Addresses (For Reference)
 * These are Polymarket's production addresses
 */
export const polygonAddresses: ContractAddresses = {
  conditionalTokens: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
  mockUSDT: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
  ctfExchange: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  proxyWalletImplementation: "0x0000000000000000000000000000000000000000", // Not public
  proxyWalletFactory: "0xaB45c5A4B0c941a2F231C04C3f49182e1A254052",
  marketFactory: "0x0000000000000000000000000000000000000000", // Not public
  pythPriceResolver: "0x0000000000000000000000000000000000000000", // Not public
  relayerAddress: "0x0000000000000000000000000000000000000000", // Not public
  ownerAddress: "0x0000000000000000000000000000000000000000", // Not public
};

/**
 * Get contract addresses for current network
 */
export function getContractAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 137: // Polygon
      return polygonAddresses;
    case 11155111: // Sepolia
      return sepoliaAddresses;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

/**
 * Validate that all required addresses are set
 */
export function validateAddresses(addresses: ContractAddresses): void {
  const requiredFields: (keyof ContractAddresses)[] = [
    "conditionalTokens",
    "mockUSDT",
    "ctfExchange",
    "proxyWalletFactory",
    "relayerAddress",
    "ownerAddress",
  ];
  
  const missingFields = requiredFields.filter(
    (field) => addresses[field] === "0x0000000000000000000000000000000000000000"
  );
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing contract addresses: ${missingFields.join(", ")}. ` +
      `Please deploy contracts and update deployment/contractAddresses.ts`
    );
  }
}

/**
 * Log current configuration
 */
export function logConfiguration(chainId: number): void {
  const addresses = getContractAddresses(chainId);
  
  console.log("\n=== Polymarket-Style Contract Configuration ===");
  console.log(`Network: ${chainId === 137 ? "Polygon" : "Sepolia"}`);
  console.log(`\nCore Contracts:`);
  console.log(`  ConditionalTokens: ${addresses.conditionalTokens}`);
  console.log(`  MockUSDT:         ${addresses.mockUSDT}`);
  console.log(`  CTFExchange:      ${addresses.ctfExchange}`);
  console.log(`\nProxy Wallet System:`);
  console.log(`  Implementation:    ${addresses.proxyWalletImplementation}`);
  console.log(`  Factory:           ${addresses.proxyWalletFactory}`);
  console.log(`\nMarket & Oracle:`);
  console.log(`  MarketFactory:     ${addresses.marketFactory}`);
  console.log(`  PythResolver:      ${addresses.pythPriceResolver}`);
  console.log(`\nOperators:`);
  console.log(`  Relayer:           ${addresses.relayerAddress}`);
  console.log(`  Owner:             ${addresses.ownerAddress}`);
  console.log("===============================================\n");
}

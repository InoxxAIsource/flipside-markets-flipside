// Deployed contract addresses on Sepolia Testnet
// Deployed on: November 15, 2025 (Updated with meta-transaction support)

export const CONTRACT_ADDRESSES = {
  // Collateral token (6 decimals)
  MOCK_USDT: "0xAf24D4DDbA993F6b11372528C678edb718a097Aa",
  
  // Gnosis Conditional Tokens Framework
  CONDITIONAL_TOKENS: "0xdC8CB01c328795C007879B2C030AbF1c1b580D84",
  
  // Proxy wallet system (for gasless trading with EIP-712 meta-transactions)
  PROXY_WALLET_IMPL: "0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7",
  PROXY_WALLET_FACTORY: "0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2",
  
  // Order book exchange (CLOB)
  CTF_EXCHANGE: "0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3",
} as const;

export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  rpcUrl: "https://sepolia.gateway.tenderly.co",
  blockExplorer: "https://sepolia.etherscan.io",
} as const;

// Deployer account: 0x73eB1835929244710D4b894b147C4187dB80Aab7
// Relayer account: 0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0

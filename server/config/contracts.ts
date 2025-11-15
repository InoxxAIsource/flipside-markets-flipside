// Deployed contract addresses on Sepolia Testnet
// Deployed on: November 15, 2025 (Updated with meta-transaction support)

export const CONTRACT_ADDRESSES = {
  // Collateral token (6 decimals)
  MOCK_USDT: "0x8710B6A7770B4586Bdc631D27645EC99DdAa9546",
  
  // Gnosis Conditional Tokens Framework
  CONDITIONAL_TOKENS: "0xd52DDA74bF9D067814BBFC4F3F9a9E238Ed8D77B",
  
  // Proxy wallet system (for gasless trading with EIP-712 meta-transactions)
  PROXY_WALLET_IMPL: "0xE636F8584fC8D24E7162763291407703763af18a",
  PROXY_WALLET_FACTORY: "0xf3CBF315014Fa95dc148B49c1Be4312744895e8B",
  
  // Order book exchange (CLOB)
  CTF_EXCHANGE: "0xCd38ACF61d7131aE1e220e57c1C0043B32dBB736",
} as const;

export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  rpcUrl: "https://sepolia.gateway.tenderly.co",
  blockExplorer: "https://sepolia.etherscan.io",
} as const;

// Deployer account: 0x73eB1835929244710D4b894b147C4187dB80Aab7
// Relayer account: 0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0

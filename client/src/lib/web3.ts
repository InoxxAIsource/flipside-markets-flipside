import { ethers } from 'ethers';

export const SEPOLIA_CHAIN_ID = 11155111;
export const NETWORK_NAME = 'Sepolia';

// Client-side contract addresses (matches server/config/contracts.ts)
export const CONTRACT_ADDRESSES = {
  MockUSDT: '0xAf24D4DDbA993F6b11372528C678edb718a097Aa',
  ConditionalTokens: '0xdC8CB01c328795C007879B2C030AbF1c1b580D84',
  ProxyWalletImpl: '0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7',
  ProxyWalletFactory: '0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2',
  CTFExchange: '0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3',
  // Legacy alias for backward compatibility
  ProxyWallet: '0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2', // Points to Factory
};

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(SEPOLIA_CHAIN_ID)) {
      await switchToSepolia();
    }

    return {
      address: accounts[0],
      provider,
      signer,
    };
  } catch (error: any) {
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

export async function switchToSepolia() {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
          chainName: 'Sepolia Test Network',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
    }
  }
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(value: bigint): string {
  return ethers.formatEther(value);
}

export function parseEther(value: string): bigint {
  return ethers.parseEther(value);
}

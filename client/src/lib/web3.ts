import { ethers } from 'ethers';
import { createWalletConnectProvider, disconnectWalletConnect, getWalletConnectProvider } from './web3modal';
import { isMobile } from './device';

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

/**
 * Get a reliable Alchemy provider for Sepolia
 * This is used as a fallback for read operations when MetaMask RPC is unreliable
 */
export function getAlchemyProvider(): ethers.AlchemyProvider | null {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (!apiKey) {
    console.warn('VITE_ALCHEMY_API_KEY not configured - using default RPC');
    return null;
  }
  return new ethers.AlchemyProvider('sepolia', apiKey);
}

/**
 * Connect to a specific wallet by ID
 */
export async function connectWalletById(walletId: string) {
  switch (walletId) {
    case 'metamask':
      return connectViaMetaMask();
    case 'walletconnect':
      return connectViaWalletConnect();
    case 'trust':
      return connectViaTrustWallet();
    case 'rainbow':
      return connectViaRainbow();
    case 'coinbase':
      return connectViaCoinbaseWallet();
    default:
      throw new Error(`Unknown wallet: ${walletId}`);
  }
}

/**
 * Legacy connect function - use connectWalletById for explicit wallet selection
 */
export async function connectWallet() {
  // Use MetaMask if available, otherwise fall back to WalletConnect
  if (window.ethereum) {
    return connectViaMetaMask();
  } else {
    return connectViaWalletConnect();
  }
}

export async function connectViaMetaMask() {
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
    throw new Error(`Failed to connect MetaMask: ${error.message}`);
  }
}

export async function connectViaWalletConnect(walletName?: string) {
  try {
    const wcProvider = await createWalletConnectProvider(walletName);
    
    // Enable session (shows QR modal on desktop, deep link on mobile)
    const accounts = await wcProvider.enable();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from WalletConnect');
    }

    // Create ethers provider
    const provider = new ethers.BrowserProvider(wcProvider as any);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
      address,
      provider,
      signer,
    };
  } catch (error: any) {
    throw new Error(`Failed to connect via WalletConnect: ${error.message}`);
  }
}

/**
 * Connect via Trust Wallet using deep link on mobile
 */
export async function connectViaTrustWallet() {
  if (!isMobile()) {
    throw new Error('Trust Wallet is only available on mobile devices');
  }
  
  try {
    const wcProvider = await createWalletConnectProvider('Trust Wallet');
    
    // Create deep link for Trust Wallet
    const uri = await wcProvider.connect();
    if (uri) {
      const trustDeepLink = `trust://wc?uri=${encodeURIComponent(uri)}`;
      window.location.href = trustDeepLink;
    }
    
    const accounts = await wcProvider.enable();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from Trust Wallet');
    }

    const provider = new ethers.BrowserProvider(wcProvider as any);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
      address,
      provider,
      signer,
    };
  } catch (error: any) {
    throw new Error(`Failed to connect via Trust Wallet: ${error.message}`);
  }
}

/**
 * Connect via Rainbow wallet using deep link on mobile
 */
export async function connectViaRainbow() {
  if (!isMobile()) {
    throw new Error('Rainbow is only available on mobile devices');
  }
  
  try {
    const wcProvider = await createWalletConnectProvider('Rainbow');
    
    // Create deep link for Rainbow
    const uri = await wcProvider.connect();
    if (uri) {
      const rainbowDeepLink = `rainbow://wc?uri=${encodeURIComponent(uri)}`;
      window.location.href = rainbowDeepLink;
    }
    
    const accounts = await wcProvider.enable();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from Rainbow');
    }

    const provider = new ethers.BrowserProvider(wcProvider as any);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
      address,
      provider,
      signer,
    };
  } catch (error: any) {
    throw new Error(`Failed to connect via Rainbow: ${error.message}`);
  }
}

/**
 * Connect via Coinbase Wallet using deep link on mobile
 */
export async function connectViaCoinbaseWallet() {
  if (!isMobile()) {
    throw new Error('Coinbase Wallet is only available on mobile devices');
  }
  
  try {
    const wcProvider = await createWalletConnectProvider('Coinbase Wallet');
    
    // Create deep link for Coinbase Wallet
    const uri = await wcProvider.connect();
    if (uri) {
      const coinbaseDeepLink = `cbwallet://wc?uri=${encodeURIComponent(uri)}`;
      window.location.href = coinbaseDeepLink;
    }
    
    const accounts = await wcProvider.enable();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from Coinbase Wallet');
    }

    const provider = new ethers.BrowserProvider(wcProvider as any);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
      address,
      provider,
      signer,
    };
  } catch (error: any) {
    throw new Error(`Failed to connect via Coinbase Wallet: ${error.message}`);
  }
}

export async function disconnectWallet() {
  await disconnectWalletConnect();
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

import { ethers } from 'ethers';

export const SEPOLIA_CHAIN_ID = 11155111;
export const NETWORK_NAME = 'Sepolia';

export const CONTRACT_ADDRESSES = {
  MockUSDT: '0x4041b89E54786F05744fCF13C1263a24164820AC',
  FeeDistributor: '0x8A87e6610A762505408b30dcB03266ea255616D1',
  ConditionalTokens: '0x27B0B87571e7908bAB95Dd374792bdC9634edfA4',
  CTFExchange: '0xA9DbBb8d093518912EE8b0f1c19d8B694B8f8d92',
  PythPriceResolver: '0x244DE5a1e2c0d0e158515bF3D47ba39cc878A411',
  MarketFactory: '0x9Ce05c79aEcfE70711A5471B562947EfdF53AD68',
  ProxyWallet: '0x4a373C230BE7574B905A31c43317EE912D3B65c7',
  PythOracle: '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21',
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

declare global {
  interface Window {
    ethereum?: any;
  }
}

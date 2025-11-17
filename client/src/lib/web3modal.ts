import EthereumProvider from '@walletconnect/ethereum-provider';
import { SEPOLIA_CHAIN_ID } from './web3';

// WalletConnect Project ID (public identifier, safe to use client-side)
// Falls back to known public ID if env var not set
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '7cb724bf60c8e3b1b67fdadd7bafcace';

let walletConnectProvider: Awaited<ReturnType<typeof EthereumProvider.init>> | null = null;

export async function createWalletConnectProvider() {
  if (walletConnectProvider) {
    return walletConnectProvider;
  }

  walletConnectProvider = await EthereumProvider.init({
    projectId,
    chains: [SEPOLIA_CHAIN_ID],
    showQrModal: true,
    qrModalOptions: {
      themeMode: 'dark',
    },
    metadata: {
      name: 'Flipside',
      description: 'Trade prediction markets on crypto and real-world events',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://flipside.exchange',
      icons: ['https://flipside.exchange/favicon.ico']
    }
  });

  // Set up event listeners for WalletConnect session changes
  walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
    console.log('WalletConnect accounts changed:', accounts);
    // Trigger custom event for the app to listen to
    window.dispatchEvent(new CustomEvent('walletAccountsChanged', { detail: accounts }));
  });

  walletConnectProvider.on('chainChanged', (chainId: number) => {
    console.log('WalletConnect chain changed:', chainId);
    // Trigger custom event for the app to listen to
    window.dispatchEvent(new CustomEvent('walletChainChanged', { detail: chainId }));
  });

  walletConnectProvider.on('disconnect', () => {
    console.log('WalletConnect disconnected');
    walletConnectProvider = null;
    // Trigger custom event for the app to listen to
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  });

  return walletConnectProvider;
}

export async function disconnectWalletConnect() {
  if (walletConnectProvider) {
    await walletConnectProvider.disconnect();
    walletConnectProvider = null;
  }
}

export function getWalletConnectProvider() {
  return walletConnectProvider;
}

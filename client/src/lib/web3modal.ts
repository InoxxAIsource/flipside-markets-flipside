import EthereumProvider from '@walletconnect/ethereum-provider';
import { SEPOLIA_CHAIN_ID } from './web3';
import { isMobile } from './device';

// WalletConnect Project ID from environment
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.error('VITE_WALLETCONNECT_PROJECT_ID is not set! WalletConnect will not work.');
}

let walletConnectProvider: Awaited<ReturnType<typeof EthereumProvider.init>> | null = null;

export async function createWalletConnectProvider(walletName?: string) {
  if (walletConnectProvider) {
    return walletConnectProvider;
  }

  const mobile = isMobile();

  walletConnectProvider = await EthereumProvider.init({
    projectId,
    chains: [SEPOLIA_CHAIN_ID],
    // Show QR modal only on desktop, use deep links on mobile
    showQrModal: !mobile,
    qrModalOptions: mobile ? undefined : {
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

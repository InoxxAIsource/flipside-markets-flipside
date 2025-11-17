import EthereumProvider from '@walletconnect/ethereum-provider';
import { SEPOLIA_CHAIN_ID } from './web3';

// WalletConnect Project ID
export const projectId = '7cb724bf60c8e3b1b67fdadd7bafcace';

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

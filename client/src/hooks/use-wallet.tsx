import { useState, useEffect } from 'react';
import { connectWallet } from '@/lib/web3';

interface WalletState {
  account: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<string>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      // Check for existing WalletConnect session first
      const { getWalletConnectProvider } = await import('@/lib/web3modal');
      const wcProvider = getWalletConnectProvider();
      
      if (wcProvider && wcProvider.accounts && wcProvider.accounts.length > 0) {
        setAccount(wcProvider.accounts[0]);
        return;
      }

      // Fall back to checking MetaMask
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();

    // MetaMask event handlers (defined once to ensure cleanup works)
    const handleMetaMaskAccountsChanged = (accounts: unknown) => {
      const accountArray = accounts as string[];
      setAccount(accountArray[0] || null);
    };

    const handleMetaMaskChainChanged = () => {
      window.location.reload();
    };

    // WalletConnect event handlers (via custom events)
    const handleWalletAccountsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>;
      setAccount(customEvent.detail[0] || null);
    };

    const handleWalletChainChanged = () => {
      window.location.reload();
    };

    const handleWalletDisconnected = () => {
      setAccount(null);
    };

    // Listen for MetaMask events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleMetaMaskAccountsChanged);
      window.ethereum.on('chainChanged', handleMetaMaskChainChanged);
    }

    // Listen for WalletConnect events (via custom events)
    window.addEventListener('walletAccountsChanged', handleWalletAccountsChanged);
    window.addEventListener('walletChainChanged', handleWalletChainChanged);
    window.addEventListener('walletDisconnected', handleWalletDisconnected);

    return () => {
      // Clean up MetaMask listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleMetaMaskAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleMetaMaskChainChanged);
      }

      // Clean up WalletConnect listeners
      window.removeEventListener('walletAccountsChanged', handleWalletAccountsChanged);
      window.removeEventListener('walletChainChanged', handleWalletChainChanged);
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
    };
  }, []);

  const connect = async (): Promise<string> => {
    setIsConnecting(true);
    setError(null);

    try {
      const { address } = await connectWallet();
      setAccount(address);
      return address;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const { disconnectWallet } = await import('@/lib/web3');
      await disconnectWallet();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
    setAccount(null);
  };

  return {
    account,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}

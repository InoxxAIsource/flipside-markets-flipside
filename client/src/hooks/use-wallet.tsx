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
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
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

  const disconnect = () => {
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

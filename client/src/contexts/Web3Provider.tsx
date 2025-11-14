import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useQueryClient } from '@tanstack/react-query';
import { SEPOLIA_CHAIN_ID, switchToSepolia } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';

export enum ExecutionContext {
  DIRECT = 'DIRECT',
  USER_PROXY = 'USER_PROXY',
  RELAYER = 'RELAYER',
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  WRONG_NETWORK = 'WRONG_NETWORK',
  ERROR = 'ERROR',
}

export interface ProxyWalletInfo {
  address: string;
  deployed: boolean;
  nonce: number;
}

interface Web3State {
  status: ConnectionStatus;
  account: string | null;
  chainId: number | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  executionContext: ExecutionContext;
  proxyInfo: ProxyWalletInfo | null;
  error: string | null;
}

type Web3Action =
  | { type: 'CONNECTING' }
  | { type: 'CONNECTED'; payload: { account: string; chainId: number; signer: ethers.JsonRpcSigner; provider: ethers.BrowserProvider } }
  | { type: 'DISCONNECTED' }
  | { type: 'WRONG_NETWORK'; payload: { chainId: number } }
  | { type: 'ERROR'; payload: string }
  | { type: 'SET_EXECUTION_CONTEXT'; payload: ExecutionContext }
  | { type: 'SET_PROXY_INFO'; payload: ProxyWalletInfo | null }
  | { type: 'CHAIN_CHANGED'; payload: number }
  | { type: 'ACCOUNT_CHANGED'; payload: { account: string | null; signer: ethers.JsonRpcSigner | null } };

const initialState: Web3State = {
  status: ConnectionStatus.DISCONNECTED,
  account: null,
  chainId: null,
  signer: null,
  provider: null,
  executionContext: ExecutionContext.DIRECT,
  proxyInfo: null,
  error: null,
};

function web3Reducer(state: Web3State, action: Web3Action): Web3State {
  switch (action.type) {
    case 'CONNECTING':
      return { ...state, status: ConnectionStatus.CONNECTING, error: null };
    
    case 'CONNECTED':
      return {
        ...state,
        status: ConnectionStatus.CONNECTED,
        account: action.payload.account,
        chainId: action.payload.chainId,
        signer: action.payload.signer,
        provider: action.payload.provider,
        error: null,
      };
    
    case 'DISCONNECTED':
      return {
        ...initialState,
        provider: state.provider,
      };
    
    case 'WRONG_NETWORK':
      return {
        ...state,
        status: ConnectionStatus.WRONG_NETWORK,
        chainId: action.payload.chainId,
        error: `Please switch to Sepolia testnet`,
      };
    
    case 'ERROR':
      return {
        ...state,
        status: ConnectionStatus.ERROR,
        error: action.payload,
      };
    
    case 'SET_EXECUTION_CONTEXT':
      return {
        ...state,
        executionContext: action.payload,
      };
    
    case 'SET_PROXY_INFO':
      return {
        ...state,
        proxyInfo: action.payload,
      };
    
    case 'CHAIN_CHANGED':
      if (action.payload === SEPOLIA_CHAIN_ID && state.status === ConnectionStatus.WRONG_NETWORK) {
        return {
          ...state,
          status: ConnectionStatus.CONNECTED,
          chainId: action.payload,
          error: null,
        };
      }
      if (action.payload !== SEPOLIA_CHAIN_ID) {
        return {
          ...state,
          status: ConnectionStatus.WRONG_NETWORK,
          chainId: action.payload,
          error: 'Please switch to Sepolia testnet',
        };
      }
      return { ...state, chainId: action.payload };
    
    case 'ACCOUNT_CHANGED':
      if (!action.payload.account) {
        return initialState;
      }
      return {
        ...state,
        account: action.payload.account,
        signer: action.payload.signer,
        proxyInfo: null,
      };
    
    default:
      return state;
  }
}

interface Web3ContextValue extends Web3State {
  connect: () => Promise<string>;
  disconnect: () => void;
  setExecutionContext: (context: ExecutionContext) => void;
  setProxyInfo: (info: ProxyWalletInfo | null) => void;
  switchNetwork: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextValue | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(web3Reducer, initialState);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      dispatch({ type: 'DISCONNECTED' });
      queryClient.invalidateQueries({ queryKey: ['/api/web3'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proxy'] });
      queryClient.invalidateQueries({ queryKey: ['eth-balance'] });
      queryClient.removeQueries({ queryKey: ['/api/web3'] });
      queryClient.removeQueries({ queryKey: ['/api/proxy'] });
      queryClient.removeQueries({ queryKey: ['eth-balance'] });
    } else if (state.provider) {
      const signer = await state.provider.getSigner();
      dispatch({
        type: 'ACCOUNT_CHANGED',
        payload: { account: accounts[0], signer },
      });
      queryClient.invalidateQueries({ queryKey: ['/api/web3'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proxy'] });
      queryClient.invalidateQueries({ queryKey: ['eth-balance'] });
    }
  }, [state.provider, queryClient]);

  const handleChainChanged = useCallback((chainIdHex: string) => {
    const chainId = parseInt(chainIdHex, 16);
    dispatch({ type: 'CHAIN_CHANGED', payload: chainId });
    queryClient.invalidateQueries({ queryKey: ['/api/web3'] });
    queryClient.invalidateQueries({ queryKey: ['/api/proxy'] });
    queryClient.invalidateQueries({ queryKey: ['eth-balance'] });
    
    if (chainId !== SEPOLIA_CHAIN_ID) {
      toast({
        title: 'Wrong Network',
        description: 'Please switch to Sepolia testnet',
        variant: 'destructive',
      });
    }
  }, [queryClient, toast]);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  const connect = useCallback(async (): Promise<string> => {
    if (!window.ethereum) {
      const error = 'MetaMask is not installed. Please install MetaMask to use this app.';
      dispatch({ type: 'ERROR', payload: error });
      throw new Error(error);
    }

    try {
      dispatch({ type: 'CONNECTING' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== SEPOLIA_CHAIN_ID) {
        dispatch({ type: 'WRONG_NETWORK', payload: { chainId } });
        try {
          await switchToSepolia();
          const updatedNetwork = await provider.getNetwork();
          const updatedChainId = Number(updatedNetwork.chainId);
          
          if (updatedChainId === SEPOLIA_CHAIN_ID) {
            dispatch({
              type: 'CONNECTED',
              payload: { account: accounts[0], chainId: updatedChainId, signer, provider },
            });
            return accounts[0];
          } else {
            throw new Error('Failed to switch to Sepolia network');
          }
        } catch (switchError) {
          throw new Error('Please manually switch to Sepolia testnet in MetaMask');
        }
      }

      dispatch({
        type: 'CONNECTED',
        payload: { account: accounts[0], chainId, signer, provider },
      });

      return accounts[0];
    } catch (error: any) {
      const message = error.code === 4001 
        ? 'Connection request rejected' 
        : error.message || 'Failed to connect wallet';
      
      dispatch({ type: 'ERROR', payload: message });
      throw new Error(message);
    }
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: 'DISCONNECTED' });
    queryClient.invalidateQueries({ queryKey: ['/api/web3'] });
    queryClient.invalidateQueries({ queryKey: ['/api/proxy'] });
    queryClient.invalidateQueries({ queryKey: ['eth-balance'] });
    queryClient.removeQueries({ queryKey: ['/api/web3'] });
    queryClient.removeQueries({ queryKey: ['/api/proxy'] });
    queryClient.removeQueries({ queryKey: ['eth-balance'] });
  }, [queryClient]);

  const setExecutionContext = useCallback((context: ExecutionContext) => {
    if (context === ExecutionContext.USER_PROXY && !state.proxyInfo?.deployed) {
      toast({
        title: 'Proxy Wallet Required',
        description: 'Please deploy your proxy wallet first to enable gasless trading',
        variant: 'destructive',
      });
      return;
    }
    
    dispatch({ type: 'SET_EXECUTION_CONTEXT', payload: context });
  }, [state.proxyInfo, toast]);

  const switchNetwork = useCallback(async () => {
    try {
      await switchToSepolia();
    } catch (error: any) {
      toast({
        title: 'Network Switch Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const setProxyInfo = useCallback((info: ProxyWalletInfo | null) => {
    dispatch({ type: 'SET_PROXY_INFO', payload: info });
  }, []);

  const value: Web3ContextValue = {
    ...state,
    connect,
    disconnect,
    setExecutionContext,
    setProxyInfo,
    switchNetwork,
    isConnecting: state.status === ConnectionStatus.CONNECTING,
    isConnected: state.status === ConnectionStatus.CONNECTED,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWallet() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWallet must be used within Web3Provider');
  }
  return context;
}

export function useExecutionContext() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useExecutionContext must be used within Web3Provider');
  }
  return {
    context: context.executionContext,
    setContext: context.setExecutionContext,
    proxyInfo: context.proxyInfo,
  };
}

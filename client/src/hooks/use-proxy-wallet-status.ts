import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/contexts/Web3Provider';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface ProxyWalletResponse {
  proxyAddress: string;
  deployed: boolean;
  nonce: number;
}

export function useProxyWalletStatus() {
  const { account, isConnected } = useWallet();
  
  const { data, isLoading, error } = useQuery<ProxyWalletResponse>({
    queryKey: ['/api/proxy/status', account],
    enabled: !!account && isConnected,
    staleTime: 60000,
    retry: 2,
  });

  return {
    proxyAddress: data?.proxyAddress,
    deployed: data?.deployed ?? false,
    nonce: data?.nonce ?? 0,
    isLoading,
    error,
  };
}

// Deployment is now handled by useDeployProxyWallet in use-proxy-wallet.tsx
// This hook is kept for backward compatibility but redirects to the new implementation
export function useEnsureProxyWallet() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      throw new Error('Please use the Deploy button in the trading interface to deploy your proxy wallet');
    },
    onError: (error: Error) => {
      toast({
        title: 'Deployment Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSyncProxyInfo() {
  const { setProxyInfo } = useWallet();
  const proxyWallet = useProxyWalletStatus();

  useEffect(() => {
    if (proxyWallet.proxyAddress) {
      setProxyInfo({
        address: proxyWallet.proxyAddress,
        deployed: proxyWallet.deployed,
        nonce: proxyWallet.nonce,
      });
    }
  }, [proxyWallet.proxyAddress, proxyWallet.deployed, proxyWallet.nonce, setProxyInfo]);

  return proxyWallet;
}

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

export function useProxyWallet() {
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

export function useEnsureProxyWallet() {
  const { account } = useWallet();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      const res = await apiRequest('POST', '/api/proxy/deploy', { ownerAddress: account });
      const data = await res.json() as ProxyWalletResponse;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/proxy/status', account], data);
      
      toast({
        title: 'Proxy Wallet Ready',
        description: `Your gasless trading wallet has been ${data.deployed ? 'deployed' : 'prepared'} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Proxy Wallet Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSyncProxyInfo() {
  const { setProxyInfo } = useWallet();
  const proxyWallet = useProxyWallet();

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

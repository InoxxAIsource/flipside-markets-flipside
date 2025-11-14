import { Wallet, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatAddress } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/Web3Provider';
import { useSyncProxyInfo } from '@/hooks/use-proxy-wallet-status';

export function WalletButton() {
  const { account: address, isConnecting, connect, disconnect, provider } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const proxyWallet = useSyncProxyInfo();

  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useQuery<{ balance: string }>({
    queryKey: [`/api/web3/balance/${address}`],
    enabled: !!address,
    refetchInterval: 30000,
    retry: 2,
  });

  const { data: ethBalance } = useQuery({
    queryKey: ['eth-balance', address],
    queryFn: async () => {
      if (!provider || !address) return '0';
      const balance = await provider.getBalance(address);
      const formatted = (await import('ethers')).ethers.formatEther(balance);
      return parseFloat(formatted).toFixed(4);
    },
    enabled: !!provider && !!address,
    refetchInterval: 30000,
    retry: 2,
  });

  const usdtBalance = balanceData?.balance 
    ? (parseFloat(balanceData.balance) / 1e6).toFixed(2)
    : balanceLoading
    ? '...'
    : '0.00';

  const hasBalanceError = !!balanceError;

  const handleConnect = async () => {
    try {
      const connectedAddress = await connect();
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${connectedAddress ? formatAddress(connectedAddress) : 'wallet'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const viewOnEtherscan = () => {
    if (address) {
      window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank');
    }
  };

  const viewProxyOnEtherscan = () => {
    if (proxyWallet.proxyAddress) {
      window.open(`https://sepolia.etherscan.io/address/${proxyWallet.proxyAddress}`, '_blank');
    }
  };

  if (!address) {
    return (
      <Button 
        onClick={handleConnect} 
        disabled={isConnecting}
        data-testid="button-connect-wallet"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" data-testid="button-wallet-menu">
          <Wallet className="mr-2 h-4 w-4" />
          {formatAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network</span>
            <Badge variant="secondary" className="font-mono text-xs">
              Sepolia
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">ETH Balance</span>
            <span className="font-mono font-semibold">{ethBalance || '0.0000'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">USDT Balance</span>
            <span className="font-mono font-semibold">
              {usdtBalance}
            </span>
          </div>
          {hasBalanceError && (
            <div className="flex items-center justify-between gap-2 text-xs text-destructive">
              <span>Failed to load USDT balance</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/web3/balance/${address}`] })}
                data-testid="button-retry-balance"
              >
                Retry
              </Button>
            </div>
          )}
          {proxyWallet.proxyAddress && (
            <>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground">Proxy Wallet</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">{formatAddress(proxyWallet.proxyAddress)}</span>
                  {proxyWallet.deployed && (
                    <Badge variant="secondary" className="text-xs">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
          {proxyWallet.error && (
            <div className="text-xs text-destructive">
              Failed to load proxy wallet
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={viewOnEtherscan} data-testid="menu-item-etherscan">
          <ExternalLink className="mr-2 h-4 w-4" />
          View Wallet on Etherscan
        </DropdownMenuItem>
        {proxyWallet.proxyAddress && (
          <DropdownMenuItem onClick={viewProxyOnEtherscan} data-testid="menu-item-proxy-etherscan">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Proxy on Etherscan
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDisconnect} data-testid="menu-item-disconnect">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

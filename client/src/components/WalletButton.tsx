import { Wallet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatEther } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';

export function WalletButton() {
  const { account: address, isConnecting, connect, disconnect } = useWallet();
  const { toast } = useToast();

  const { data: balanceData } = useQuery<{ balance: string }>({
    queryKey: [`/api/web3/balance/${address}`],
    enabled: !!address,
    refetchInterval: 30000,
  });

  const balance = balanceData?.balance 
    ? (parseFloat(balanceData.balance) / 1e6).toFixed(2)
    : '0.00';

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
      <DropdownMenuContent align="end" className="w-64">
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
            <span className="text-sm text-muted-foreground">USDT Balance</span>
            <span className="font-mono font-semibold">{balance}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={viewOnEtherscan} data-testid="menu-item-etherscan">
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Etherscan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisconnect} data-testid="menu-item-disconnect">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

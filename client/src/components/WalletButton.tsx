import { useState } from 'react';
import { Wallet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { connectWallet, formatAddress } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const wallet = await connectWallet();
      setAddress(wallet.address);
      
      // TODO: Fetch USDT balance from contract
      setBalance('1000.00');
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${formatAddress(wallet.address)}`,
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
    setAddress(null);
    setBalance('0');
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
      <Button onClick={handleConnect} data-testid="button-connect-wallet">
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
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

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { isMobile, canUseMetaMask } from '@/lib/device';

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  comingSoon?: boolean;
}

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectWallet: (walletId: string) => Promise<void>;
}

export function WalletSelector({ open, onOpenChange, onSelectWallet }: WalletSelectorProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  
  const mobile = isMobile();
  const hasMetaMask = canUseMetaMask();

  // Define available wallets
  const wallets: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: hasMetaMask 
        ? 'Connect using MetaMask browser extension' 
        : mobile 
        ? 'Install MetaMask mobile app' 
        : 'Install MetaMask extension',
      icon: '🦊',
      available: hasMetaMask,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: mobile 
        ? 'Connect with any mobile wallet' 
        : 'Scan QR code with mobile wallet',
      icon: '🔗',
      available: true,
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      description: 'Connect with Trust Wallet',
      icon: '🛡️',
      available: mobile,
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      description: 'Connect with Rainbow wallet',
      icon: '🌈',
      available: mobile,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect with Coinbase Wallet',
      icon: '🔵',
      available: mobile,
    },
  ];

  const handleSelectWallet = async (walletId: string) => {
    setConnecting(walletId);
    try {
      await onSelectWallet(walletId);
      onOpenChange(false);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            {mobile 
              ? 'Choose your wallet to connect' 
              : 'Connect with one of our available wallet providers'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {wallets.filter(w => w.available).map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => handleSelectWallet(wallet.id)}
              disabled={connecting !== null}
              data-testid={`button-wallet-${wallet.id}`}
            >
              {connecting === wallet.id ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  <div className="text-left">
                    <div className="font-semibold">Connecting...</div>
                    <div className="text-xs text-muted-foreground">
                      {wallet.name}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="mr-3 text-2xl">{wallet.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">{wallet.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {wallet.description}
                    </div>
                  </div>
                </>
              )}
            </Button>
          ))}
          
          {!hasMetaMask && !mobile && (
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
              data-testid="button-install-metamask"
            >
              <span className="mr-3 text-2xl">🦊</span>
              <div className="text-left flex-1">
                <div className="font-semibold">Install MetaMask</div>
                <div className="text-xs text-muted-foreground">
                  Get the browser extension
                </div>
              </div>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {mobile 
            ? 'Tap a wallet to open it and approve the connection'
            : 'New to Ethereum? Learn how to get a wallet'}
        </div>
      </DialogContent>
    </Dialog>
  );
}

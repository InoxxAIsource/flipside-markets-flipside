import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CreateMarketForm } from '@/components/CreateMarketForm';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useWallet } from '@/hooks/use-wallet';
import { ethers } from 'ethers';
import { prepareMarketCondition } from '@/lib/contracts/conditionalTokens';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import type { Market } from '@shared/schema';

export type TransactionStatus = 'idle' | 'walletPrompt' | 'pending' | 'confirmed' | 'failed';

export default function CreateMarket() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { account } = useWallet();
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<any>(null);

  const createMarketMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!account || !window.ethereum) {
        throw new Error('Please connect your wallet first');
      }

      setTxStatus('walletPrompt');
      setMarketData(data);

      toast({
        title: 'Wallet Prompt',
        description: 'Please confirm the transaction in MetaMask...',
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const oracle = CONTRACT_ADDRESSES.CTFExchange;

      setTxStatus('pending');

      const result = await prepareMarketCondition(
        oracle,
        data.question,
        signer
      );

      setTxHash(result.txHash);
      setTxStatus('confirmed');

      toast({
        title: 'Transaction Confirmed',
        description: 'Market created on-chain. Saving to database...',
      });

      const response = await apiRequest('POST', '/api/markets', {
        ...data,
        creatorAddress: account,
        conditionId: result.conditionId,
        yesTokenId: result.yesTokenId,
        noTokenId: result.noTokenId,
        creationTxHash: result.txHash,
        questionTimestamp: result.questionTimestamp.toString(),
      });

      return await response.json() as Market;
    },
    onSuccess: (market) => {
      queryClient.invalidateQueries({ queryKey: ['/api/markets'] });
      toast({
        title: 'Market Created',
        description: 'Your prediction market has been created successfully',
      });
      setTxStatus('idle');
      setTxHash(null);
      setMarketData(null);
      setLocation(`/market/${market.id}`);
    },
    onError: (error: any) => {
      if (error.code === 4001) {
        toast({
          title: 'Transaction Rejected',
          description: 'You rejected the transaction in MetaMask',
          variant: 'destructive',
        });
        setTxStatus('idle');
        return;
      }

      if (error.code === 'ACTION_REJECTED') {
        toast({
          title: 'Transaction Rejected',
          description: 'You rejected the transaction',
          variant: 'destructive',
        });
        setTxStatus('idle');
        return;
      }

      setTxStatus('failed');
      
      const errorMessage = error.message || 'Failed to create market';
      const isSaveError = txStatus === 'confirmed';
      
      toast({
        title: isSaveError ? 'Failed to Save Market' : 'Transaction Failed',
        description: isSaveError 
          ? `Market created on-chain (tx: ${txHash?.slice(0, 10)}...) but failed to save to database. Please contact support.`
          : errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: any) => {
    createMarketMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-create">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Markets
            </Button>
          </Link>
        </div>

        <CreateMarketForm 
          onSubmit={handleSubmit}
          isSubmitting={createMarketMutation.isPending}
          txStatus={txStatus}
          txHash={txHash}
        />
      </div>
    </div>
  );
}

import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CreateMarketForm } from '@/components/CreateMarketForm';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useWallet } from '@/hooks/use-wallet';
import type { Market } from '@shared/schema';

export default function CreateMarket() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { account } = useWallet();

  const createMarketMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!account) {
        throw new Error('Please connect your wallet first');
      }

      const response = await apiRequest('POST', '/api/markets', {
        ...data,
        creatorAddress: account,
        conditionId: null,
        contractAddress: null,
      });

      return await response.json() as Market;
    },
    onSuccess: (market) => {
      queryClient.invalidateQueries({ queryKey: ['/api/markets'] });
      toast({
        title: 'Market Created',
        description: 'Your prediction market has been created successfully',
      });
      setLocation(`/market/${market.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create market',
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
        />
      </div>
    </div>
  );
}

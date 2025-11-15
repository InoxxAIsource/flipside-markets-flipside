import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Info, ArrowLeftRight, Combine, Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useProxyWallet } from '@/hooks/use-proxy-wallet';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import type { Order } from '@shared/schema';

interface TradingPanelProps {
  marketId: string;
}

const EIP712_DOMAIN = {
  name: 'CTFExchange',
  version: '1',
  chainId: 11155111,
  verifyingContract: CONTRACT_ADDRESSES.CTFExchange,
} as const;

const ORDER_TYPES = {
  Order: [
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'side', type: 'uint8' },
    { name: 'feeRateBps', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'signer', type: 'address' },
    { name: 'expiration', type: 'uint256' },
  ],
};

export function TradingPanel({ marketId }: TradingPanelProps) {
  const { account } = useWallet();
  const { proxyBalance, split, merge, isSplitting, isMerging, getPositionBalance } = useProxyWallet();
  const { toast } = useToast();

  const [limitSide, setLimitSide] = useState<'yes' | 'no'>('yes');
  const [limitPrice, setLimitPrice] = useState('');
  const [limitSize, setLimitSize] = useState('');
  const [isPlacingLimit, setIsPlacingLimit] = useState(false);

  const [marketSide, setMarketSide] = useState<'yes' | 'no'>('yes');
  const [marketSize, setMarketSize] = useState('');
  const [isExecutingMarket, setIsExecutingMarket] = useState(false);

  const [splitAmount, setSplitAmount] = useState('');
  const [mergeAmount, setMergeAmount] = useState('');

  const [yesBalance, setYesBalance] = useState('0');
  const [noBalance, setNoBalance] = useState('0');

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/markets', marketId, 'orders'],
    queryFn: async () => {
      const response = await fetch(`/api/markets/${marketId}/orders?status=open`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!marketId,
    refetchInterval: 5000,
  });

  const { data: market } = useQuery<{
    conditionId?: string;
    yesTokenId?: string;
    noTokenId?: string;
    yesPrice?: number;
    noPrice?: number;
  }>({
    queryKey: ['/api/markets', marketId],
    enabled: !!marketId,
  });

  const conditionId = market?.conditionId || '0';
  const yesTokenId = market?.yesTokenId || '0';
  const noTokenId = market?.noTokenId || '0';

  useEffect(() => {
    const fetchYesBalance = async () => {
      if (account && yesTokenId && yesTokenId !== '0' && yesTokenId !== 'undefined') {
        try {
          const balance = await getPositionBalance(yesTokenId);
          setYesBalance(ethers.formatUnits(balance, 6));
        } catch (error: any) {
          console.error('Error fetching YES balance:', error);
          setYesBalance('0');
        }
      } else {
        setYesBalance('0');
      }
    };
    fetchYesBalance();
  }, [account, yesTokenId, getPositionBalance]);

  useEffect(() => {
    const fetchNoBalance = async () => {
      if (account && noTokenId && noTokenId !== '0' && noTokenId !== 'undefined') {
        try {
          const balance = await getPositionBalance(noTokenId);
          setNoBalance(ethers.formatUnits(balance, 6));
        } catch (error: any) {
          console.error('Error fetching NO balance:', error);
          setNoBalance('0');
        }
      } else {
        setNoBalance('0');
      }
    };
    fetchNoBalance();
  }, [account, noTokenId, getPositionBalance]);

  const orderBook = useMemo(() => {
    if (!orders) return { yesBids: [], yesAsks: [], noBids: [], noAsks: [] };

    const yesBids = orders.filter((o) => o.outcome === true && o.side === 'buy').sort((a, b) => b.price - a.price);
    const yesAsks = orders.filter((o) => o.outcome === true && o.side === 'sell').sort((a, b) => a.price - b.price);
    const noBids = orders.filter((o) => o.outcome === false && o.side === 'buy').sort((a, b) => b.price - a.price);
    const noAsks = orders.filter((o) => o.outcome === false && o.side === 'sell').sort((a, b) => a.price - b.price);

    return { yesBids, yesAsks, noBids, noAsks };
  }, [orders]);

  const bestPrices = useMemo(() => {
    return {
      yesBid: orderBook.yesBids[0]?.price || 0,
      yesAsk: orderBook.yesAsks[0]?.price || 1,
      noBid: orderBook.noBids[0]?.price || 0,
      noAsk: orderBook.noAsks[0]?.price || 1,
    };
  }, [orderBook]);

  const limitTotal = useMemo(() => {
    const price = parseFloat(limitPrice) || 0;
    const size = parseFloat(limitSize) || 0;
    return price * size;
  }, [limitPrice, limitSize]);

  const marketEstimatedPrice = useMemo(() => {
    if (marketSide === 'yes') {
      return bestPrices.yesAsk || market?.yesPrice || 0.5;
    } else {
      return bestPrices.noAsk || market?.noPrice || 0.5;
    }
  }, [marketSide, bestPrices, market]);

  const marketTotal = useMemo(() => {
    const size = parseFloat(marketSize) || 0;
    return marketEstimatedPrice * size;
  }, [marketSize, marketEstimatedPrice]);

  const maxMergeable = useMemo(() => {
    const yes = parseFloat(yesBalance) || 0;
    const no = parseFloat(noBalance) || 0;
    return Math.min(yes, no);
  }, [yesBalance, noBalance]);

  const placeLimitOrder = async () => {
    if (!account || !window.ethereum) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to place orders',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(limitPrice);
    const size = parseFloat(limitSize);

    if (!price || price < 0.01 || price > 0.99) {
      toast({
        title: 'Invalid Price',
        description: 'Price must be between 0.01 and 0.99',
        variant: 'destructive',
      });
      return;
    }

    if (!size || size <= 0) {
      toast({
        title: 'Invalid Size',
        description: 'Size must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setIsPlacingLimit(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const nonce = Date.now();
      const expiration = Math.floor(Date.now() / 1000) + 86400;
      const tokenId = limitSide === 'yes' ? yesTokenId : noTokenId;

      const orderMessage = {
        maker: account,
        taker: '0x0000000000000000000000000000000000000000',
        tokenId: tokenId,
        makerAmount: ethers.parseUnits(size.toString(), 6).toString(),
        takerAmount: ethers.parseUnits(price.toString(), 6).toString(),
        side: 0,
        feeRateBps: 250,
        nonce: BigInt(nonce),
        signer: account,
        expiration: BigInt(expiration),
      };

      toast({
        title: 'Signing Order',
        description: 'Please sign the order in your wallet...',
      });

      const signature = await signer.signTypedData(EIP712_DOMAIN, ORDER_TYPES, orderMessage);

      const orderData = {
        marketId,
        tokenId,
        makerAddress: account,
        side: 'buy',
        outcome: limitSide === 'yes',
        price,
        size,
        signature,
        salt: ethers.hexlify(ethers.randomBytes(32)),
        nonce: nonce.toString(),
        expiration: new Date(expiration * 1000),
      };

      toast({
        title: 'Submitting Order',
        description: 'Placing your limit order...',
      });

      const response = await apiRequest('POST', '/api/orders', orderData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      toast({
        title: 'Order Placed',
        description: `Limit order for ${size} ${limitSide.toUpperCase()} shares at $${price.toFixed(2)}`,
      });

      setLimitPrice('');
      setLimitSize('');

      await queryClient.invalidateQueries({ queryKey: ['/api/markets', marketId, 'orders'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/users', account, 'orders'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/users', account, 'positions'] });
    } catch (error: any) {
      console.error('Error placing limit order:', error);
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to place limit order',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingLimit(false);
    }
  };

  const executeMarketOrder = async () => {
    if (!account || !window.ethereum) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to execute orders',
        variant: 'destructive',
      });
      return;
    }

    const size = parseFloat(marketSize);

    if (!size || size <= 0) {
      toast({
        title: 'Invalid Size',
        description: 'Size must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    const availableOrders = marketSide === 'yes' ? orderBook.yesAsks : orderBook.noAsks;
    const totalLiquidity = availableOrders.reduce((sum, order) => sum + (order.size - order.filled), 0);

    if (totalLiquidity < size) {
      toast({
        title: 'Insufficient Liquidity',
        description: `Only ${totalLiquidity.toFixed(2)} shares available`,
        variant: 'destructive',
      });
      return;
    }

    setIsExecutingMarket(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const nonce = Date.now();
      const expiration = Math.floor(Date.now() / 1000) + 300;
      const tokenId = marketSide === 'yes' ? yesTokenId : noTokenId;

      const orderMessage = {
        maker: account,
        taker: '0x0000000000000000000000000000000000000000',
        tokenId: tokenId,
        makerAmount: ethers.parseUnits(size.toString(), 6).toString(),
        takerAmount: ethers.parseUnits(marketEstimatedPrice.toString(), 6).toString(),
        side: 0,
        feeRateBps: 250,
        nonce: BigInt(nonce),
        signer: account,
        expiration: BigInt(expiration),
      };

      toast({
        title: 'Signing Order',
        description: 'Please sign the market order in your wallet...',
      });

      const signature = await signer.signTypedData(EIP712_DOMAIN, ORDER_TYPES, orderMessage);

      const orderData = {
        marketId,
        tokenId,
        makerAddress: account,
        side: 'buy',
        outcome: marketSide === 'yes',
        price: marketEstimatedPrice,
        size,
        signature,
        salt: ethers.hexlify(ethers.randomBytes(32)),
        nonce: nonce.toString(),
        expiration: new Date(expiration * 1000),
      };

      toast({
        title: 'Executing Order',
        description: 'Executing your market order...',
      });

      const response = await apiRequest('POST', '/api/orders', orderData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute order');
      }

      toast({
        title: 'Order Executed',
        description: `Bought ${size} ${marketSide.toUpperCase()} shares`,
      });

      setMarketSize('');

      await queryClient.invalidateQueries({ queryKey: ['/api/markets', marketId, 'orders'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/users', account, 'orders'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/users', account, 'positions'] });
    } catch (error: any) {
      console.error('Error executing market order:', error);
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to execute market order',
        variant: 'destructive',
      });
    } finally {
      setIsExecutingMarket(false);
    }
  };

  const executeSplit = async () => {
    const amount = parseFloat(splitAmount);

    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    const balance = parseFloat(proxyBalance);
    if (amount > balance) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have ${balance.toFixed(2)} USDT in ProxyWallet`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await split(conditionId, splitAmount);
      setSplitAmount('');
    } catch (error) {
      console.error('Split error:', error);
    }
  };

  const executeMerge = async () => {
    const amount = parseFloat(mergeAmount);

    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (amount > maxMergeable) {
      toast({
        title: 'Insufficient Tokens',
        description: `You can only merge up to ${maxMergeable.toFixed(2)} position sets`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await merge(conditionId, mergeAmount);
      setMergeAmount('');
    } catch (error) {
      console.error('Merge error:', error);
    }
  };

  const proxyBalanceFormatted = parseFloat(ethers.formatUnits(proxyBalance || '0', 6));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">ProxyWallet Balance:</span>
        </div>
        <Badge variant="secondary" className="font-mono text-base" data-testid="text-proxy-balance">
          {proxyBalanceFormatted.toFixed(2)} USDT
        </Badge>
      </div>

      <Separator className="mb-4" />

      <Tabs defaultValue="limit" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="limit" data-testid="tab-limit-order">
            Limit Order
          </TabsTrigger>
          <TabsTrigger value="market" data-testid="tab-market-order">
            Market Order
          </TabsTrigger>
          <TabsTrigger value="split" data-testid="tab-split">
            Split
          </TabsTrigger>
          <TabsTrigger value="merge" data-testid="tab-merge">
            Merge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="limit" className="space-y-4 mt-4">
          <div>
            <Label className="mb-2 block">Side</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={limitSide === 'yes' ? 'default' : 'outline'}
                onClick={() => setLimitSide('yes')}
                data-testid="button-limit-yes"
                className="w-full"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                BUY YES
              </Button>
              <Button
                variant={limitSide === 'no' ? 'destructive' : 'outline'}
                onClick={() => setLimitSide('no')}
                data-testid="button-limit-no"
                className="w-full"
              >
                <TrendingDown className="mr-2 h-4 w-4" />
                BUY NO
              </Button>
            </div>
          </div>

          {!isLoadingOrders && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Order Book</div>
              <div className="flex justify-between text-sm">
                <span>Best {limitSide === 'yes' ? 'YES' : 'NO'} Bid:</span>
                <span className="font-mono">
                  ${(limitSide === 'yes' ? bestPrices.yesBid : bestPrices.noBid).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Best {limitSide === 'yes' ? 'YES' : 'NO'} Ask:</span>
                <span className="font-mono">
                  ${(limitSide === 'yes' ? bestPrices.yesAsk : bestPrices.noAsk).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="limit-price">Price (USDT)</Label>
            <Input
              id="limit-price"
              type="number"
              step="0.01"
              min="0.01"
              max="0.99"
              placeholder="0.50"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              data-testid="input-limit-price"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit-size">Size (shares)</Label>
            <Input
              id="limit-size"
              type="number"
              step="0.01"
              min="0"
              placeholder="100"
              value={limitSize}
              onChange={(e) => setLimitSize(e.target.value)}
              data-testid="input-limit-size"
              className="font-mono"
            />
          </div>

          {limitTotal > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-mono font-semibold" data-testid="text-limit-total">
                  ${limitTotal.toFixed(2)} USDT
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={placeLimitOrder}
            disabled={!account || !limitPrice || !limitSize || isPlacingLimit}
            data-testid="button-place-limit-order"
            variant={limitSide === 'yes' ? 'default' : 'destructive'}
          >
            {isPlacingLimit ? 'Placing Order...' : 'Place Limit Order'}
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Limit orders are placed at your specified price and will be filled when matched with opposite orders.
              This is a gasless operation using meta-transactions.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4 mt-4">
          <div>
            <Label className="mb-2 block">Side</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={marketSide === 'yes' ? 'default' : 'outline'}
                onClick={() => setMarketSide('yes')}
                data-testid="button-market-yes"
                className="w-full"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                BUY YES
              </Button>
              <Button
                variant={marketSide === 'no' ? 'destructive' : 'outline'}
                onClick={() => setMarketSide('no')}
                data-testid="button-market-no"
                className="w-full"
              >
                <TrendingDown className="mr-2 h-4 w-4" />
                BUY NO
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <div className="text-xs text-muted-foreground mb-1">Current Market</div>
            <div className="flex justify-between text-sm">
              <span>Estimated Price:</span>
              <span className="font-mono font-semibold" data-testid="text-market-price">
                ${marketEstimatedPrice.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Available Liquidity:</span>
              <span className="font-mono">
                {(marketSide === 'yes' ? orderBook.yesAsks : orderBook.noAsks)
                  .reduce((sum, order) => sum + (order.size - order.filled), 0)
                  .toFixed(2)}{' '}
                shares
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="market-size">Size (shares)</Label>
            <Input
              id="market-size"
              type="number"
              step="0.01"
              min="0"
              placeholder="100"
              value={marketSize}
              onChange={(e) => setMarketSize(e.target.value)}
              data-testid="input-market-size"
              className="font-mono"
            />
          </div>

          {marketTotal > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Total</span>
                <span className="font-mono font-semibold" data-testid="text-market-total">
                  ${marketTotal.toFixed(2)} USDT
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={executeMarketOrder}
            disabled={!account || !marketSize || isExecutingMarket}
            data-testid="button-execute-market-order"
            variant={marketSide === 'yes' ? 'default' : 'destructive'}
          >
            {isExecutingMarket ? 'Executing...' : 'Execute Market Order'}
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Market orders are executed immediately at the best available price. Price may vary based on available
              liquidity. This is a gasless operation using meta-transactions.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="split" className="space-y-4 mt-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="text-xs text-muted-foreground mb-1">ProxyWallet Balance</div>
            <div className="flex justify-between text-sm">
              <span>Available USDT:</span>
              <span className="font-mono font-semibold">{proxyBalanceFormatted.toFixed(2)} USDT</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="split-amount">Amount to Split (USDT)</Label>
            <Input
              id="split-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="100.00"
              value={splitAmount}
              onChange={(e) => setSplitAmount(e.target.value)}
              data-testid="input-split-amount"
              className="font-mono"
            />
          </div>

          {splitAmount && parseFloat(splitAmount) > 0 && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <div className="text-xs text-muted-foreground mb-1">You will receive:</div>
              <div className="flex justify-between text-sm">
                <span>YES tokens:</span>
                <span className="font-mono" data-testid="text-split-yes">
                  {splitAmount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>NO tokens:</span>
                <span className="font-mono" data-testid="text-split-no">
                  {splitAmount}
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={executeSplit}
            disabled={!account || !splitAmount || isSplitting}
            data-testid="button-split-position"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {isSplitting ? 'Splitting...' : 'Split Position'}
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Convert USDT into equal amounts of YES and NO outcome tokens. Each USDT creates 1 YES token and 1 NO
              token. This is a gasless operation using ProxyWallet meta-transactions.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="merge" className="space-y-4 mt-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="text-xs text-muted-foreground mb-1">Your Position Balances</div>
            <div className="flex justify-between text-sm">
              <span>YES tokens:</span>
              <span className="font-mono" data-testid="text-balance-yes">
                {parseFloat(yesBalance).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>NO tokens:</span>
              <span className="font-mono" data-testid="text-balance-no">
                {parseFloat(noBalance).toFixed(2)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-medium">
              <span>Max Mergeable:</span>
              <span className="font-mono" data-testid="text-max-mergeable">
                {maxMergeable.toFixed(2)} sets
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merge-amount">Position Sets to Merge</Label>
            <Input
              id="merge-amount"
              type="number"
              step="0.01"
              min="0"
              max={maxMergeable}
              placeholder="10.00"
              value={mergeAmount}
              onChange={(e) => setMergeAmount(e.target.value)}
              data-testid="input-merge-amount"
              className="font-mono"
            />
          </div>

          {mergeAmount && parseFloat(mergeAmount) > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You will receive:</span>
                <span className="font-mono font-semibold" data-testid="text-merge-receive">
                  {mergeAmount} USDT
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={executeMerge}
            disabled={!account || !mergeAmount || isMerging || maxMergeable === 0}
            data-testid="button-merge-position"
          >
            <Combine className="mr-2 h-4 w-4" />
            {isMerging ? 'Merging...' : 'Merge Position'}
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Burn equal amounts of YES and NO tokens to get USDT back. Each position set (1 YES + 1 NO) returns 1
              USDT. This is a gasless operation using ProxyWallet meta-transactions.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

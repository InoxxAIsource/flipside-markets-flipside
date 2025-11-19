import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingDown, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AMMSwapPanelProps {
  poolAddress: string;
  marketId: string;
}

interface PoolInfo {
  yesReserve: string;
  noReserve: string;
  totalSupply: string;
  lpTokenAddress: string;
  yesPrice: number;
  noPrice: number;
  totalLiquidity: string;
}

interface SwapQuote {
  amountOut: string;
  priceImpact: number;
  effectivePrice: number;
  feeAmount: string;
}

export function AMMSwapPanel({ poolAddress, marketId }: AMMSwapPanelProps) {
  const [buyYes, setBuyYes] = useState(true);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState('1.0');

  // Fetch pool info
  const { data: poolInfo, isLoading: poolLoading } = useQuery<PoolInfo>({
    queryKey: ['/api/pool', poolAddress, 'info'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch swap quote when amount changes
  const { data: quote, isLoading: quoteLoading } = useQuery<SwapQuote>({
    queryKey: ['/api/pool', poolAddress, 'quote', { buyYes, amountIn }],
    enabled: !!amountIn && parseFloat(amountIn) > 0,
    refetchInterval: 5000,
  });

  // Calculate minimum amount out based on slippage
  const minAmountOut = quote
    ? (parseFloat(quote.amountOut) * (1 - parseFloat(slippage) / 100)).toFixed(6)
    : '0';

  const priceImpactColor = (impact: number) => {
    if (impact < 1) return 'text-green-500';
    if (impact < 3) return 'text-yellow-500';
    return 'text-destructive';
  };

  if (poolLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  if (!poolInfo) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load pool information</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AMM Swap</h3>
          <Badge variant="outline" className="text-xs">
            Constant-Sum AMM
          </Badge>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
          <div>
            <div className="text-xs text-muted-foreground mb-1">YES Reserve</div>
            <div className="text-lg font-mono font-semibold text-primary">
              ${(parseFloat(poolInfo.yesReserve) / 1e6).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">NO Reserve</div>
            <div className="text-lg font-mono font-semibold">
              ${(parseFloat(poolInfo.noReserve) / 1e6).toFixed(2)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Current Prices</div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono">
                YES: <span className="text-primary font-semibold">{(poolInfo.yesPrice * 100).toFixed(1)}¢</span>
              </span>
              <span className="text-sm font-mono">
                NO: <span className="font-semibold">{(poolInfo.noPrice * 100).toFixed(1)}¢</span>
              </span>
            </div>
          </div>
        </div>

        {/* Swap Interface */}
        <Tabs defaultValue="swap" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="swap">Swap</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="space-y-4 mt-4">
            {/* Buy YES/NO Toggle */}
            <div className="flex gap-2">
              <Button
                variant={buyYes ? 'default' : 'outline'}
                onClick={() => setBuyYes(true)}
                className="flex-1"
                data-testid="button-buy-yes"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Buy YES
              </Button>
              <Button
                variant={!buyYes ? 'default' : 'outline'}
                onClick={() => setBuyYes(false)}
                className="flex-1"
                data-testid="button-buy-no"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Buy NO
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amountIn">Amount (USDT)</Label>
              <Input
                id="amountIn"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="font-mono text-lg"
                data-testid="input-swap-amount"
              />
              <div className="flex gap-2 mt-2">
                {['10', '50', '100'].map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setAmountIn(amount)}
                    className="text-xs"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="p-2 bg-muted rounded-full">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Expected Output */}
            <div className="space-y-2">
              <Label>You Receive ({buyYes ? 'YES' : 'NO'} tokens)</Label>
              <div className="p-4 bg-muted/30 rounded-lg border">
                {quoteLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : quote ? (
                  <div className="text-2xl font-mono font-bold">
                    {(parseFloat(quote.amountOut) / 1e6).toFixed(6)}
                  </div>
                ) : (
                  <div className="text-2xl font-mono text-muted-foreground">0.00</div>
                )}
              </div>
            </div>

            {/* Swap Details */}
            {quote && (
              <div className="space-y-2 p-4 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Effective Price</span>
                  <span className="font-mono font-medium">
                    {(quote.effectivePrice * 100).toFixed(2)}¢
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Price Impact</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          The difference between market price and your execution price due to trade size
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className={`font-semibold ${priceImpactColor(quote.priceImpact)}`}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trading Fee (2%)</span>
                  <span className="font-mono">
                    ${(parseFloat(quote.feeAmount) / 1e6).toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Minimum Received</span>
                  <span className="font-mono font-medium">
                    {(parseFloat(minAmountOut) / 1e6).toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            {/* Slippage Setting */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slippage">Slippage Tolerance</Label>
                <span className="text-sm text-muted-foreground">{slippage}%</span>
              </div>
              <div className="flex gap-2">
                {['0.5', '1.0', '2.0'].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={slippage === value ? 'default' : 'outline'}
                    onClick={() => setSlippage(value)}
                    className="flex-1 text-xs"
                  >
                    {value}%
                  </Button>
                ))}
                <Input
                  id="slippage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20 text-xs font-mono"
                />
              </div>
            </div>

            {/* Swap Button */}
            <Button
              size="lg"
              className="w-full"
              disabled={!amountIn || parseFloat(amountIn) <= 0 || !quote}
              data-testid="button-execute-swap"
            >
              {!amountIn || parseFloat(amountIn) <= 0
                ? 'Enter Amount'
                : quoteLoading
                ? 'Calculating...'
                : `Swap for ${buyYes ? 'YES' : 'NO'}`}
            </Button>

            {quote && quote.priceImpact > 5 && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-destructive">High Price Impact</p>
                  <p className="text-muted-foreground">
                    This trade will significantly move the market price. Consider trading a smaller amount.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-4 mt-4">
            <div className="text-center p-8 text-muted-foreground">
              <p>Liquidity management coming soon</p>
              <p className="text-xs mt-2">Add/remove liquidity and earn LP fees</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

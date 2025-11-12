import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { PriceChart } from '@/components/PriceChart';
import { TradingPanel } from '@/components/TradingPanel';
import { MarketStats } from '@/components/MarketStats';
import { MarketDetails } from '@/components/MarketDetails';
import type { Market } from '@shared/schema';

// TODO: Remove mock data
const mockMarket: Market = {
  id: '1',
  question: 'Will Bitcoin reach $100,000 by the end of 2025?',
  description: 'This market will resolve to YES if Bitcoin (BTC/USD) reaches a price of $100,000 or higher at any point before December 31, 2025, 23:59:59 UTC. The price will be determined using the Pyth Network price feed.',
  category: 'Crypto',
  expiresAt: new Date('2025-12-31'),
  resolvedAt: null,
  outcome: null,
  yesPrice: 0.68,
  noPrice: 0.32,
  volume: 125000,
  liquidity: 50000,
  creatorAddress: '0x1234567890123456789012345678901234567890',
  contractAddress: '0x9876543210987654321098765432109876543210',
  pythPriceFeed: 'BTC/USD',
  baselinePrice: 95000,
  resolved: false,
  createdAt: new Date('2024-01-15'),
};

export default function MarketPage() {
  const [, params] = useRoute('/market/:id');
  const marketId = params?.id;

  // TODO: Fetch market by ID from API
  const market = mockMarket;

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Market not found</p>
        <Link href="/">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Markets
          </Button>
        </Link>
      </div>
    );
  }

  const yesPercentage = Math.round(market.yesPrice * 100);
  const noPercentage = Math.round(market.noPrice * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Badge variant="secondary">{market.category}</Badge>
          {market.resolved && (
            <Badge variant={market.outcome ? 'default' : 'destructive'}>
              Resolved: {market.outcome ? 'YES' : 'NO'}
            </Badge>
          )}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {market.question}
          </h1>
        </div>

        <MarketStats 
          volume={market.volume}
          liquidity={market.liquidity}
          traders={342}
          activity={1247}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Price Chart</h2>
                <div className="flex gap-2 text-sm">
                  <Button variant="ghost" size="sm">1H</Button>
                  <Button variant="ghost" size="sm">1D</Button>
                  <Button variant="ghost" size="sm">1W</Button>
                  <Button variant="ghost" size="sm">1M</Button>
                </div>
              </div>
              <PriceChart height={400} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-lg border p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">YES Probability</span>
                    <Badge variant="outline">Long</Badge>
                  </div>
                  <div className="text-3xl font-mono font-bold text-primary">
                    {yesPercentage}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {yesPercentage}¢ per share
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">NO Probability</span>
                    <Badge variant="outline">Short</Badge>
                  </div>
                  <div className="text-3xl font-mono font-bold text-destructive">
                    {noPercentage}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {noPercentage}¢ per share
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <TradingPanel 
              yesPrice={market.yesPrice}
              noPrice={market.noPrice}
            />
            <MarketDetails market={market} />
          </div>
        </div>
      </div>
    </div>
  );
}

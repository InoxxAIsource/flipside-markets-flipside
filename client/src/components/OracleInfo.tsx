import { ExternalLink, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OracleInfoProps {
  pythPriceFeedId?: string | null;
  baselinePrice?: number | null;
  question: string;
}

const PYTH_PRICE_FEEDS: Record<string, { name: string; url: string }> = {
  'ETH/USD': {
    name: 'ETH/USD',
    url: 'https://pyth.network/price-feeds/crypto-eth-usd',
  },
  'BTC/USD': {
    name: 'BTC/USD',
    url: 'https://pyth.network/price-feeds/crypto-btc-usd',
  },
  'SOL/USD': {
    name: 'SOL/USD',
    url: 'https://pyth.network/price-feeds/crypto-sol-usd',
  },
};

export function OracleInfo({ pythPriceFeedId, baselinePrice, question }: OracleInfoProps) {
  if (!pythPriceFeedId || !baselinePrice) {
    return (
      <Card className="p-4" data-testid="oracle-info-manual">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Resolution</h3>
            <p className="text-sm text-muted-foreground">
              This market will be manually resolved by the creator based on the outcome.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const feedInfo = PYTH_PRICE_FEEDS[pythPriceFeedId];
  const pythUrl = feedInfo?.url || 'https://pyth.network/price-feeds';

  return (
    <Card className="p-4" data-testid="oracle-info-pyth">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Automated Resolution</h3>
            <Badge variant="secondary" className="text-xs">
              Pyth Oracle
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This market will automatically resolve based on real-time price data from Pyth Network oracles.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">Resolution Source</span>
            <a
              href={pythUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium hover-elevate active-elevate-2 rounded px-2 py-1"
              data-testid="link-pyth-feed"
            >
              <span>{feedInfo?.name || pythPriceFeedId}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">Baseline Price</span>
            <span className="text-sm font-mono font-semibold" data-testid="text-baseline-price">
              ${baselinePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">Resolver</span>
            <a
              href="https://pyth.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium hover-elevate active-elevate-2 rounded px-2 py-1"
              data-testid="link-pyth-network"
            >
              <span>Pyth Network</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The market resolves to "YES" if the {pythPriceFeedId} price meets or exceeds the baseline price at expiry.
            Otherwise, it resolves to "NO".
          </p>
        </div>
      </div>
    </Card>
  );
}

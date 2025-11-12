import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, ExternalLink } from 'lucide-react';
import { formatAddress } from '@/lib/web3';
import type { Market } from '@shared/schema';

interface MarketDetailsProps {
  market: Market;
}

export function MarketDetails({ market }: MarketDetailsProps) {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Market Information</h3>
        <p className="text-sm text-muted-foreground">
          {market.description || 'No description provided'}
        </p>
      </div>

      <Separator />

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Creator
          </span>
          <a
            href={`https://sepolia.etherscan.io/address/${market.creatorAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono hover:text-primary flex items-center gap-1"
          >
            {formatAddress(market.creatorAddress)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Created
          </span>
          <span>{new Date(market.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Expires</span>
          <span>{new Date(market.expiresAt).toLocaleDateString()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Category</span>
          <Badge variant="secondary">{market.category}</Badge>
        </div>

        {market.pythPriceFeed && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                Price Feed
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Feed</span>
                <span className="font-mono">{market.pythPriceFeed}</span>
              </div>
              {market.baselinePrice && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Baseline</span>
                  <span className="font-mono">${market.baselinePrice.toLocaleString()}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {market.contractAddress && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              Contract
            </h4>
            <a
              href={`https://sepolia.etherscan.io/address/${market.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono hover:text-primary flex items-center gap-1 break-all"
            >
              {market.contractAddress}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </>
      )}

      {market.resolved && (
        <>
          <Separator />
          <div className="space-y-2 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Badge variant={market.outcome ? 'default' : 'destructive'}>
                Resolved: {market.outcome ? 'YES' : 'NO'}
              </Badge>
            </div>
            {market.resolvedAt && (
              <p className="text-xs text-muted-foreground">
                Resolved on {new Date(market.resolvedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import type { Market } from '@shared/schema';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const yesPercentage = Math.round(market.yesPrice * 100);
  const noPercentage = Math.round(market.noPrice * 100);

  return (
    <Link href={`/market/${market.id}`}>
      <Card 
        className="p-5 hover-elevate cursor-pointer transition-all h-full flex flex-col gap-4"
        data-testid={`card-market-${market.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {market.category}
            </Badge>
            {market.resolved && (
              <Badge variant="outline" className="text-xs">
                Resolved
              </Badge>
            )}
            {market.pythPriceFeedId && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                Pyth Oracle
              </Badge>
            )}
          </div>
        </div>
        
        <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
          {market.question}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase font-medium">Yes</span>
              <ArrowUpRight className="h-3 w-3 text-primary" />
            </div>
            <div className="font-mono font-bold text-lg text-primary">
              {yesPercentage}¢
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase font-medium">No</span>
              <ArrowDownRight className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="font-mono font-bold text-lg text-muted-foreground">
              {noPercentage}¢
            </div>
          </div>
        </div>

        <div className="pt-3 border-t flex items-center justify-between text-xs">
          <CountdownTimer expiresAt={market.expiresAt} />
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span className="font-mono">${market.volume.toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

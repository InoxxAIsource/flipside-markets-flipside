import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';
import type { Market } from '@shared/schema';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const timeRemaining = new Date(market.expiresAt).getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60 * 24)));
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  
  const yesPercentage = Math.round(market.yesPrice * 100);
  const noPercentage = Math.round(market.noPrice * 100);

  return (
    <Link href={`/market/${market.id}`}>
      <Card 
        className="p-6 hover-elevate cursor-pointer transition-all h-full flex flex-col"
        data-testid={`card-market-${market.id}`}
      >
        <div className="space-y-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {market.category}
            </Badge>
            {market.resolved && (
              <Badge variant="outline" className="text-xs">
                Resolved
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {market.question}
          </h3>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {daysRemaining > 0 ? `${daysRemaining}d` : `${hoursRemaining}h`} left
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-mono">${market.volume.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">YES</span>
              <span className="font-mono font-bold text-primary text-xl">
                {yesPercentage}¢
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

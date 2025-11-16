import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '@/lib/priceParser';

interface PriceDisplayProps {
  marketId: string;
  targetPrice: number | null;
  className?: string;
}

interface CurrentPriceData {
  currentPrice: number;
  targetPrice: number | null;
  confidence: number;
  publishTime: string;
  priceFeedId: string;
}

export function PriceDisplay({ marketId, targetPrice, className = '' }: PriceDisplayProps) {
  const { data: priceData, isLoading } = useQuery<CurrentPriceData>({
    queryKey: ['/api/markets', marketId, 'current-price'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading || !priceData) {
    return (
      <div className={`flex items-center justify-between gap-8 ${className}`}>
        <div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
            Price to Beat
          </div>
          <div className="text-2xl font-semibold text-muted-foreground animate-pulse">
            Loading...
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
            Current Price
          </div>
          <div className="text-2xl font-semibold animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = priceData.currentPrice;
  const target = priceData.targetPrice || targetPrice;
  const isPriceAboveTarget = target ? currentPrice >= target : false;
  const priceDiff = target ? currentPrice - target : 0;
  const percentDiff = target ? ((currentPrice - target) / target) * 100 : 0;

  return (
    <div className={`flex items-center justify-between gap-8 ${className}`} data-testid="price-display">
      {/* Target Price - only show if we have one */}
      {target && (
        <div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
            Price to Beat
          </div>
          <div className="text-2xl font-semibold text-muted-foreground" data-testid="text-target-price">
            ${formatPrice(target)}
          </div>
        </div>
      )}

      {/* Current Price */}
      <div className={target ? '' : 'w-full'}>
        <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
          Current Price
        </div>
        <div className="flex items-center gap-2">
          <div 
            className={`text-2xl font-semibold ${
              target ? (isPriceAboveTarget ? 'text-primary' : 'text-destructive') : 'text-foreground'
            }`}
            data-testid="text-current-price"
          >
            ${formatPrice(currentPrice)}
          </div>
          {target && (
            <div className="flex items-center gap-1">
              {isPriceAboveTarget ? (
                <TrendingUp className="h-5 w-5 text-primary" data-testid="icon-trending-up" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" data-testid="icon-trending-down" />
              )}
              <span className={`text-sm font-medium ${
                isPriceAboveTarget ? 'text-primary' : 'text-destructive'
              }`}>
                {isPriceAboveTarget ? '+' : ''}{formatPrice(priceDiff, 2)}
                <span className="text-muted-foreground ml-1">
                  ({isPriceAboveTarget ? '+' : ''}{percentDiff.toFixed(2)}%)
                </span>
              </span>
            </div>
          )}
        </div>
        {priceData.publishTime && (
          <div className="text-xs text-muted-foreground mt-1">
            Updated {new Date(priceData.publishTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

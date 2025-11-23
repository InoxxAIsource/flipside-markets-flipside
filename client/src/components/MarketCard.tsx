import { useState } from 'react';
import type { ElementType } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Brain, Shield } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { AIAnalysisDialog } from './AIAnalysisDialog';
import { detectCryptoFromQuestion } from '@/lib/cryptoLogos';
import { extractTargetPrice, formatPrice, formatSharePrice } from '@/lib/priceParser';
import { SiBitcoin, SiEthereum, SiSolana, SiRipple, SiBinance, SiDogecoin, SiCardano, SiPolygon } from 'react-icons/si';
import type { Market } from '@shared/schema';

interface MarketCardProps {
  market: Market;
}

const cryptoIcons: Record<string, ElementType> = {
  SiBitcoin,
  SiEthereum,
  SiSolana,
  SiRipple,
  SiBinance,
  SiDogecoin,
  SiCardano,
  SiPolygon,
};

export function MarketCard({ market }: MarketCardProps) {
  const [, navigate] = useLocation();
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const yesPercentage = Math.round(market.yesPrice * 100);
  const noPercentage = Math.round(market.noPrice * 100);
  
  // Check if market is expired
  const isExpired = new Date(market.expiresAt) < new Date();
  
  // Detect if this is a sports market - check category prefix OR presence of ESPN fields
  const isSportsMarket = market.category?.startsWith('Sports') || 
                         !!(market.homeTeam || market.awayTeam || market.sport || market.espnEventId);
  
  // Detect crypto token for auto logo
  const cryptoToken = detectCryptoFromQuestion(market.question);
  const CryptoIcon = cryptoToken ? cryptoIcons[cryptoToken.iconName] : null;
  
  // Determine which image to show (fallback to crypto/default if custom image fails)
  const hasCustomImage = market.imageUrl && market.imageUrl.trim() !== '' && !imageLoadFailed;
  const hasCryptoLogo = !hasCustomImage && CryptoIcon;

  // Oracle market detection and price fetching
  const isOracleMarket = !!market.pythPriceFeedId;
  const targetPrice = isOracleMarket ? (extractTargetPrice(market.question) || market.baselinePrice || null) : null;
  
  // Fetch current price for oracle markets
  const { data: priceData } = useQuery<{
    currentPrice: number;
    targetPrice: number | null;
    confidence: number;
    publishTime: string;
  }>({
    queryKey: ['/api/markets', market.id, 'current-price'],
    enabled: isOracleMarket,
    refetchInterval: 30000, // Refresh every 30 seconds for cards (less aggressive than detail page)
  });
  
  const handleBuyClick = (e: React.MouseEvent, outcome: 'yes' | 'no') => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/market/${market.id}?action=buy&outcome=${outcome}`);
  };

  const handleAIClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAIDialog(true);
  };

  return (
    <>
      <Link href={`/market/${market.id}`}>
        <Card 
          className={`group overflow-hidden hover-elevate cursor-pointer transition-all duration-300 h-full flex flex-col border-border/60 ${
            isExpired ? 'opacity-60 grayscale-[50%]' : ''
          }`}
          data-testid={`card-market-${market.id}`}
        >
        {/* Featured Image or Sports Teams or Crypto Logo */}
        {isSportsMarket ? (
          <div 
            className="relative w-full h-40 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #${market.awayTeamColor || '000000'}20 0%, #${market.homeTeamColor || '000000'}20 100%)`,
            }}
          >
            {/* Game Status Badge */}
            {market.gameStatus === 'in' && (
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="destructive" className="text-xs font-semibold animate-pulse">
                  LIVE
                </Badge>
              </div>
            )}
            
            {/* Team Logos */}
            <div className="absolute inset-0 flex items-center justify-between px-8">
              {/* Away Team */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-background/60">
                  {market.awayTeamLogo ? (
                    <img 
                      src={market.awayTeamLogo} 
                      alt={market.awayTeam || 'Away'}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    />
                  ) : (
                    <div className="text-xl font-bold text-foreground/60">
                      {market.awayTeam?.split(' ').map(w => w[0]).join('').slice(0, 3) || 'A'}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-foreground/90 bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded">
                  {market.awayTeam?.split(' ').pop()}
                </span>
              </div>

              {/* VS or Score */}
              <div className="flex flex-col items-center gap-1">
                {market.gameStatus === 'in' || market.gameStatus === 'post' ? (
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                    <span className="text-2xl font-bold">{market.awayScore}</span>
                    <span className="text-sm text-muted-foreground">-</span>
                    <span className="text-2xl font-bold">{market.homeScore}</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-muted-foreground bg-background/60 backdrop-blur-sm px-4 py-1 rounded-lg">
                    @
                  </div>
                )}
                {market.gameStatus === 'in' && (
                  <Badge variant="secondary" className="text-xs">
                    Live
                  </Badge>
                )}
              </div>

              {/* Home Team */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-background/60">
                  {market.homeTeamLogo ? (
                    <img 
                      src={market.homeTeamLogo} 
                      alt={market.homeTeam || 'Home'}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    />
                  ) : (
                    <div className="text-xl font-bold text-foreground/60">
                      {market.homeTeam?.split(' ').map(w => w[0]).join('').slice(0, 3) || 'H'}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-foreground/90 bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded">
                  {market.homeTeam?.split(' ').pop()}
                </span>
              </div>
            </div>

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : hasCustomImage ? (
          <div className="relative w-full h-40 bg-muted overflow-hidden">
            <img 
              src={market.imageUrl!} 
              alt={market.question}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => {
                // Fallback to crypto logo or default gradient if image fails
                setImageLoadFailed(true);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : hasCryptoLogo ? (
          <div className="relative w-full h-40 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center overflow-hidden">
            <CryptoIcon className="w-20 h-20 text-primary opacity-70 transition-all duration-300 group-hover:scale-110 group-hover:opacity-90" />
          </div>
        ) : (
          <div className="relative w-full h-40 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
            <span className="text-5xl opacity-20">?</span>
          </div>
        )}
        
        {/* Card Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs font-medium uppercase tracking-wide">
              {market.category}
            </Badge>
            {isExpired && !market.resolved && (
              <Badge variant="destructive" className="text-xs font-semibold" data-testid={`badge-expired-${market.id}`}>
                EXPIRED
              </Badge>
            )}
            {market.marketType === 'POOL' ? (
              <Badge variant="default" className="text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                LP Pool
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-semibold">
                Order Book
              </Badge>
            )}
            {market.resolved && (
              <Badge variant="outline" className="text-xs">
                Resolved
              </Badge>
            )}
            {market.pythPriceFeedId && (
              <>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                  Oracle
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs flex items-center gap-1 cursor-help">
                      <Shield className="h-3 w-3" />
                      Manual Resolution
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Resolved by admins using verified Pyth Network price data</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
          
          {/* Question */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1 min-h-[2.5rem]">
            {market.question}
          </h3>

          {/* Sports Markets: Show Sportsbook Odds */}
          {isSportsMarket && (
            (market.spread || market.overUnder) ? (
              <div className="flex flex-col gap-1.5 py-2.5 px-3 border-t border-b bg-primary/5 border-primary/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/80 uppercase tracking-wide">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Sportsbook Odds</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm">
                  {market.spread && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">Spread:</span>
                      <span className="font-bold text-foreground font-mono">{market.spread}</span>
                    </div>
                  )}
                  {market.spread && market.overUnder && <span className="text-border">•</span>}
                  {market.overUnder && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">O/U:</span>
                      <span className="font-bold text-foreground font-mono">{market.overUnder}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 border-t border-b bg-muted/20 text-xs text-muted-foreground">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Sportsbook odds unavailable</span>
              </div>
            )
          )}

          {/* Oracle Markets: Show Current Price */}
          {isOracleMarket && priceData ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Current Price</div>
                  <div 
                    className={`text-2xl font-bold transition-colors ${
                      targetPrice 
                        ? (priceData.currentPrice >= targetPrice ? 'text-primary' : 'text-destructive')
                        : 'text-foreground'
                    }`}
                    data-testid={`text-current-price-${market.id}`}
                  >
                    ${formatPrice(priceData.currentPrice)}
                  </div>
                </div>
                {targetPrice && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Target</div>
                    <div className="text-lg font-semibold text-muted-foreground" data-testid={`text-target-price-${market.id}`}>
                      ${formatPrice(targetPrice)}
                    </div>
                  </div>
                )}
              </div>
              {targetPrice && (
                <div className="flex items-center justify-center gap-1 py-1">
                  {priceData.currentPrice >= targetPrice ? (
                    <TrendingUp className="h-4 w-4 text-primary" data-testid={`icon-trending-up-${market.id}`} />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" data-testid={`icon-trending-down-${market.id}`} />
                  )}
                  <span className={`text-sm font-medium ${
                    priceData.currentPrice >= targetPrice ? 'text-primary' : 'text-destructive'
                  }`}>
                    {priceData.currentPrice >= targetPrice ? '+' : ''}{formatPrice(priceData.currentPrice - targetPrice, 2)}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({priceData.currentPrice >= targetPrice ? '+' : ''}{(((priceData.currentPrice - targetPrice) / targetPrice) * 100).toFixed(2)}%)
                    </span>
                  </span>
                </div>
              )}
            </div>
          ) : !isOracleMarket ? (
            /* Regular Markets: YES/NO Percentages - Clean and Bold */
            <div className="flex items-stretch gap-2 py-2">
              <div className="flex-1 text-center p-3 rounded-md bg-primary/5 border border-primary/20 hover-elevate transition-all">
                <div className="text-2xl font-bold text-primary mb-0.5">{yesPercentage}%</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Yes</div>
              </div>
              <div className="flex-1 text-center p-3 rounded-md bg-muted/30 border border-border/40 hover-elevate transition-all">
                <div className="text-2xl font-bold text-foreground mb-0.5">{noPercentage}%</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">No</div>
              </div>
            </div>
          ) : (
            /* Oracle market loading state */
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-muted-foreground">Loading price...</div>
            </div>
          )}

          {/* Buy Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={(e) => handleBuyClick(e, 'yes')}
              data-testid={`button-buy-yes-${market.id}`}
              className="font-semibold h-9 text-xs"
            >
              Buy Yes {formatSharePrice(market.yesPrice)}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleBuyClick(e, 'no')}
              data-testid={`button-buy-no-${market.id}`}
              className="font-semibold h-9 text-xs"
            >
              Buy No {formatSharePrice(market.noPrice)}
            </Button>
          </div>

          {/* Footer - Volume/Liquidity, AI & Countdown */}
          <div className="pt-2 mt-auto border-t flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground" data-testid={`text-volume-${market.id}`}>
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-mono font-medium">
                {market.marketType === 'POOL' 
                  ? market.liquidity >= 1000 
                    ? `$${(market.liquidity / 1000).toFixed(1)}k`
                    : `$${market.liquidity.toFixed(0)}`
                  : market.volume >= 1000
                    ? `$${(market.volume / 1000).toFixed(1)}k`
                    : `$${market.volume.toFixed(0)}`}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAIClick}
              data-testid={`button-ask-ai-${market.id}`}
              className="h-7 px-2 text-xs gap-1"
            >
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span>
            </Button>
            <CountdownTimer expiresAt={market.expiresAt} />
          </div>
        </div>
      </Card>
      </Link>

      {/* AI Analysis Dialog */}
      <AIAnalysisDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        marketId={market.id}
        marketQuestion={market.question}
      />
    </>
  );
}

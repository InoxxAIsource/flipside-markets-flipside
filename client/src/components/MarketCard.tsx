import { useState } from 'react';
import type { ElementType } from 'react';
import { Link, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Brain } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { AIAnalysisDialog } from './AIAnalysisDialog';
import { detectCryptoFromQuestion } from '@/lib/cryptoLogos';
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
  
  // Detect crypto token for auto logo
  const cryptoToken = detectCryptoFromQuestion(market.question);
  const CryptoIcon = cryptoToken ? cryptoIcons[cryptoToken.iconName] : null;
  
  // Determine which image to show (fallback to crypto/default if custom image fails)
  const hasCustomImage = market.imageUrl && market.imageUrl.trim() !== '' && !imageLoadFailed;
  const hasCryptoLogo = !hasCustomImage && CryptoIcon;
  
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
          className="overflow-hidden hover-elevate cursor-pointer transition-all h-full flex flex-col"
          data-testid={`card-market-${market.id}`}
        >
        {/* Featured Image or Crypto Logo */}
        {hasCustomImage ? (
          <div className="relative w-full h-48 bg-muted">
            <img 
              src={market.imageUrl!} 
              alt={market.question}
              className="w-full h-full object-cover"
              onError={() => {
                // Fallback to crypto logo or default gradient if image fails
                setImageLoadFailed(true);
              }}
            />
          </div>
        ) : hasCryptoLogo ? (
          <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center">
            <CryptoIcon className="w-24 h-24 text-primary opacity-80" />
          </div>
        ) : (
          <div className="relative w-full h-48 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
            <span className="text-6xl opacity-20">?</span>
          </div>
        )}
        
        {/* Card Content */}
        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Badges */}
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
                Oracle
              </Badge>
            )}
          </div>
          
          {/* Question */}
          <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
            {market.question}
          </h3>

          {/* YES/NO Percentages - Big and Bold */}
          <div className="flex items-center gap-3 text-center">
            <div className="flex-1">
              <div className="text-3xl font-bold text-primary">{yesPercentage}%</div>
              <div className="text-xs text-muted-foreground uppercase font-medium mt-1">Yes</div>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-muted-foreground">{noPercentage}%</div>
              <div className="text-xs text-muted-foreground uppercase font-medium mt-1">No</div>
            </div>
          </div>

          {/* Buy Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={(e) => handleBuyClick(e, 'yes')}
              data-testid={`button-buy-yes-${market.id}`}
              className="font-semibold"
            >
              Buy Yes {yesPercentage}%
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleBuyClick(e, 'no')}
              data-testid={`button-buy-no-${market.id}`}
              className="font-semibold"
            >
              Buy No {noPercentage}%
            </Button>
          </div>

          {/* AI Analysis Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAIClick}
            data-testid={`button-ask-ai-${market.id}`}
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            Ask AI
          </Button>

          {/* Footer - Volume & Countdown */}
          <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="font-mono">${market.volume.toLocaleString()} Vol</span>
            </div>
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

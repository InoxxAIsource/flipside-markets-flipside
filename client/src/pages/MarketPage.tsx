import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { PriceChart } from '@/components/PriceChart';
import { PriceDisplay } from '@/components/PriceDisplay';
import { TradingPanel } from '@/components/TradingPanel';
import { MarketStats } from '@/components/MarketStats';
import { MarketDetails } from '@/components/MarketDetails';
import { DepositWithdrawPanel } from '@/components/DepositWithdrawPanel';
import { OrderBook } from '@/components/OrderBook';
import { AMMSwapPanel } from '@/components/AMMSwapPanel';
import { CountdownTimer } from '@/components/CountdownTimer';
import { OracleInfo } from '@/components/OracleInfo';
import { extractTargetPrice } from '@/lib/priceParser';
import type { Market } from '@shared/schema';

export default function MarketPage() {
  const [, params] = useRoute('/market/:id');
  const marketId = params?.id;

  const { data: market, isLoading, error } = useQuery<Market>({
    queryKey: ['/api/markets', marketId],
    enabled: !!marketId,
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Market | Flipside</title>
          <meta name="description" content="Flipside - Decentralized prediction market platform on Ethereum" />
        </Helmet>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (error || !market) {
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
  
  // Extract target price from question for oracle markets
  const targetPrice = market.targetPrice || market.baselinePrice || extractTargetPrice(market.question);
  const isOracleMarket = !!market.pythPriceFeedId;

  // SEO metadata
  const pageTitle = `${market.question} | Flipside`;
  const pageDescription = market.description || `Prediction market: ${market.question}. YES: ${yesPercentage}%, NO: ${noPercentage}%. Trade on Flipside's decentralized prediction market platform.`;
  const pageUrl = `https://flipside.exchange/market/${market.id}`;
  const imageUrl = market.imageUrl;

  // JSON-LD structured data for search engines
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": market.question,
    "description": pageDescription,
    ...(imageUrl && { "image": imageUrl }),
    "brand": {
      "@type": "Brand",
      "name": "Flipside"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": market.noPrice.toFixed(2),
      "highPrice": market.yesPrice.toFixed(2),
      "offerCount": "2"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": market.yesPrice.toFixed(2),
      "bestRating": "1.00",
      "worstRating": "0.00"
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta property="og:site_name" content="Flipside" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Badge variant="secondary">{market.category}</Badge>
            {market.marketType === 'POOL' ? (
              <Badge variant="default" className="bg-primary/20 text-primary border border-primary/30">
                LP Pool (AMM)
              </Badge>
            ) : (
              <Badge variant="outline">Order Book (CLOB)</Badge>
            )}
            {market.resolved && (
              <Badge variant={market.outcome ? 'default' : 'destructive'}>
                Resolved: {market.outcome ? 'YES' : 'NO'}
              </Badge>
            )}
            {market.pythPriceFeedId && (
              <Badge variant="outline" className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                Pyth Oracle
              </Badge>
            )}
          </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-bold flex-1">
            {market.question}
          </h1>
          <CountdownTimer expiresAt={market.expiresAt} className="text-base" />
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
                <h2 className="text-lg font-semibold">
                  {isOracleMarket ? 'Asset Price' : 'Price Chart'}
                </h2>
                <div className="flex gap-2 text-sm">
                  <Button variant="ghost" size="sm">1H</Button>
                  <Button variant="ghost" size="sm">1D</Button>
                  <Button variant="ghost" size="sm">1W</Button>
                  <Button variant="ghost" size="sm">1M</Button>
                </div>
              </div>
              
              {/* Show PriceDisplay for oracle markets */}
              {isOracleMarket && (
                <div className="mb-6">
                  <PriceDisplay 
                    marketId={market.id} 
                    targetPrice={targetPrice || null}
                  />
                </div>
              )}
              
              <PriceChart 
                height={400} 
                mode={isOracleMarket ? 'asset-price' : 'probability'}
                showBaseline={!isOracleMarket && !!market.baselinePrice}
                baselinePrice={market.baselinePrice || undefined}
                targetPrice={isOracleMarket ? targetPrice || undefined : undefined}
              />
            </div>

            {/* Only show CLOB probability cards for order book markets */}
            {market.marketType !== 'POOL' && (
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
            )}

            {market.marketType === 'POOL' && market.poolAddress ? (
              <AMMSwapPanel poolAddress={market.poolAddress} marketId={market.id} />
            ) : (
              <OrderBook marketId={market.id} />
            )}
          </div>

          <div className="space-y-6">
            <DepositWithdrawPanel />
            {market.marketType !== 'POOL' && (
              <TradingPanel marketId={market.id} />
            )}
            <OracleInfo 
              pythPriceFeedId={market.pythPriceFeedId}
              baselinePrice={market.baselinePrice}
              question={market.question}
            />
            <MarketDetails market={market} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/Web3Provider";
import { Shield, TrendingDown, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";

interface HedgeRecommendation {
  marketId: string;
  question: string;
  category: string;
  correlationScore: number;
  recommendedSide: "YES" | "NO";
  currentPrice: number;
  suggestedShares: number;
  suggestedCost: number;
}

interface PositionInfo {
  marketId: string;
  question: string;
  category: string;
  yesShares: number;
  noShares: number;
  positionValue: number;
  currentPrice: number;
}

interface HedgeSuggestion {
  position: PositionInfo;
  recommendedHedges: HedgeRecommendation[];
}

interface HedgeSuggestionsResponse {
  suggestions: HedgeSuggestion[];
}

export default function Hedge() {
  const { account } = useWallet();

  const { data, isLoading, error } = useQuery<HedgeSuggestionsResponse>({
    queryKey: ['/api/hedge-suggestions', account],
    enabled: !!account,
  });

  const suggestions = data?.suggestions || [];

  if (!account) {
    return (
      <>
        <Helmet>
          <title>Smart Hedge - AI-Powered Portfolio Protection | Flipside</title>
          <meta name="description" content="Protect your prediction market positions with AI-powered hedge recommendations. Connect your wallet to get started." />
        </Helmet>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <Shield className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-bold" data-testid="text-connect-wallet-heading">Connect Wallet to View Hedge Suggestions</h2>
            <p className="text-muted-foreground max-w-md" data-testid="text-connect-wallet-description">
              Connect your wallet to see AI-powered hedge recommendations for your open positions.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Smart Hedge - Loading... | Flipside</title>
        </Helmet>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2].map((j) => (
                      <Skeleton key={j} className="h-24 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Smart Hedge - Error | Flipside</title>
        </Helmet>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <h2 className="text-2xl font-bold" data-testid="text-error-heading">Error Loading Hedge Suggestions</h2>
            <p className="text-muted-foreground max-w-md" data-testid="text-error-description">
              Failed to load hedge suggestions. Please try again later.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (suggestions.length === 0) {
    return (
      <>
        <Helmet>
          <title>Smart Hedge - No Positions | Flipside</title>
          <meta name="description" content="No hedge opportunities found. Open a trade first to get AI-powered hedge recommendations." />
        </Helmet>
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <Shield className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-bold" data-testid="text-no-positions-heading">No Hedge Opportunities Found</h2>
            <p className="text-muted-foreground max-w-md" data-testid="text-no-positions-description">
              Open a trade first to see smart hedge recommendations!
            </p>
            <Link href="/">
              <Button data-testid="button-browse-markets">
                Browse Markets
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Smart Hedge - AI-Powered Portfolio Protection | Flipside</title>
        <meta name="description" content="Protect your prediction market positions with AI-powered hedge recommendations based on semantic market correlation." />
      </Helmet>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-hedge-heading">Smart Hedge</h1>
          </div>
          <p className="text-muted-foreground" data-testid="text-hedge-description">
            AI-powered hedge recommendations to protect your positions
          </p>
        </div>

        <div className="grid gap-6">
          {suggestions.map((suggestion) => {
            const positionSide = suggestion.position.yesShares > 0 ? "YES" : "NO";
            const positionShares = suggestion.position.yesShares > 0 
              ? suggestion.position.yesShares 
              : suggestion.position.noShares;

            return (
              <Card key={suggestion.position.marketId} data-testid={`card-hedge-suggestion-${suggestion.position.marketId}`}>
                <CardHeader>
                  <CardTitle className="text-lg" data-testid={`text-position-question-${suggestion.position.marketId}`}>
                    Your Position: {suggestion.position.question}
                  </CardTitle>
                  <CardDescription data-testid={`text-position-details-${suggestion.position.marketId}`}>
                    {positionShares.toFixed(2)} {positionSide} shares @ ${suggestion.position.currentPrice.toFixed(3)} 
                    {" • "}Value: ${suggestion.position.positionValue.toFixed(2)}
                    {" • "}{suggestion.position.category}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestion.recommendedHedges.length === 0 ? (
                    <p className="text-muted-foreground text-sm" data-testid="text-no-hedges-available">
                      No correlated markets found for hedging
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Recommended hedge: Take {suggestion.recommendedHedges[0].recommendedSide} positions on correlated markets
                        </p>
                      </div>
                      
                      {suggestion.recommendedHedges.map((hedge) => (
                        <div
                          key={hedge.marketId}
                          className="border rounded-lg p-4 hover-elevate active-elevate-2"
                          data-testid={`card-hedge-recommendation-${hedge.marketId}`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <Link href={`/market/${hedge.marketId}`}>
                                <h3 className="font-medium mb-1 hover:text-primary transition-colors" data-testid={`text-hedge-question-${hedge.marketId}`}>
                                  {hedge.question}
                                </h3>
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" data-testid={`badge-correlation-${hedge.marketId}`}>
                                  {(hedge.correlationScore * 100).toFixed(0)}% correlation
                                </Badge>
                                <span data-testid={`text-category-${hedge.marketId}`}>{hedge.category}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-muted-foreground mb-1">Recommended Action</p>
                              <p className="font-medium" data-testid={`text-recommended-side-${hedge.marketId}`}>
                                Buy {hedge.recommendedSide} @ ${hedge.currentPrice.toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Suggested Position</p>
                              <p className="font-medium" data-testid={`text-suggested-shares-${hedge.marketId}`}>
                                {hedge.suggestedShares} shares ≈ ${hedge.suggestedCost.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <Link href={`/market/${hedge.marketId}`}>
                            <Button size="sm" variant="outline" className="w-full" data-testid={`button-view-market-${hedge.marketId}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Market
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}

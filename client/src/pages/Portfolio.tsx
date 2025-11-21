import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/Web3Provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { DepositWithdrawPanel } from "@/components/DepositWithdrawPanel";
import { formatSharePrice } from "@/lib/priceParser";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download,
  X,
} from "lucide-react";

export default function Portfolio() {
  const { account, isConnected } = useWallet();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch portfolio data
  const { data: positions = [], isLoading: positionsLoading } = useQuery<any[]>({
    queryKey: [`/api/portfolio/positions/${account}`],
    enabled: isConnected && !!account,
  });

  const { data: pnlData, isLoading: pnlLoading } = useQuery<any>({
    queryKey: [`/api/portfolio/pnl/${account}`],
    enabled: isConnected && !!account,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<any[]>({
    queryKey: [`/api/portfolio/history/${account}`],
    enabled: isConnected && !!account,
  });

  // Fetch AMM swap history
  const { data: ammSwaps = [], isLoading: ammSwapsLoading } = useQuery<any[]>({
    queryKey: [`/api/amm/swaps/${account}`],
    enabled: isConnected && !!account,
  });

  // Fetch position merge/redeem history
  const { data: positionMerges = [], isLoading: mergesLoading } = useQuery<any[]>({
    queryKey: [`/api/positions/merges/${account}`],
    enabled: isConnected && !!account,
  });

  // Get open orders (filter from history)
  const openOrders = history.filter((order: any) => order.status === 'open');

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/history/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/positions/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/pnl/${account}`] });
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export history as CSV
  const exportHistoryCSV = () => {
    if (!history.length) return;

    const csvRows = [
      ['Date', 'Market', 'Side', 'Outcome', 'Price', 'Size', 'Filled', 'Status'].join(','),
      ...history.map((order: any) => [
        new Date(order.createdAt).toLocaleDateString(),
        `"${order.market?.question || 'Unknown'}"`,
        order.side,
        order.outcome ? 'YES' : 'NO',
        order.price,
        order.size,
        order.filled,
        order.status,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isConnected || !account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your portfolio
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Portfolio Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-total-value">
              {pnlLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                `$${pnlData?.totalValue?.toFixed(2) || '0.00'}`
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>All-Time PNL</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2" data-testid="text-total-pnl">
              {pnlLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <span className={pnlData?.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {pnlData?.totalPnl >= 0 ? '+' : ''}${pnlData?.totalPnl?.toFixed(2) || '0.00'}
                  </span>
                  {pnlData?.totalPnl >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                </>
              )}
            </CardTitle>
            {!pnlLoading && pnlData && (
              <p className={`text-sm ${pnlData.totalPnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {pnlData.totalPnlPercent >= 0 ? '+' : ''}{pnlData.totalPnlPercent.toFixed(2)}%
              </p>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-win-rate">
              {pnlLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                `${pnlData?.winRate?.toFixed(1) || '0.0'}%`
              )}
            </CardTitle>
            {!pnlLoading && pnlData && (
              <p className="text-sm text-muted-foreground">
                {pnlData.wins}W / {pnlData.losses}L
              </p>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Trades</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-total-trades">
              {pnlLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                pnlData?.totalTrades || 0
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="positions" data-testid="tab-positions">
            Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            Open Orders ({openOrders.length})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            History ({history.length})
          </TabsTrigger>
          <TabsTrigger value="wallet" data-testid="tab-wallet">
            Wallet
          </TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Positions</h2>
          </div>

          {positionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : positions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No positions yet. Start trading to build your portfolio!</p>
                <Button className="mt-4" onClick={() => navigate('/')} data-testid="button-browse-markets">
                  Browse Markets
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {positions.map((position: any) => (
                <Card 
                  key={position.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => navigate(`/market/${position.market.id}`)}
                  data-testid={`card-position-${position.id}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{position.market.question}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{position.market.category}</Badge>
                          {position.yesShares > 0 && (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                              YES: {position.yesShares.toFixed(2)} @ {formatSharePrice(position.market.yesPrice)}
                            </Badge>
                          )}
                          {position.noShares > 0 && (
                            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                              NO: {position.noShares.toFixed(2)} @ {formatSharePrice(position.market.noPrice)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="text-2xl font-bold">${position.currentValue.toFixed(2)}</p>
                          <p className={`text-sm font-semibold ${position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)} 
                            ({position.unrealizedPnlPercent >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%)
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          {position.yesShares > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/market/${position.market.id}?action=sell&outcome=yes&size=${position.yesShares.toFixed(2)}`);
                              }}
                              data-testid={`button-sell-yes-${position.id}`}
                            >
                              Sell YES
                            </Button>
                          )}
                          {position.noShares > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/market/${position.market.id}?action=sell&outcome=no&size=${position.noShares.toFixed(2)}`);
                              }}
                              data-testid={`button-sell-no-${position.id}`}
                            >
                              Sell NO
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Open Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Open Orders</h2>
          </div>

          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : openOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No open orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {openOrders.map((order: any) => (
                <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => navigate(`/market/${order.marketId}`)}
                      >
                        <p className="font-semibold mb-2">{order.market?.question || 'Unknown Market'}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={order.side === 'buy' ? 'default' : 'secondary'}>
                            {order.side.toUpperCase()}
                          </Badge>
                          <Badge variant={order.outcome ? 'default' : 'secondary'}>
                            {order.outcome ? 'YES' : 'NO'}
                          </Badge>
                          <Badge variant="outline">
                            {formatSharePrice(order.price)} × {order.size.toFixed(2)}
                          </Badge>
                          {order.filled > 0 && (
                            <Badge variant="outline">
                              {order.fillPercentage.toFixed(0)}% Filled
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelOrderMutation.mutate(order.id);
                        }}
                        disabled={cancelOrderMutation.isPending}
                        data-testid={`button-cancel-order-${order.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {/* AMM Swaps Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">AMM Swaps</h2>
            {ammSwapsLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : ammSwaps.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No AMM swaps yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 mb-6">
                {ammSwaps.map((swap: any) => (
                  <Card 
                    key={swap.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/market/${swap.marketId}`)}
                    data-testid={`card-amm-swap-${swap.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <div className="flex gap-2 items-center flex-wrap">
                            <Badge variant="default" className="text-xs">
                              AMM SWAP
                            </Badge>
                            <Badge variant={swap.buyYes ? 'default' : 'secondary'} className="text-xs">
                              {swap.buyYes ? 'BUY YES' : 'BUY NO'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ${swap.amountIn?.toFixed(2)} → {swap.amountOut?.toFixed(2)} tokens
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDistanceToNow(new Date(swap.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="text-xs">
                            COMPLETED
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(swap.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Position Merges Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Position Merges & Redemptions</h2>
            {mergesLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : positionMerges.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No position merges yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 mb-6">
                {positionMerges.map((merge: any) => (
                  <Card 
                    key={merge.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/market/${merge.marketId}`)}
                    data-testid={`card-position-merge-${merge.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <div className="flex gap-2 items-center flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {merge.yesAmount > 0 ? 'MERGE' : 'REDEEM'}
                            </Badge>
                            {merge.yesAmount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {merge.yesAmount.toFixed(2)} YES + {merge.noAmount.toFixed(2)} NO → ${merge.collateralReceived.toFixed(2)} USDT
                              </span>
                            )}
                            {merge.yesAmount === 0 && (
                              <span className="text-xs text-muted-foreground">
                                ${merge.collateralReceived.toFixed(2)} USDT claimed
                              </span>
                            )}
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDistanceToNow(new Date(merge.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="text-xs">
                            COMPLETED
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(merge.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* CLOB Order History Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Order Book History</h2>
              {history.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportHistoryCSV}
                  data-testid="button-export-csv"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>

            {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No trading history yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((order: any) => (
                <Card 
                  key={order.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => navigate(`/market/${order.marketId}`)}
                  data-testid={`card-history-${order.id}`}
                >
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">{order.market?.question || 'Unknown Market'}</p>
                        <div className="flex gap-2 items-center flex-wrap">
                          <Badge variant={order.side === 'buy' ? 'default' : 'secondary'} className="text-xs">
                            {order.side.toUpperCase()}
                          </Badge>
                          <Badge variant={order.outcome ? 'default' : 'secondary'} className="text-xs">
                            {order.outcome ? 'YES' : 'NO'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatSharePrice(order.price)} × {order.size.toFixed(2)}
                          </span>
                          {order.status === 'filled' && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {order.status === 'cancelled' && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          order.status === 'filled' ? 'default' :
                          order.status === 'open' ? 'secondary' :
                          'outline'
                        } className="text-xs">
                          {order.status.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-4">
          <DepositWithdrawPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

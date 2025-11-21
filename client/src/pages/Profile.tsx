import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { formatSharePrice } from '@/lib/priceParser';
import { Trophy, TrendingUp, Award, Sparkles } from 'lucide-react';
import type { Order, Position, Market, RewardsPoints, RewardsHistory } from '@shared/schema';

export default function Profile() {
  const { account: address, connect } = useWallet();
  const isConnected = !!address;

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: address ? ['/api/users', address, 'orders'] : ['disabled'],
    enabled: !!address,
    refetchInterval: 10000,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: address ? ['/api/users', address, 'positions'] : ['disabled'],
    enabled: !!address,
    refetchInterval: 10000,
  });

  const { data: markets } = useQuery<Market[]>({
    queryKey: ['/api/markets'],
    enabled: isConnected,
  });

  const { data: rewards, isLoading: rewardsLoading } = useQuery<RewardsPoints>({
    queryKey: address ? ['/api/rewards/user', address] : ['disabled'],
    enabled: !!address,
  });

  const { data: rewardsHistory, isLoading: rewardsHistoryLoading } = useQuery<RewardsHistory[]>({
    queryKey: address ? ['/api/rewards/history', address] : ['disabled'],
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="text-muted-foreground mb-6">
          Please connect your wallet to view your profile
        </p>
        <Button onClick={handleConnectWallet} data-testid="button-connect-wallet">
          Connect Wallet
        </Button>
      </div>
    );
  }

  const getMarketById = (marketId: string) => {
    return markets?.find(m => m.id === marketId);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground font-mono text-sm" data-testid="wallet-address">
          {address}
        </p>
      </div>

      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="rewards" data-testid="tab-rewards">
            Rewards
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            Order History
          </TabsTrigger>
          <TabsTrigger value="positions" data-testid="tab-positions">
            Positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          {rewardsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {/* Rewards Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Total Points</p>
                  </div>
                  <p className="text-3xl font-bold" data-testid="text-total-points">
                    {rewards?.totalPoints.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Global Rank</p>
                  </div>
                  <p className="text-3xl font-bold" data-testid="text-global-rank">
                    #{rewards?.rank || '-'}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                  <p className="text-3xl font-bold" data-testid="text-weekly-points">
                    {rewards?.weeklyPoints.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                  </p>
                </Card>
              </div>

              {/* Trading Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Trading Activity
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                    <p className="text-xl font-bold" data-testid="text-trading-volume">
                      ${rewards?.totalVolume.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
                    <p className="text-xl font-bold" data-testid="text-trades-count">
                      {rewards?.tradesCount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Markets Created</p>
                    <p className="text-xl font-bold" data-testid="text-markets-created">
                      {rewards?.marketsCreated || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Trade</p>
                    <p className="text-xl font-bold" data-testid="text-last-trade">
                      {rewards?.lastTradeAt ? formatDistanceToNow(new Date(rewards.lastTradeAt), { addSuffix: true }) : 'Never'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Rewards History */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Rewards</h3>
                
                {rewardsHistoryLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : rewardsHistory && rewardsHistory.length > 0 ? (
                  <div className="space-y-3">
                    {rewardsHistory.slice(0, 10).map((reward, index) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                        data-testid={`reward-${index}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" data-testid={`reward-reason-${index}`}>
                              {reward.reason.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground" data-testid={`reward-time-${index}`}>
                              {formatDistanceToNow(new Date(reward.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {reward.metadata && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {(() => {
                                try {
                                  const meta = JSON.parse(reward.metadata);
                                  return meta.volume ? `Volume: $${meta.volume.toFixed(2)}` : '';
                                } catch {
                                  return '';
                                }
                              })()}
                            </p>
                          )}
                        </div>
                        <div className="text-lg font-bold text-primary" data-testid={`reward-points-${index}`}>
                          +{reward.points.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No rewards yet. Start trading to earn points!</p>
                  </div>
                )}
              </Card>

              {/* How to Earn More */}
              <Card className="p-6 bg-primary/5">
                <h3 className="text-lg font-semibold mb-3">How to Earn Points</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <p><strong>Trade Volume:</strong> Earn 1 point per $1 traded</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <p><strong>Market Making:</strong> 2x points for placing limit orders that get filled</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <p><strong>Market Creation:</strong> 10% bonus on total market volume for creators</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order History</h2>
            
            {ordersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => {
                  const market = getMarketById(order.marketId);
                  const remaining = order.size - order.filled;
                  const filledPercentage = (order.filled / order.size) * 100;
                  
                  return (
                    <div 
                      key={order.id}
                      className="border rounded-lg p-4 hover-elevate"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <Link href={`/market/${order.marketId}`}>
                            <div className="font-medium hover:underline mb-1">
                              {market?.question || 'Unknown Market'}
                            </div>
                          </Link>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge 
                              variant={order.side === 'buy' ? 'default' : 'secondary'}
                              data-testid={`order-side-${order.id}`}
                            >
                              {order.side.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant={order.outcome ? 'default' : 'destructive'}
                              data-testid={`order-outcome-${order.id}`}
                            >
                              {order.outcome ? 'YES' : 'NO'}
                            </Badge>
                            <Badge 
                              variant="outline"
                              data-testid={`order-status-${order.id}`}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm" data-testid={`order-price-${order.id}`}>
                            {formatSharePrice(order.price)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <div className="text-muted-foreground mb-1">Size</div>
                          <div className="font-mono" data-testid={`order-size-${order.id}`}>
                            {order.size.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Filled</div>
                          <div className="font-mono" data-testid={`order-filled-${order.id}`}>
                            {order.filled.toFixed(2)} ({filledPercentage.toFixed(0)}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Remaining</div>
                          <div className="font-mono" data-testid={`order-remaining-${order.id}`}>
                            {remaining.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {order.status === 'open' && remaining > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-cancel-${order.id}`}
                          >
                            Cancel Order
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No orders yet</p>
                <Link href="/">
                  <Button variant="outline" className="mt-4">
                    Explore Markets
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Positions</h2>
            
            {positionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : positions && positions.length > 0 ? (
              <div className="space-y-3">
                {positions.map((position) => {
                  const market = getMarketById(position.marketId);
                  const totalShares = position.yesShares + position.noShares;
                  const currentValue = (position.yesShares * (market?.yesPrice || 0)) + 
                                      (position.noShares * (market?.noPrice || 0));
                  const unrealizedPnl = currentValue - position.totalInvested;
                  const totalPnl = unrealizedPnl + position.realizedPnl;
                  
                  return (
                    <div 
                      key={position.id}
                      className="border rounded-lg p-4 hover-elevate"
                      data-testid={`position-${position.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Link href={`/market/${position.marketId}`}>
                            <div className="font-medium hover:underline mb-1">
                              {market?.question || 'Unknown Market'}
                            </div>
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {totalShares.toFixed(2)} total shares
                          </div>
                        </div>
                        <div className={`text-right font-semibold ${totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          <div data-testid={`position-pnl-${position.id}`}>
                            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDT
                          </div>
                          <div className="text-xs">
                            {((totalPnl / position.totalInvested) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-muted-foreground">YES Shares</div>
                            {position.yesShares > 0 && (
                              <Link href={`/market/${position.marketId}?action=sell&outcome=yes&size=${position.yesShares.toFixed(2)}&balance=${position.yesShares.toFixed(2)}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-6 text-xs"
                                  data-testid={`button-sell-yes-${position.id}`}
                                >
                                  Sell
                                </Button>
                              </Link>
                            )}
                          </div>
                          <div className="font-mono font-semibold" data-testid={`position-yes-${position.id}`}>
                            {position.yesShares.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            @ {market ? formatSharePrice(market.yesPrice) : '0¢'}
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-muted-foreground">NO Shares</div>
                            {position.noShares > 0 && (
                              <Link href={`/market/${position.marketId}?action=sell&outcome=no&size=${position.noShares.toFixed(2)}&balance=${position.noShares.toFixed(2)}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-6 text-xs"
                                  data-testid={`button-sell-no-${position.id}`}
                                >
                                  Sell
                                </Button>
                              </Link>
                            )}
                          </div>
                          <div className="font-mono font-semibold" data-testid={`position-no-${position.id}`}>
                            {position.noShares.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            @ {market ? formatSharePrice(market.noPrice) : '0¢'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Invested</div>
                          <div className="font-mono" data-testid={`position-invested-${position.id}`}>
                            ${position.totalInvested.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Current Value</div>
                          <div className="font-mono" data-testid={`position-value-${position.id}`}>
                            ${currentValue.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Realized P&L</div>
                          <div className={`font-mono ${position.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${position.realizedPnl.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No positions yet</p>
                <Link href="/">
                  <Button variant="outline" className="mt-4">
                    Start Trading
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

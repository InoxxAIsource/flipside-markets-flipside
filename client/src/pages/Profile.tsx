import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import type { Order, Position, Market } from '@shared/schema';

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
    queryKey: address ? [`/api/users/${address}/orders`] : ['disabled'],
    enabled: !!address,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: address ? [`/api/users/${address}/positions`] : ['disabled'],
    enabled: !!address,
  });

  const { data: markets } = useQuery<Market[]>({
    queryKey: ['/api/markets'],
    enabled: isConnected,
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

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="orders" data-testid="tab-orders">
            Order History
          </TabsTrigger>
          <TabsTrigger value="positions" data-testid="tab-positions">
            Positions
          </TabsTrigger>
        </TabsList>

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
                            ${order.price.toFixed(2)}
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
                          <div className="text-muted-foreground mb-1">YES Shares</div>
                          <div className="font-mono font-semibold" data-testid={`position-yes-${position.id}`}>
                            {position.yesShares.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            @ ${market?.yesPrice.toFixed(2) || '0.00'}
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                          <div className="text-muted-foreground mb-1">NO Shares</div>
                          <div className="font-mono font-semibold" data-testid={`position-no-${position.id}`}>
                            {position.noShares.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            @ ${market?.noPrice.toFixed(2) || '0.00'}
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

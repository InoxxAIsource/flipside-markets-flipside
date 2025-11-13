import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order } from '@shared/schema';

interface OrderBookProps {
  marketId: string;
}

export function OrderBook({ marketId }: OrderBookProps) {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/markets', marketId, 'orders'],
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Order Book</h2>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  const openOrders = orders?.filter(o => o.status === 'open') || [];
  const buyOrders = openOrders.filter(o => o.side === 'buy').sort((a, b) => b.price - a.price);
  const sellOrders = openOrders.filter(o => o.side === 'sell').sort((a, b) => a.price - b.price);

  const OrderRow = ({ order, isBuy }: { order: Order; isBuy: boolean }) => {
    const remaining = order.size - order.filled;
    const total = order.price * remaining;
    
    return (
      <div 
        className={`grid grid-cols-3 gap-4 p-2 rounded text-sm hover-elevate ${
          isBuy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}
        data-testid={`order-${order.id}`}
      >
        <div className="font-mono" data-testid={`order-price-${order.id}`}>
          ${order.price.toFixed(2)}
        </div>
        <div className="font-mono text-right" data-testid={`order-size-${order.id}`}>
          {remaining.toFixed(2)}
        </div>
        <div className="font-mono text-right" data-testid={`order-total-${order.id}`}>
          ${total.toFixed(2)}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6" data-testid="orderbook">
      <h2 className="text-lg font-semibold mb-4">Order Book</h2>
      
      <div className="space-y-6">
        {/* Sell Orders (Asks) */}
        <div>
          <div className="grid grid-cols-3 gap-4 mb-2 text-xs text-muted-foreground font-medium uppercase">
            <div>Price</div>
            <div className="text-right">Size</div>
            <div className="text-right">Total</div>
          </div>
          
          <div className="space-y-1 min-h-[120px]">
            {sellOrders.length > 0 ? (
              sellOrders.slice(0, 5).map(order => (
                <OrderRow key={order.id} order={order} isBuy={false} />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No sell orders
              </div>
            )}
          </div>
        </div>

        {/* Current Price Separator */}
        <div className="border-t border-b py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Spread</span>
            <div className="font-mono text-lg font-semibold">
              {buyOrders.length > 0 && sellOrders.length > 0 ? (
                <span data-testid="spread">
                  ${(sellOrders[0].price - buyOrders[0].price).toFixed(3)}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Buy Orders (Bids) */}
        <div>
          <div className="space-y-1 min-h-[120px]">
            {buyOrders.length > 0 ? (
              buyOrders.slice(0, 5).map(order => (
                <OrderRow key={order.id} order={order} isBuy={true} />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No buy orders
              </div>
            )}
          </div>
        </div>

        {/* Order Book Stats */}
        <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Total Orders</div>
            <div className="font-semibold" data-testid="total-orders">
              {openOrders.length}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Active Traders</div>
            <div className="font-semibold" data-testid="active-traders">
              {new Set(openOrders.map(o => o.makerAddress)).size}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

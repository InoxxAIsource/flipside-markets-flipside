import { storage } from "../storage";
import { orderMatcher } from "./orderMatcher";

/**
 * Stop-Loss Monitoring Service
 * Monitors market prices and triggers stop-loss orders when stopPrice threshold is hit
 */
class StopLossMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the stop-loss monitoring service
   * Runs every 10 seconds to check for triggered stop-loss orders
   */
  start(): void {
    if (this.isRunning) {
      console.log('[StopLossMonitor] Already running');
      return;
    }

    console.log('[StopLossMonitor] Starting stop-loss monitoring service...');
    this.isRunning = true;

    // Run immediately on start
    this.checkStopLossOrders();

    // Then run every 10 seconds
    this.intervalId = setInterval(() => {
      this.checkStopLossOrders();
    }, 10000); // 10 seconds

    console.log('[StopLossMonitor] Service started successfully');
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[StopLossMonitor] Service stopped');
  }

  /**
   * Check all open stop-loss orders and trigger them if price conditions are met
   */
  private async checkStopLossOrders(): Promise<void> {
    try {
      // Get all markets to check their prices
      const markets = await storage.getAllMarkets();

      for (const market of markets) {
        if (market.resolved) continue;

        // Get all open stop-loss orders for this market
        const orders = await storage.getMarketOrders(market.id, 'open');
        const stopLossOrders = orders.filter(o => o.orderType === 'stop-loss' && o.stopPrice);

        if (stopLossOrders.length === 0) continue;

        // Calculate live best bid/ask prices from order book
        const allOpenOrders = orders.filter(o => o.status === 'open' && o.orderType !== 'stop-loss');
        const yesBids = allOpenOrders.filter(o => o.side === 'buy' && o.outcome === true);
        const yesAsks = allOpenOrders.filter(o => o.side === 'sell' && o.outcome === true);
        const noBids = allOpenOrders.filter(o => o.side === 'buy' && o.outcome === false);
        const noAsks = allOpenOrders.filter(o => o.side === 'sell' && o.outcome === false);

        // CRITICAL: Only use live order book prices, no fallback to stale market prices
        const bestYesBid = yesBids.length > 0 ? Math.max(...yesBids.map(o => o.price)) : null;
        const bestNoBid = noBids.length > 0 ? Math.max(...noBids.map(o => o.price)) : null;

        // Check each stop-loss order
        for (const order of stopLossOrders) {
          // Check if order is expired
          const now = new Date();
          if (order.expiration && new Date(order.expiration) < now) {
            await storage.updateOrder(order.id, { status: 'cancelled' });
            console.log(`[StopLossMonitor] Cancelled expired stop-loss order ${order.id}`);
            continue;
          }

          // Determine which price to check based on order outcome
          // For sell orders, use the bid price (what buyers are willing to pay)
          const currentPrice = order.outcome ? bestYesBid : bestNoBid;

          // Skip if no live pricing available - don't fall back to stale cached prices
          if (currentPrice === null) {
            continue;
          }

          // For sell orders, trigger when price drops to or below stopPrice
          if (order.side === 'sell' && currentPrice <= order.stopPrice!) {
            console.log(
              `[StopLossMonitor] Triggering stop-loss order ${order.id}: ` +
              `current=${currentPrice.toFixed(3)}, stop=${order.stopPrice!.toFixed(3)}`
            );

            // Mark as triggered by changing status to 'triggered' temporarily
            // This prevents repeated conversions while the order is being matched
            await storage.updateOrder(order.id, {
              orderType: 'limit', // Convert to regular limit order for matching
              // Note: We keep the order in 'open' status so it can be matched
              // The orderMatcher will handle it as a regular limit order now
            });

            // Re-fetch the updated order
            const updatedOrder = await storage.getOrder(order.id);
            if (updatedOrder) {
              // Try to match it immediately
              await orderMatcher.matchOrder(updatedOrder);
            }
          }
        }
      }
    } catch (error) {
      console.error('[StopLossMonitor] Error checking stop-loss orders:', error);
    }
  }
}

// Export singleton instance
export const stopLossMonitor = new StopLossMonitor();

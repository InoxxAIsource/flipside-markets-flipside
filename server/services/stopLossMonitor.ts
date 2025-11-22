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
        const stopLossOrders = orders.filter(o => o.orderType === 'stop-loss');

        if (stopLossOrders.length === 0) continue;

        // Check each stop-loss order
        for (const order of stopLossOrders) {
          if (!order.stopPrice) continue;

          // Determine which price to check based on order outcome
          const currentPrice = order.outcome ? market.yesPrice : market.noPrice;

          // For sell orders, trigger when price drops to or below stopPrice
          if (order.side === 'sell' && currentPrice <= order.stopPrice) {
            console.log(
              `[StopLossMonitor] Triggering stop-loss order ${order.id}: ` +
              `current=${currentPrice.toFixed(3)}, stop=${order.stopPrice.toFixed(3)}`
            );

            // Convert to regular limit order and trigger matching
            await storage.updateOrder(order.id, {
              orderType: 'limit', // Convert to regular limit order
            });

            // Re-fetch the updated order
            const updatedOrder = await storage.getOrder(order.id);
            if (updatedOrder) {
              // Try to match it
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

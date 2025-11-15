import { storage } from "../storage";
import { web3Service } from "../contracts/web3Service";
import type { Order, InsertOrderFill, InsertPosition } from "@shared/schema";

export class OrderMatcher {
  /**
   * Match a new order against existing orders in the order book
   */
  async matchOrder(newOrder: Order): Promise<void> {
    // Get opposite side orders for the same market
    const oppositeSide = newOrder.side === 'buy' ? 'sell' : 'buy';
    const existingOrders = await storage.getMarketOrders(newOrder.marketId, 'open');
    
    console.log(`[OrderMatcher] New ${newOrder.side} order: price=${newOrder.price}, size=${newOrder.size}`);
    console.log(`[OrderMatcher] Found ${existingOrders.length} existing open orders`);
    
    // Filter for opposite side with same outcome
    const matchableOrders = existingOrders.filter(
      (order) => 
        order.side === oppositeSide && 
        order.outcome === newOrder.outcome &&
        this.canMatch(newOrder, order)
    );
    
    console.log(`[OrderMatcher] Found ${matchableOrders.length} matchable ${oppositeSide} orders`);

    // Sort by price-time priority (price first, then timestamp for same price)
    matchableOrders.sort((a, b) => {
      if (newOrder.side === 'buy') {
        // We're buying, prefer lowest sell prices, then earliest timestamp
        const priceDiff = a.price - b.price;
        if (Math.abs(priceDiff) > 0.0001) return priceDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      } else {
        // We're selling, prefer highest buy prices, then earliest timestamp
        const priceDiff = b.price - a.price;
        if (Math.abs(priceDiff) > 0.0001) return priceDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
    });

    // Track total filled amount across all matches
    let totalFilled = newOrder.filled;

    // Try to fill against each matchable order
    for (const matchingOrder of matchableOrders) {
      const remainingSize = newOrder.size - totalFilled;
      if (remainingSize <= 0) break;

      const matchingOrderRemaining = matchingOrder.size - matchingOrder.filled;
      const fillSize = Math.min(remainingSize, matchingOrderRemaining);

      if (fillSize > 0) {
        console.log(`[OrderMatcher] Executing fill: ${fillSize} @ ${matchingOrder.price}`);
        await this.executeFill(newOrder, matchingOrder, fillSize);
        totalFilled += fillSize;
      }
    }
    
    console.log(`[OrderMatcher] Total filled: ${totalFilled}/${newOrder.size}`);

    // Re-query the order from database to get latest state after all fills
    const updatedOrder = await storage.getOrder(newOrder.id);
    if (updatedOrder && updatedOrder.filled >= updatedOrder.size) {
      await storage.updateOrder(newOrder.id, { status: 'filled' });
    }
  }

  /**
   * Check if two orders can be matched
   */
  private canMatch(order1: Order, order2: Order): boolean {
    // Orders must be for opposite sides
    if (order1.side === order2.side) return false;

    // Orders must be for the same outcome
    if (order1.outcome !== order2.outcome) return false;

    // Check if prices cross (buyer willing to pay >= seller asking)
    if (order1.side === 'buy') {
      return order1.price >= order2.price;
    } else {
      return order2.price >= order1.price;
    }
  }

  /**
   * Execute a fill between two orders
   */
  private async executeFill(
    takerOrder: Order,
    makerOrder: Order,
    fillSize: number
  ): Promise<void> {
    // Use maker's price for the fill
    const fillPrice = makerOrder.price;

    // Create order fill record
    const fill: InsertOrderFill = {
      orderId: makerOrder.id,
      marketId: makerOrder.marketId,
      makerAddress: makerOrder.makerAddress,
      takerAddress: takerOrder.makerAddress,
      outcome: makerOrder.outcome,
      price: fillPrice,
      size: fillSize,
      txHash: null, // Will be updated when on-chain transaction is confirmed
      blockNumber: null,
    };

    await storage.createOrderFill(fill);

    // Update order filled amounts
    await storage.updateOrder(makerOrder.id, {
      filled: makerOrder.filled + fillSize,
      status: (makerOrder.filled + fillSize >= makerOrder.size) ? 'filled' : 'open',
    });

    await storage.updateOrder(takerOrder.id, {
      filled: takerOrder.filled + fillSize,
      status: (takerOrder.filled + fillSize >= takerOrder.size) ? 'filled' : 'open',
    });

    // Update positions for both users
    await this.updatePosition(
      makerOrder.makerAddress,
      makerOrder.marketId,
      makerOrder.outcome,
      makerOrder.side === 'buy' ? fillSize : -fillSize,
      fillSize * fillPrice
    );

    await this.updatePosition(
      takerOrder.makerAddress,
      takerOrder.marketId,
      takerOrder.outcome,
      takerOrder.side === 'buy' ? fillSize : -fillSize,
      fillSize * fillPrice
    );

    // Update market statistics
    const market = await storage.getMarket(makerOrder.marketId);
    if (market) {
      const newVolume = market.volume + (fillSize * fillPrice);
      
      // Recalculate market prices based on filled orders
      const allFills = await storage.getMarketFills(makerOrder.marketId);
      const yesVolume = allFills
        .filter(f => f.outcome === true)
        .reduce((sum, f) => sum + (f.size * f.price), 0);
      const noVolume = allFills
        .filter(f => f.outcome === false)
        .reduce((sum, f) => sum + (f.size * f.price), 0);
      
      const totalVolume = yesVolume + noVolume;
      const yesPrice = totalVolume > 0 ? yesVolume / totalVolume : 0.5;
      const noPrice = 1 - yesPrice;

      await storage.updateMarket(makerOrder.marketId, {
        volume: newVolume,
        yesPrice,
        noPrice,
      });
    }
  }

  /**
   * Update user position in a market
   */
  private async updatePosition(
    userAddress: string,
    marketId: string,
    outcome: boolean,
    shareDelta: number,
    investment: number
  ): Promise<void> {
    const existingPosition = await storage.getUserPosition(userAddress, marketId);

    if (existingPosition) {
      const newYesShares = outcome 
        ? existingPosition.yesShares + shareDelta
        : existingPosition.yesShares;
      
      const newNoShares = !outcome
        ? existingPosition.noShares + shareDelta
        : existingPosition.noShares;

      const newTotalInvested = shareDelta > 0
        ? existingPosition.totalInvested + investment
        : existingPosition.totalInvested - investment;

      await storage.updatePosition(existingPosition.id, {
        yesShares: newYesShares,
        noShares: newNoShares,
        totalInvested: newTotalInvested,
      });
    } else {
      const position: InsertPosition = {
        userAddress,
        marketId,
        yesShares: outcome ? shareDelta : 0,
        noShares: !outcome ? shareDelta : 0,
        totalInvested: investment,
        realizedPnl: 0,
      };

      await storage.upsertPosition(position);
    }
  }

  /**
   * Validate an order before accepting it
   */
  async validateOrder(order: Order): Promise<{ valid: boolean; error?: string }> {
    // Check if market exists
    const market = await storage.getMarket(order.marketId);
    if (!market) {
      return { valid: false, error: 'Market not found' };
    }

    // Check if market is expired
    if (new Date(market.expiresAt) < new Date()) {
      return { valid: false, error: 'Market has expired' };
    }

    // Check if market is resolved
    if (market.resolved) {
      return { valid: false, error: 'Market is already resolved' };
    }

    // Check if order is expired
    if (new Date(order.expiration) < new Date()) {
      return { valid: false, error: 'Order has expired' };
    }

    // Validate price range (0.01 to 0.99)
    if (order.price < 0.01 || order.price > 0.99) {
      return { valid: false, error: 'Price must be between 0.01 and 0.99' };
    }

    // Validate size
    if (order.size <= 0) {
      return { valid: false, error: 'Size must be positive' };
    }

    return { valid: true };
  }
}

export const orderMatcher = new OrderMatcher();

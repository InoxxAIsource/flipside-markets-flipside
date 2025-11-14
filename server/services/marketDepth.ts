import { type Order } from "@shared/schema";

export interface PriceLevel {
  price: number;
  size: number;
  total: number;
  orderCount: number;
}

export interface OrderBookDepth {
  bids: PriceLevel[];
  asks: PriceLevel[];
  spread: number | null;
  spreadPercentage: number | null;
  totalBidVolume: number;
  totalAskVolume: number;
  midPrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}

export class MarketDepthCalculator {
  /**
   * Calculate order book depth from list of orders
   */
  static calculateDepth(orders: Order[]): OrderBookDepth {
    // Filter active orders only
    const activeOrders = orders.filter(o => o.status === 'open');
    
    // Separate buy and sell orders
    const buyOrders = activeOrders.filter(o => o.side === 'buy');
    const sellOrders = activeOrders.filter(o => o.side === 'sell');
    
    // Calculate bid price levels (aggregated buy orders)
    const bids = this.aggregatePriceLevels(buyOrders, 'buy');
    
    // Calculate ask price levels (aggregated sell orders)
    const asks = this.aggregatePriceLevels(sellOrders, 'sell');
    
    // Get best bid and ask
    const bestBid = bids.length > 0 ? bids[0].price : null;
    const bestAsk = asks.length > 0 ? asks[0].price : null;
    
    // Calculate spread
    const spread = bestBid !== null && bestAsk !== null 
      ? bestAsk - bestBid 
      : null;
    
    // Calculate mid price
    const midPrice = bestBid !== null && bestAsk !== null
      ? (bestBid + bestAsk) / 2
      : null;
    
    // Calculate spread percentage
    const spreadPercentage = spread !== null && midPrice !== null && midPrice > 0
      ? (spread / midPrice) * 100
      : null;
    
    // Calculate total volumes
    const totalBidVolume = bids.reduce((sum, level) => sum + level.size, 0);
    const totalAskVolume = asks.reduce((sum, level) => sum + level.size, 0);
    
    return {
      bids,
      asks,
      spread,
      spreadPercentage,
      totalBidVolume,
      totalAskVolume,
      midPrice,
      bestBid,
      bestAsk,
    };
  }

  /**
   * Aggregate orders into price levels
   */
  private static aggregatePriceLevels(
    orders: Order[],
    side: 'buy' | 'sell'
  ): PriceLevel[] {
    // Group orders by price
    const priceMap = new Map<number, Order[]>();
    
    for (const order of orders) {
      const price = order.price;
      if (!priceMap.has(price)) {
        priceMap.set(price, []);
      }
      priceMap.get(price)!.push(order);
    }
    
    // Convert to price levels
    const levels: PriceLevel[] = [];
    for (const [price, ordersAtPrice] of priceMap.entries()) {
      // Calculate remaining size (size - filled)
      const size = ordersAtPrice.reduce((sum, order) => {
        const remaining = order.size - (order.filled || 0);
        // Guard against negative remaining
        return sum + Math.max(0, remaining);
      }, 0);
      
      // Skip if no remaining size
      if (size <= 0) continue;
      
      levels.push({
        price,
        size,
        total: price * size,
        orderCount: ordersAtPrice.length,
      });
    }
    
    // Sort: bids high to low, asks low to high
    levels.sort((a, b) => {
      return side === 'buy' 
        ? b.price - a.price  // Descending for bids
        : a.price - b.price; // Ascending for asks
    });
    
    return levels;
  }

  /**
   * Calculate liquidity distribution (volume at different price levels)
   */
  static calculateLiquidityDistribution(
    depth: OrderBookDepth,
    priceRanges: number[]
  ): { range: number; bidVolume: number; askVolume: number }[] {
    const midPrice = depth.midPrice;
    if (midPrice === null) return [];
    
    return priceRanges.map(range => {
      const lowerBound = midPrice * (1 - range);
      const upperBound = midPrice * (1 + range);
      
      const bidVolume = depth.bids
        .filter(level => level.price >= lowerBound && level.price <= midPrice)
        .reduce((sum, level) => sum + level.size, 0);
      
      const askVolume = depth.asks
        .filter(level => level.price >= midPrice && level.price <= upperBound)
        .reduce((sum, level) => sum + level.size, 0);
      
      return {
        range,
        bidVolume,
        askVolume,
      };
    });
  }

  /**
   * Calculate market quality metrics
   */
  static calculateMarketQuality(depth: OrderBookDepth): {
    tightness: 'tight' | 'moderate' | 'wide' | 'no_liquidity';
    depth_score: number;
    resilience: number;
  } {
    const { spread, spreadPercentage, totalBidVolume, totalAskVolume } = depth;
    
    // Tightness: how small is the spread
    let tightness: 'tight' | 'moderate' | 'wide' | 'no_liquidity';
    if (spreadPercentage === null) {
      tightness = 'no_liquidity';
    } else if (spreadPercentage < 1) {
      tightness = 'tight';
    } else if (spreadPercentage < 5) {
      tightness = 'moderate';
    } else {
      tightness = 'wide';
    }
    
    // Depth: how much volume is available
    const totalVolume = totalBidVolume + totalAskVolume;
    const depth_score = Math.min(totalVolume / 1000, 100); // 0-100 score
    
    // Resilience: how balanced is the book
    const imbalance = Math.abs(totalBidVolume - totalAskVolume);
    const resilience = totalVolume > 0 
      ? (1 - (imbalance / totalVolume)) * 100 
      : 0;
    
    return {
      tightness,
      depth_score,
      resilience,
    };
  }
}

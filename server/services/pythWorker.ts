import { storage } from "../storage";
import { web3Service } from "../contracts/web3Service";
import type { InsertPythPriceUpdate } from "@shared/schema";

/**
 * Background worker service for Pyth Network price feed updates
 */
export class PythWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private updateInterval = 30000; // 30 seconds

  /**
   * Start the Pyth price feed worker
   */
  start() {
    if (this.isRunning) {
      console.log('Pyth worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Pyth price feed worker...');

    // Start periodic updates
    this.intervalId = setInterval(async () => {
      await this.updatePriceFeeds();
    }, this.updateInterval);

    // Run immediately on start
    this.updatePriceFeeds();

    console.log(`Pyth worker started (update interval: ${this.updateInterval}ms)`);
  }

  /**
   * Stop the Pyth price feed worker
   */
  stop() {
    if (!this.isRunning) {
      console.log('Pyth worker is not running');
      return;
    }

    console.log('Stopping Pyth price feed worker...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Pyth worker stopped');
  }

  /**
   * Update price feeds for all active markets with Pyth integration
   */
  private async updatePriceFeeds() {
    try {
      // Get all active markets with Pyth price feeds
      const markets = await storage.getAllMarkets();
      const pythMarkets = markets.filter(m => 
        m.pythPriceFeedId && 
        !m.resolved && 
        new Date(m.expiresAt) > new Date()
      );

      if (pythMarkets.length === 0) {
        return;
      }

      console.log(`Updating ${pythMarkets.length} Pyth price feeds...`);

      // Update each market's price feed
      for (const market of pythMarkets) {
        try {
          await this.updateMarketPrice(market);
        } catch (error: any) {
          console.error(`Failed to update price for market ${market.id}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('Error in price feed update cycle:', error);
    }
  }

  /**
   * Update price for a specific market
   */
  private async updateMarketPrice(market: any) {
    if (!market.pythPriceFeedId || !market.conditionId) {
      return;
    }

    try {
      // Fetch price from Pyth via resolver contract
      const priceData = await web3Service.getLatestPrice(market.pythPriceFeedId);
      
      if (!priceData) {
        console.log(`No price data available for market ${market.id}`);
        return;
      }

      const { price, conf: confidence, publishTime, expo } = priceData;

      // Normalize price using the actual exponent from Pyth
      const normalizedPrice = parseFloat(price.toString()) * Math.pow(10, expo);
      const normalizedConfidence = parseFloat(confidence.toString()) * Math.pow(10, expo);

      // Store price update in database
      const priceUpdate: InsertPythPriceUpdate = {
        priceFeedId: market.pythPriceFeedId,
        price: normalizedPrice,
        confidence: normalizedConfidence,
        publishTime: new Date(Number(publishTime) * 1000),
        exponent: expo,
      };

      await storage.createPriceUpdate(priceUpdate);

      // Check if market should be resolved (with confidence verification)
      if (market.baselinePrice) {
        await this.checkMarketResolution(market, priceUpdate);
      }

      console.log(`Updated price for ${market.pythPriceFeedId}: $${normalizedPrice.toFixed(2)} ±${normalizedConfidence.toFixed(2)}`);
    } catch (error: any) {
      console.error(`Error updating price for market ${market.id}:`, error.message);
    }
  }

  /**
   * Check if a market should be resolved based on price conditions
   */
  private async checkMarketResolution(market: any, priceUpdate: { price: number; confidence: number; publishTime: Date }) {
    // Skip if already resolved or expired
    if (market.resolved || new Date(market.expiresAt) < new Date()) {
      return;
    }

    // CRITICAL: Verify confidence before using price data
    const MAX_CONFIDENCE_THRESHOLD = priceUpdate.price * 0.01; // 1% of price
    const MAX_STALENESS_MS = 60000; // 1 minute
    
    const now = Date.now();
    const publishTimestamp = priceUpdate.publishTime.getTime();
    const isStale = (now - publishTimestamp) > MAX_STALENESS_MS;
    const isLowConfidence = priceUpdate.confidence > MAX_CONFIDENCE_THRESHOLD;

    if (isStale) {
      console.warn(`Market ${market.id}: Price data is stale (${Math.floor((now - publishTimestamp) / 1000)}s old)`);
      return;
    }

    if (isLowConfidence) {
      console.warn(`Market ${market.id}: Low confidence - confidence ${priceUpdate.confidence.toFixed(2)} > threshold ${MAX_CONFIDENCE_THRESHOLD.toFixed(2)}`);
      return;
    }

    // Check if condition is met
    let shouldResolve = false;
    let outcome = false;

    if (market.baselinePrice) {
      // For price-based markets, resolve YES if current price >= baseline
      if (priceUpdate.price >= market.baselinePrice) {
        shouldResolve = true;
        outcome = true;
        console.log(`Market ${market.id} condition met: ${priceUpdate.price.toFixed(2)} >= ${market.baselinePrice}`);
      }
    }

    if (shouldResolve) {
      try {
        // Resolve market
        await storage.resolveMarket(market.id, outcome);
        console.log(`Market ${market.id} auto-resolved: ${outcome ? 'YES' : 'NO'} (confidence: ${priceUpdate.confidence.toFixed(2)})`);

        // In production, this would also trigger on-chain resolution
        // via web3Service.resolveCondition(market.conditionId, outcome)
      } catch (error: any) {
        console.error(`Failed to resolve market ${market.id}:`, error.message);
      }
    }
  }

  /**
   * Check if worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Set update interval (in milliseconds)
   */
  setUpdateInterval(interval: number) {
    this.updateInterval = interval;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

export const pythWorker = new PythWorker();
